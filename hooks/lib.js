// Sky hook'ları için ortak yardımcılar. Tüm hook'lar SKY_HOOKS=off ile, tek tek
// SKY_HOOKS_DISABLE="danger,packages,env,post-edit,stop,session,prompt" ile kapatılabilir.
const fs = require("fs");
const path = require("path");

function readInput() {
  try {
    return JSON.parse(fs.readFileSync(0, "utf8") || "{}");
  } catch {
    return {};
  }
}

function disabled(name) {
  if (process.env.SKY_HOOKS === "off") return true;
  return (process.env.SKY_HOOKS_DISABLE || "")
    .split(",")
    .map((s) => s.trim())
    .includes(name);
}

function emit(obj) {
  process.stdout.write(JSON.stringify(obj));
}

// PreToolUse: işlemi durdurup kullanıcıdan onay ister.
function ask(reason) {
  emit({ hookSpecificOutput: { hookEventName: "PreToolUse", permissionDecision: "ask", permissionDecisionReason: reason } });
}

// SessionStart / UserPromptSubmit: Claude'un bağlamına kısa not ekler.
function addContext(event, text) {
  emit({ hookSpecificOutput: { hookEventName: event, additionalContext: text } });
}

function findUp(start, name) {
  let dir = start;
  for (let i = 0; i < 10; i++) {
    const p = path.join(dir, name);
    if (fs.existsSync(p)) return p;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return null;
}

function readJSON(p) {
  try {
    return JSON.parse(fs.readFileSync(p, "utf8"));
  } catch {
    return null;
  }
}

function projectDeps(fromDir) {
  const pkgPath = findUp(fromDir, "package.json");
  const pkg = pkgPath && readJSON(pkgPath);
  if (!pkg) return {};
  return { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };
}

module.exports = { readInput, disabled, emit, ask, addContext, findUp, readJSON, projectDeps };
