#!/usr/bin/env node
// PostToolUse(Edit|Write|MultiEdit): web dışı diller ve altyapı dosyaları için Sky kalite uyarıları
// (Python, Go, Rust, PHP, Ruby, Dart, Kotlin, Swift, Dockerfile, GitHub Actions). Dosyayı değiştirmez,
// engellemez; bulguları Claude'a geri bildirim olarak iletir (exit 2 + stderr).
const fs = require("fs");
const path = require("path");
const { readInput, disabled } = require("./lib");

if (disabled("lang")) process.exit(0);
const input = readInput();
const filePath = input.tool_input && (input.tool_input.file_path || input.tool_input.path);
if (!filePath || /node_modules|\.venv|vendor\/|target\/|\.git\//.test(filePath)) process.exit(0);

let text;
try {
  text = fs.readFileSync(filePath, "utf8");
} catch {
  process.exit(0);
}
if (text.length > 400_000) process.exit(0);

const rel = filePath.replace(/\\/g, "/");
const base = path.basename(rel);
const ext = path.extname(rel);
const isTest = /(^|\/)(tests?|spec|__tests__)\/|_test\.(go|py)$|(^|\/)test_[^/]*\.py$|\.(test|spec)\.|Tests?\.(cs|kt|swift)$/.test(rel);
const isEntry = /(^|\/)(scripts?|bin|cmd|tools)\/|\/main\.go$/.test(rel);
const lines = text.split("\n");

const RULES = {
  ".py": [
    [/^\s*print\(/, "print() — log için `logging` kullan", () => !isTest && !isEntry],
    [/^\s*except\s*:/, "çıplak `except:` (KeyboardInterrupt dahil her şeyi yutar)"],
    [/except\s+Exception\s*(as\s+\w+)?\s*:\s*(pass)?\s*$/, "geniş `except Exception` — hatayı ele al veya yeniden fırlat"],
    [/(^|[^.\w])(eval|exec)\(/, "`eval`/`exec` — güvenilmeyen girdiyle tehlikeli"],
    [/pickle\.loads?\(|yaml\.load\((?![^)]*Loader)/, "güvensiz deserialize (`pickle` / Loader'sız `yaml.load`) — `yaml.safe_load`"],
    [/subprocess\.[a-z_]+\([^)]*shell\s*=\s*True/, "`shell=True` — komut enjeksiyonu riski, argüman listesi kullan"],
    [/\.(execute|raw)\(\s*f["']/, "f-string ile SQL — parametreli sorgu kullan"],
    [/datetime\.(now|utcnow)\(\)/, "timezone'suz datetime — `datetime.now(UTC)`"],
    [/def\s+\w+\([^)]*=\s*(\[\]|\{\}|set\(\))/, "değiştirilebilir varsayılan argüman"],
    [/^\s*(breakpoint\(\)|import\s+pdb|pdb\.set_trace\(\))/, "debug kalıntısı"],
  ],
  ".go": [
    [/^\s*_\s*=\s*\w*[eE]rr\b/, "hata yok sayılıyor (`_ = err`)"],
    [/\bpanic\(/, "`panic` — kütüphane kodunda hata döndür", () => !isEntry && !isTest],
    [/context\.Background\(\)/, "`context.Background()` istek yolunda mı? Gelen ctx'i aktar", () => !isEntry && !isTest],
    [/http\.(Get|Post)\(|&http\.Client\{\s*\}/, "zaman aşımı olmayan HTTP istemcisi"],
  ],
  ".rs": [
    [/\.unwrap\(\)/, "`.unwrap()` — `?` veya anlamlı `expect`", () => !isTest],
    [/\bdbg!\(/, "`dbg!` kalıntısı"],
    [/^\s*unsafe\s*\{/, "`unsafe` blok — `// SAFETY:` açıklaması var mı?"],
    [/\btodo!\(|\bunimplemented!\(/, "`todo!`/`unimplemented!` kalıntısı"],
  ],
  ".php": [
    [/\b(dd|dump|var_dump|print_r)\(/, "debug kalıntısı"],
    [/\{!!/, "kaçışsız Blade çıktısı `{!! !!}` — yalnızca güvenilir içerik"],
    [/\$guarded\s*=\s*\[\s*\]/, "`$guarded = []` — toplu atama koruması kapalı"],
    [/DB::(raw|select|statement)\([^)]*\$/, "ham sorguda değişken — binding kullan"],
  ],
  ".rb": [
    [/binding\.(pry|irb)|\bbyebug\b|^\s*debugger\b/, "debug kalıntısı"],
    [/\.html_safe\b|\braw\(/, "`html_safe`/`raw` — XSS riski"],
    [/\.(where|find_by_sql)\(\s*["'][^"']*#\{/, "string enterpolasyonlu SQL — parametre kullan"],
  ],
  ".dart": [[/^\s*print\(/, "print() — `debugPrint`/logger kullan", () => !isTest]],
  ".kt": [[/!!(\.|\s|$|\))/, "`!!` — null güvenliğini atlıyor"], [/GlobalScope\./, "`GlobalScope` — yaşam döngüsüne bağlı scope kullan"]],
  ".swift": [[/try!\s|as!\s/, "`try!`/`as!` — çökme riski"], [/^\s*print\(/, "print() kalıntısı", () => !isTest]],
};

const findings = [];
const push = (msg, hits) => {
  if (hits.length) findings.push(`  - ${msg} — satır ${hits.slice(0, 5).join(", ")}${hits.length > 5 ? ` (+${hits.length - 5})` : ""}`);
};
const scan = (re) => {
  const hits = [];
  lines.forEach((l, i) => !/^\s*(#|\/\/)/.test(l) && re.test(l) && hits.push(i + 1));
  return hits;
};

for (const [re, msg, when] of RULES[ext] || []) {
  if (when && !when()) continue;
  push(msg, scan(re));
}

// Dockerfile
if (/^(Dockerfile|Containerfile)(\..+)?$|\.dockerfile$/i.test(base)) {
  const stages = new Set();
  const unpinned = [];
  lines.forEach((l, i) => {
    const m = l.match(/^\s*FROM\s+(?:--platform=\S+\s+)?(\S+)(?:\s+AS\s+(\S+))?/i);
    if (!m) return;
    const img = m[1];
    const previousStage = stages.has(img.toLowerCase());
    if (m[2]) stages.add(m[2].toLowerCase());
    if (previousStage || img === "scratch" || img.includes("@sha256:") || img.startsWith("$")) return;
    const tag = img.split("/").pop().split(":")[1];
    if (!tag || tag === "latest") unpinned.push(i + 1);
  });
  push("taban imaj sürümü sabit değil (`:latest` veya etiketsiz)", unpinned);
  if (!/^\s*USER\s+/im.test(text) && !/nonroot/i.test(text)) findings.push("  - `USER` yok — konteyner root olarak çalışır (non-root kullanıcı ekle)");
  push("sır imaja gömülüyor (ENV/ARG) — runtime env veya BuildKit `--secret` kullan", scan(/^\s*(ENV|ARG)\s+\w*(SECRET|PASSWORD|TOKEN|API_KEY|PRIVATE)\w*[\s=]+\S+/i));
  push("`ADD <url>` — `curl` + doğrulama veya COPY tercih et", scan(/^\s*ADD\s+https?:/i));
  push("shell biçimi `CMD`/`ENTRYPOINT` — sinyaller sürece ulaşmaz, exec biçimi kullan: CMD [\"node\", \"dist/index.js\"]", scan(/^\s*(CMD|ENTRYPOINT)\s+[^[\s]/i));
}

// GitHub Actions
if (/\.github\/workflows\/[^/]+\.ya?ml$/.test(rel)) {
  const unpinned = [];
  lines.forEach((l, i) => {
    const m = l.match(/uses:\s*([\w.-]+\/[\w./-]+)@([\w.-]+)/);
    if (m && !/^[0-9a-f]{40}$/.test(m[2]) && !/^(actions|github)\//.test(m[1])) unpinned.push(i + 1);
  });
  push("üçüncü parti action commit SHA ile sabitlenmemiş", unpinned);
  if (/pull_request_target/.test(text) && /ref:\s*\$\{\{\s*github\.event\.pull_request\.head/.test(text))
    findings.push("  - `pull_request_target` + PR kodunu checkout — çatal PR'lar sırlara erişebilir");
  // `KEY: ${{ … }}` (env/if/with değerleri) güvenli; run komutlarına doğrudan gömülen kullanıcı kontrollü değerler değil.
  const inj = [];
  lines.forEach((l, i) => {
    if (/\$\{\{\s*(github\.event\.(issue|pull_request|comment|review|head_commit|discussion)\.[\w.]*(title|body|message|name|label|ref)|github\.head_ref)/.test(l) &&
        !/^\s*-?\s*[\w-]+:\s*\$\{\{/.test(l)) inj.push(i + 1);
  });
  push("kullanıcı kontrollü değer doğrudan komuta gömülü — önce `env:` değişkenine al (script injection)", inj);
  if (!/^permissions:/m.test(text)) findings.push("  - üst düzey `permissions:` yok — varsayılan token yetkisini daralt (`contents: read`)");
}

if (findings.length) {
  process.stderr.write(`[Sky] ${base} için öneriler:\n${findings.join("\n")}\nBilinçli tercihse yok say.\n`);
  process.exit(2);
}
process.exit(0);
