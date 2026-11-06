#!/usr/bin/env node
// Sky Pano — eklentideki skill, agent, komut ve hook'ları tek, bağımsız bir HTML sayfasına derler.
// Kullanım: node dashboard/build.mjs [--out <dosya.html>] [--open]
// Modül olarak: buildData() + renderHtml() — dashboard/server.mjs bunları canlı sunucu için kullanır.
// Bağımlılık yok; yalnızca Node 18+.
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";

const HERE = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.resolve(HERE, "..");

const abs = (rel) => path.join(ROOT, rel);
const read = (rel) => fs.readFileSync(abs(rel), "utf8");
const exists = (rel) => fs.existsSync(abs(rel));
const countWords = (s) => (s.match(/[\p{L}\p{N}_'’-]+/gu) || []).length;
const uniq = (arr) => [...new Set(arr)];
const warnings = [];

// ---------- frontmatter ----------
const unquote = (v) => (/^(["']).*\1$/.test(v) ? v.slice(1, -1) : v);
function parseFrontmatter(text) {
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!m) return { meta: {}, body: text };
  const meta = {};
  let key = null;
  for (const line of m[1].split(/\r?\n/)) {
    const kv = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (kv) {
      key = kv[1];
      const v = kv[2].trim();
      meta[key] = /^[>|][+-]?$/.test(v) ? "" : unquote(v);
    } else if (key && /^\s+\S/.test(line)) {
      meta[key] = (meta[key] ? meta[key] + " " : "") + line.trim();
    }
  }
  return { meta, body: text.slice(m[0].length) };
}

// ---------- router (skills/sky/SKILL.md) ----------
// Router kategorileri panoda daha az, daha okunur gruplara toplanır.
const GROUPS = [
  ["Frontend", ["Frontend", "Diğer frontend framework'leri", "Web platformu & diller"]],
  ["Backend & Veri", ["Backend & veri", "Veri katmanları"]],
  ["Tasarım & UX", ["Tasarım & UX"]],
  ["Ürün & Proje", ["Ürün türleri & yol haritaları"]],
  ["Diller", ["Diller & framework'ler"]],
  ["Altyapı & Bulut", ["Altyapı & DevOps", "Altyapı (ek)", "Platformlar & hazır backend"]],
  ["AI & ML", ["ML & veri"]],
  ["Mühendislik", ["Operasyon & mühendislik", "İş akışı & mühendislik", "Araçlar & otomasyon"]],
  ["Güvenlik", ["Güvenlik & kripto"]],
  ["Kariyer", ["Kariyer & topluluk"]],
  ["Claude Code", ["Claude Code"]],
  ["Uzman rehberler", ["Uzman rehberler"]],
];
const GROUP_OVERRIDE = {
  sky: "Çekirdek",
  "sky-ai": "AI & ML",
  "sky-ai-eval": "AI & ML",
  "sky-ai-agents": "AI & ML",
};
const catToGroup = new Map(GROUPS.flatMap(([g, cats]) => cats.map((c) => [c, g])));

function parseRouter() {
  const text = read("skills/sky/SKILL.md");
  const skillCat = {}, skillSignals = {}, agentUse = {}, agentSkills = {};
  const workflow = [], rules = [];
  let section = "", cat = null, header = null;
  for (const line of text.split(/\r?\n/)) {
    if (line.startsWith("## ")) { section = line.slice(3).trim(); cat = null; header = null; continue; }
    if (line.startsWith("### ")) { cat = line.slice(4).trim(); header = null; continue; }
    if (section.startsWith("4.")) {
      const m = line.match(/^\d+\.\s+\*\*(.+?)\*\*\s*[—-]\s*(.*)$/);
      if (m) workflow.push({ title: m[1], text: m[2] });
      else if (/^\s{2,}\S/.test(line) && workflow.length) workflow.at(-1).text += " " + line.trim();
    }
    if (section.startsWith("5.")) {
      const m = line.match(/^-\s+\*\*(.+?)\*\*\s*(.*)$/);
      if (m) rules.push({ title: m[1].replace(/[:：]\s*$/, ""), text: m[2].replace(/^[:：]\s*/, "") });
    }
    if (!line.startsWith("|")) continue;
    const cells = line.split("|").slice(1, -1).map((s) => s.trim());
    if (cells.every((c) => /^:?-+:?$/.test(c))) continue;
    if (!header) { header = cells; continue; }
    const names = (cell) => [...(cell || "").matchAll(/`(sky-[a-z0-9-]+)`/g)].map((m) => m[1]);
    if (section.includes("Yönlendirme") && cat) {
      const si = header.indexOf("Skill"), ai = header.indexOf("Agent");
      const sk = names(cells[si >= 0 ? si : cells.length - 1]);
      for (const n of sk) {
        skillCat[n] ??= cat;
        (skillSignals[n] ??= []).push(cells[0]);
      }
      if (ai >= 0) for (const a of names(cells[ai])) (agentSkills[a] ??= []).push(...sk);
    } else if (section.includes("Agent")) {
      for (const n of names(cells[0])) agentUse[n] = cells[1] || "";
    }
  }
  return { skillCat, skillSignals, agentUse, agentSkills, workflow, rules };
}

// ---------- prompt-skill.js tetikleyicileri ----------
function promptTriggers() {
  const out = {};
  try {
    const src = read("hooks/prompt-skill.js");
    const start = src.indexOf("const MAP = [");
    const end = src.indexOf("\n];", start);
    if (start < 0 || end < 0) return out;
    const literal = src.slice(start + "const MAP = ".length, end + 3);
    const map = vm.runInNewContext(literal, Object.create(null), { timeout: 500 });
    for (const [terms, skills] of map) for (const s of skills) out[s] = uniq([...(out[s] || []), ...terms]);
  } catch (e) {
    warnings.push("prompt-skill.js okunamadı: " + e.message);
  }
  return out;
}

// ---------- hook açıklamaları ----------
const HOOK_META = {
  "session-start.js": {
    title: "Stack tanıma",
    key: "session",
    desc: "Oturum başında projeyi tarar (package.json, pyproject, go.mod, Cargo.toml, Dockerfile, Terraform, workflow'lar…). Stack özetini ve ilgili Sky skill'lerini bağlama ekler; CLAUDE.md yoksa hatırlatır.",
  },
  "prompt-skill.js": {
    title: "Skill önerisi",
    key: "prompt",
    desc: "Yazdığın isteğe bakıp en fazla 4 ilgili skill önerir. Türkçe İ/ı dönüşümüne dayanıklıdır; / ile başlayan komutlara karışmaz.",
  },
  "pre-bash.js": {
    title: "Tehlike & paket kalkanı",
    key: "danger · packages",
    desc: "rm -rf, force push, reset --hard, DROP/TRUNCATE, veri kaybettiren migration, prod deploy, npm publish ve curl | sh gibi komutlarda onay ister. Paket kurulumunda typosquat, 30 günden yeni ve kayıt defterinde olmayan paketleri yakalar.",
  },
  "pre-write.js": {
    title: ".env koruması",
    key: "env",
    desc: ".env dosyalarına yazmadan önce onay ister; .example, .sample, .template ve .defaults serbesttir.",
  },
  "sky-quality.js": {
    title: "Web kalite kontrolü",
    key: "SKY_HOOKS=off",
    desc: "console.log, any, tıklanabilir div, alt metni olmayan görsel, outline:none, ham hex renk, keyfi Tailwind değeri, dangerouslySetInnerHTML, istemciye sızan gizli anahtar ve güvensiz ham SQL.",
  },
  "post-edit.js": {
    title: "Güvenlik, SEO & kontrast",
    key: "post-edit",
    desc: "Yıkıcı migration, yetki kontrolü olmayan route/server action, imzasız webhook, metadata'sız sayfa, ham <img>, istemciye sızan sunucu modülü, WCAG kontrastı, sen/siz karışımı ve çevrilmemiş arayüz metni.",
  },
  "lang-quality.js": {
    title: "Dil kalite kontrolü",
    key: "lang",
    desc: "Python, Go, Rust, PHP, Ruby, Dart, Kotlin, Swift, Dockerfile ve GitHub Actions dosyalarında dile özgü tuzaklar: bare except, panic, unwrap, dd(), sabitlenmemiş imaj ve action, eksik izinler…",
  },
  "stop.js": {
    title: "Kalıntı taraması",
    key: "stop",
    desc: "Tur sonunda yalnızca eklenen satırlarda console.log, debugger, .only, @ts-ignore, dbg!, dd() ve atlanmış testleri arar. Bir kez durdurup temizletir, döngüye girmez.",
  },
};
const EVENT_META = {
  SessionStart: { label: "Oturum başlar", hint: "Proje açılınca bir kez" },
  UserPromptSubmit: { label: "Sen yazarsın", hint: "Her istekte" },
  PreToolUse: { label: "Araç çalışmadan önce", hint: "Onay gerekebilir" },
  PostToolUse: { label: "Dosya düzenlendikten sonra", hint: "Geri bildirim verir" },
  Stop: { label: "Tur biter", hint: "Son kontrol" },
};

// ---------- kurulum durumu ----------
function installState() {
  try {
    const f = path.join(os.homedir(), ".claude", "plugins", "installed_plugins.json");
    const j = JSON.parse(fs.readFileSync(f, "utf8"));
    const plugins = j.plugins || j;
    const id = Object.keys(plugins).find((k) => k === "sky" || k.startsWith("sky@"));
    return id ? { installed: true, id } : { installed: false };
  } catch {
    return { installed: null };
  }
}

function listFiles(rel) {
  const out = [];
  const walk = (dir) => {
    for (const d of fs.readdirSync(abs(dir), { withFileTypes: true })) {
      const p = path.posix.join(dir, d.name);
      if (d.isDirectory()) walk(p);
      else out.push(p);
    }
  };
  walk(rel);
  return out.sort();
}

// ---------- topla ----------
export function buildData({ live = false } = {}) {
  warnings.length = 0;
  const plugin = JSON.parse(read(".claude-plugin/plugin.json"));
  const router = parseRouter();
  const triggers = promptTriggers();

  const skills = fs
    .readdirSync(abs("skills"), { withFileTypes: true })
    .filter((d) => d.isDirectory() && exists(`skills/${d.name}/SKILL.md`))
    .map((d) => d.name)
    .sort()
    .map((dir) => {
      const { meta, body } = parseFrontmatter(read(`skills/${dir}/SKILL.md`));
      const name = meta.name || dir;
      const cat = router.skillCat[name] || "";
      const group = GROUP_OVERRIDE[name] || catToGroup.get(cat) || cat || "Diğer";
      if (cat && !catToGroup.has(cat) && !GROUP_OVERRIDE[name]) warnings.push(`Gruplanmamış kategori: ${cat}`);
      if (!cat && name !== "sky") warnings.push(`Router'da olmayan skill: ${name}`);
      const refs = listFiles(`skills/${dir}`)
        .filter((f) => !f.endsWith("/SKILL.md"))
        .map((f) => {
          const size = fs.statSync(abs(f)).size;
          const text = size < 80_000 && /\.(md|css|js|ts|json|ya?ml|txt|html|sh|py|sql)$/i.test(f);
          return { path: f.replace(`skills/${dir}/`, ""), size, content: text ? read(f) : null };
        });
      return {
        type: "skill",
        name,
        desc: meta.description || "",
        cat,
        group,
        signals: router.skillSignals[name] || [],
        triggers: triggers[name] || [],
        words: countWords(body),
        body,
        refs,
      };
    });

  const agents = fs
    .readdirSync(abs("agents"))
    .filter((f) => f.endsWith(".md"))
    .sort()
    .map((f) => {
      const { meta, body } = parseFrontmatter(read(`agents/${f}`));
      const name = meta.name || f.replace(/\.md$/, "");
      return {
        type: "agent",
        name,
        desc: meta.description || "",
        use: router.agentUse[name] || "",
        tools: (meta.tools || "").split(",").map((s) => s.trim()).filter(Boolean),
        model: meta.model || "inherit",
        pairs: uniq(router.agentSkills[name] || []),
        words: countWords(body),
        body,
      };
    });

  const commands = fs
    .readdirSync(abs("commands"))
    .filter((f) => f.endsWith(".md"))
    .sort()
    .map((f) => {
      const { meta, body } = parseFrontmatter(read(`commands/${f}`));
      return {
        type: "command",
        name: f.replace(/\.md$/, ""),
        desc: meta.description || "",
        hint: meta["argument-hint"] || "",
        words: countWords(body),
        body,
      };
    });

  const hooksJson = JSON.parse(read("hooks/hooks.json")).hooks || {};
  const hooks = [];
  for (const [event, groups] of Object.entries(hooksJson)) {
    for (const g of groups) {
      for (const h of g.hooks || []) {
        const script = (String(h.command).match(/hooks\/([\w.-]+\.js)/) || [])[1] || h.command;
        const source = exists(`hooks/${script}`) ? read(`hooks/${script}`) : "";
        const lines = source ? source.trimEnd().split("\n").length : 0;
        const meta = HOOK_META[script] || { title: script, key: "", desc: "" };
        if (!HOOK_META[script]) warnings.push(`Açıklaması olmayan hook: ${script}`);
        hooks.push({ type: "hook", name: script, event, matcher: g.matcher || "", timeout: h.timeout || null, lines, source, ...meta });
      }
    }
  }

  // ---------- çapraz bağlantılar ----------
  const known = new Map();
  for (const s of skills) known.set(s.name, "skill");
  for (const a of agents) known.set(a.name, "agent");
  for (const c of commands) if (!known.has(c.name)) known.set(c.name, "command");
  const all = [...skills, ...agents, ...commands];
  for (const item of all) {
    const found = (item.body + " " + item.desc).match(/\bsky-[a-z0-9]+(?:-[a-z0-9]+)*/g) || [];
    item.links = uniq([...found, ...(item.pairs || [])]).filter((n) => n !== item.name && known.has(n));
  }
  const back = {};
  for (const item of all) for (const n of item.links) (back[n] ??= []).push(item.name);
  for (const item of all) item.backlinks = uniq(back[item.name] || []).filter((n) => !item.links.includes(n));

  const groupOrder = ["Çekirdek", ...GROUPS.map(([g]) => g)];
  const groupCounts = {};
  for (const s of skills) groupCounts[s.group] = (groupCounts[s.group] || 0) + 1;
  const groups = Object.keys(groupCounts)
    .sort((a, b) => (groupOrder.indexOf(a) + 1 || 99) - (groupOrder.indexOf(b) + 1 || 99))
    .map((name) => ({ name, count: groupCounts[name] }));

  const totalWords = all.reduce((n, i) => n + i.words, 0);
  const data = {
    live,
    plugin: { name: plugin.name, version: plugin.version, description: plugin.description, license: plugin.license || "" },
    install: installState(),
    builtAt: new Date().toISOString(),
    root: ROOT,
    stats: {
      skills: skills.length,
      agents: agents.length,
      commands: commands.length,
      hooks: hooks.length,
      events: Object.keys(hooksJson).length,
      words: totalWords,
      triggers: Object.values(triggers).reduce((n, t) => n + t.length, 0),
    },
    groups,
    events: Object.keys(hooksJson).map((e) => ({ name: e, ...(EVENT_META[e] || { label: e, hint: "" }) })),
    workflow: router.workflow,
    rules: router.rules,
    skills,
    agents,
    commands,
    hooks,
  };
  return { data, warnings: uniq(warnings) };
}

// ---------- HTML ----------
export function renderHtml(data) {
  const template = fs.readFileSync(path.join(HERE, "template.html"), "utf8");
  if (!template.includes("__SKY_DATA__")) throw new Error("template.html içinde __SKY_DATA__ yer tutucusu yok");
  const json = JSON.stringify(data).replace(/</g, "\\u003c").replace(/[\u2028\u2029]/g, (c) => "\\u" + c.charCodeAt(0).toString(16));
  return template.replace("__SKY_DATA__", () => json);
}

export const summary = (data) =>
  `${data.stats.skills} skill · ${data.stats.agents} agent · ${data.stats.commands} komut · ${data.stats.hooks} hook · ` +
  `${data.stats.words.toLocaleString("tr-TR")} kelime`;

export function openUrl(target) {
  const [cmd, args] =
    process.platform === "darwin" ? ["open", [target]]
    : process.platform === "win32" ? ["cmd", ["/c", "start", "", target]]
    : ["xdg-open", [target]];
  try {
    spawn(cmd, args, { detached: true, stdio: "ignore" }).on("error", () => {}).unref();
  } catch {
    /* tarayıcı açılamadıysa adres zaten yazdırıldı */
  }
}

// ---------- komut satırı ----------
const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const argv = process.argv.slice(2);
  const outAt = argv.indexOf("--out");
  const OUT = outAt >= 0 && argv[outAt + 1] ? path.resolve(argv[outAt + 1]) : path.join(HERE, "index.html");
  const { data, warnings: found } = buildData();
  const html = renderHtml(data);
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, html);
  console.log(`Sky Pano hazır → ${OUT}\n${summary(data)} · ${(Buffer.byteLength(html) / 1024).toFixed(0)} KB`);
  for (const w of found) console.warn("uyarı: " + w);
  if (argv.includes("--open")) openUrl(OUT);
}
