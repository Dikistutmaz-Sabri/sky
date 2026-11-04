#!/usr/bin/env node
// Sky kalite hook'u: düzenlenen web dosyasında Sky kurallarına aykırı kalıpları bulur ve
// Claude'a uyarı olarak geri bildirir. Dosyayı değiştirmez, hiçbir zaman engellemez.
// Kapatmak için: SKY_HOOKS=off

const fs = require("fs");
const path = require("path");

if (process.env.SKY_HOOKS === "off") process.exit(0);

const WEB_EXT = new Set([".ts", ".tsx", ".js", ".jsx", ".vue", ".svelte", ".astro", ".css", ".scss"]);
const TOKEN_FILES = /(tokens|globals|theme|variables|tailwind\.config)\.(css|scss|ts|js|mjs)$/;

const rules = [
  { re: /\bconsole\.log\(/, msg: "console.log kalıntısı", ext: /\.(t|j)sx?$|\.vue$|\.svelte$/ },
  { re: /:\s*any\b|<any>|as any\b/, msg: "`any` kullanımı — `unknown` + daraltma tercih et", ext: /\.tsx?$/ },
  { re: /<div[^>]*\sonClick=/, msg: "tıklanabilir <div> — <button> kullan (klavye erişimi)", ext: /\.(t|j)sx$/ },
  { re: /<img(?![^>]*\balt=)[^>]*>/, msg: "alt özniteliği olmayan <img>", ext: /\.(t|j)sx$|\.vue$|\.svelte$|\.astro$/ },
  { re: /outline:\s*(none|0)\b(?![^}]*box-shadow)/, msg: "outline kaldırılmış, yerine odak stili yok", ext: /\.s?css$/ },
  { re: /#[0-9a-fA-F]{3,8}\b/, msg: "ham hex renk — token (CSS değişkeni) kullan", ext: /\.(t|j)sx$|\.s?css$|\.vue$|\.svelte$/, skipTokens: true },
  { re: /\b(?:text|bg|border|p|m|px|py|mx|my|gap|w|h|rounded)-\[[^\]]+\]/, msg: "Tailwind keyfi değer — tema token'ı kullan", ext: /\.(t|j)sx$|\.vue$|\.svelte$|\.astro$/ },
  { re: /dangerouslySetInnerHTML/, msg: "dangerouslySetInnerHTML — girdi sanitize ediliyor mu?", ext: /\.(t|j)sx$/ },
  { re: /(NEXT_PUBLIC_|VITE_)[A-Z_]*(SECRET|PRIVATE|SERVICE_ROLE|PASSWORD)/, msg: "istemciye açık env önekinde gizli anahtar", ext: /./ },
  { re: /(sk_live_|sk-ant-|AKIA[0-9A-Z]{16}|-----BEGIN [A-Z ]*PRIVATE KEY-----)/, msg: "koda gömülü gizli anahtar olabilir", ext: /./ },
  { re: /\$queryRawUnsafe|\$executeRawUnsafe/, msg: "güvensiz ham SQL — parametreli sorgu kullan", ext: /\.(t|j)sx?$/ },
];

let raw = "";
process.stdin.on("data", (c) => (raw += c));
process.stdin.on("end", () => {
  let filePath;
  try {
    const input = JSON.parse(raw || "{}");
    filePath = input.tool_input && (input.tool_input.file_path || input.tool_input.path);
  } catch {
    process.exit(0);
  }
  if (!filePath || !WEB_EXT.has(path.extname(filePath))) process.exit(0);
  if (/node_modules|\.next\/|dist\/|build\//.test(filePath)) process.exit(0);

  let text;
  try {
    text = fs.readFileSync(filePath, "utf8");
  } catch {
    process.exit(0);
  }
  if (text.length > 400_000) process.exit(0);

  const isTokenFile = TOKEN_FILES.test(filePath);
  const lines = text.split("\n");
  const findings = [];

  for (const rule of rules) {
    if (!rule.ext.test(filePath)) continue;
    if (rule.skipTokens && isTokenFile) continue;
    const hits = [];
    lines.forEach((line, i) => {
      if (rule.re.test(line)) hits.push(i + 1);
    });
    if (hits.length) {
      const shown = hits.slice(0, 5).join(", ") + (hits.length > 5 ? ` (+${hits.length - 5})` : "");
      findings.push(`  - ${rule.msg} — satır ${shown}`);
    }
  }

  if (findings.length) {
    process.stderr.write(
      `[Sky] ${path.basename(filePath)} için kalite uyarıları:\n${findings.join("\n")}\n` +
        `Bilinçli tercihse yok say; değilse düzelt.\n`
    );
    process.exit(2); // PostToolUse'da 2: stderr Claude'a geri bildirim olarak iletilir (engellemez)
  }
  process.exit(0);
});
