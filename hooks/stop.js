#!/usr/bin/env node
// Stop: tur bitmeden önce bu turda eklenen satırlarda debug kalıntısı arar; bulursa bir kez
// Claude'dan temizlemesini veya bilinçli olduğunu belirtmesini ister.
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");
const { readInput, disabled, emit } = require("./lib");

if (disabled("stop")) process.exit(0);
const input = readInput();
if (input.stop_hook_active) process.exit(0);
const cwd = input.cwd || process.cwd();

const git = (args) => execFileSync("git", args, { cwd, timeout: 5000, stdio: ["ignore", "pipe", "ignore"] }).toString();
try {
  git(["rev-parse", "--is-inside-work-tree"]);
} catch {
  process.exit(0);
}

const WEB = /\.(t|j)sx?$|\.vue$|\.svelte$|\.astro$|\.(py|go|rs|php|rb|dart|kt|swift)$/;
const added = []; // { file, line, text }

try {
  let file = null, lineNo = 0;
  for (const l of git(["diff", "-U0", "HEAD"]).split("\n")) {
    if (l.startsWith("+++ ")) { file = l.startsWith("+++ b/") ? l.slice(6) : null; continue; }
    const h = l.match(/^@@ -\d+(?:,\d+)? \+(\d+)/);
    if (h) { lineNo = parseInt(h[1], 10); continue; }
    if (file && l.startsWith("+")) { added.push({ file, line: lineNo, text: l.slice(1) }); lineNo++; }
  }
} catch {
  // Henüz commit yoksa yalnızca izlenmeyen dosyalara bak.
}
try {
  for (const f of git(["ls-files", "--others", "--exclude-standard"]).split("\n").filter(Boolean).slice(0, 50)) {
    if (!WEB.test(f)) continue;
    try {
      fs.readFileSync(path.join(cwd, f), "utf8").split("\n").forEach((t, i) => added.push({ file: f, line: i + 1, text: t }));
    } catch {}
  }
} catch {}

const rules = [
  [/\bconsole\.log\(/, "console.log", (f) => !/(scripts?|bin|cli)\/|\.config\.|\.test\.|\.spec\./.test(f)],
  [/^\s*debugger;?\s*$/, "debugger", () => true],
  [/\b(it|test|describe)\.only\(/, ".only (diğer testler atlanır)", () => true],
  [/@ts-ignore/, "@ts-ignore", () => true],
  [/^\s*(breakpoint\(\)|import\s+pdb|pdb\.set_trace\(\))/, "Python debugger", (f) => f.endsWith(".py")],
  [/\bdbg!\(/, "dbg!", (f) => f.endsWith(".rs")],
  [/\b(dd|var_dump)\(/, "dd/var_dump", (f) => f.endsWith(".php")],
  [/binding\.(pry|irb)|\bbyebug\b/, "Ruby debugger", (f) => f.endsWith(".rb")],
  [/@pytest\.mark\.skip\b|\bfit\(|\bfdescribe\(/, "atlanan/odaklanmış test", () => true],
];
const hits = [];
for (const a of added) {
  if (!WEB.test(a.file) || /node_modules|\.next\//.test(a.file)) continue;
  for (const [re, label, applies] of rules) if (applies(a.file) && re.test(a.text)) hits.push(`${a.file}:${a.line} ${label}`);
}

if (hits.length) {
  emit({
    decision: "block",
    reason:
      `Sky son kontrol — bu değişikliklerde kalıntı olabilecek satırlar var:\n${hits.slice(0, 12).map((h) => "  - " + h).join("\n")}` +
      (hits.length > 12 ? `\n  (+${hits.length - 12} daha)` : "") +
      `\nBilinçli değilse temizle; bilinçliyse kullanıcıya kısaca belirt ve bitir.`,
  });
}
process.exit(0);
