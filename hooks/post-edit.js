#!/usr/bin/env node
// PostToolUse(Edit|Write|MultiEdit): Sky'ın bağlama duyarlı kontrolleri. Dosyayı değiştirmez;
// bulguları Claude'a geri bildirim olarak iletir (exit 2 + stderr), hiçbir zaman engellemez.
const fs = require("fs");
const path = require("path");
const { readInput, disabled, projectDeps } = require("./lib");

if (disabled("post-edit")) process.exit(0);
const input = readInput();
const filePath = input.tool_input && (input.tool_input.file_path || input.tool_input.path);
if (!filePath || /node_modules|\.next\/|dist\/|build\/|\.git\//.test(filePath)) process.exit(0);

let text;
try {
  text = fs.readFileSync(filePath, "utf8");
} catch {
  process.exit(0);
}
if (text.length > 400_000) process.exit(0);

const rel = filePath.replace(/\\/g, "/");
const ext = path.extname(rel);
const dir = path.dirname(filePath);
const isJsx = /\.(t|j)sx$/.test(ext);
const isScript = /\.(t|j)sx?$/.test(ext);
const lines = text.split("\n");
const findings = [];
let depsCache;
const deps = () => (depsCache ??= projectDeps(dir));
const lineOf = (re) => {
  const hits = [];
  lines.forEach((l, i) => re.test(l) && hits.push(i + 1));
  return hits;
};
const fmt = (hits) => hits.slice(0, 5).join(", ") + (hits.length > 5 ? ` (+${hits.length - 5})` : "");

// 1) Yıkıcı migration
if (/(migrations?\/|supabase\/migrations\/|drizzle\/).*\.sql$|schema\.prisma$/.test(rel) || (ext === ".sql" && /migrat/i.test(rel))) {
  const hits = lineOf(/DROP\s+(TABLE|COLUMN|SCHEMA)|ALTER\s+TABLE[^;]*\sDROP\s|RENAME\s+(COLUMN|TO)\b|TRUNCATE\b|SET\s+NOT\s+NULL|ALTER\s+COLUMN[^;]*\sTYPE\s/i);
  if (hits.length)
    findings.push(`yıkıcı/kilitleyici migration adımı (satır ${fmt(hits)}) — geriye uyumlu mu (expand → migrate → contract)? Geri alma planı ve büyük tablo için CONCURRENTLY/bakım penceresi düşün (bkz. sky-data).`);
}

// 2) Auth eksik: route handler ve server action
if (isScript) {
  const isRoute = /\/app\/.*\/route\.(t|j)s$/.test(rel) && /export\s+(async\s+)?function\s+(POST|PUT|PATCH|DELETE)\b|export\s+const\s+(POST|PUT|PATCH|DELETE)\b/.test(text);
  const isAction = /^\s*["']use server["']/m.test(text) && /export\s+async\s+function/.test(text);
  if (isRoute || isAction) {
    const isWebhook = /webhook|callback|cron/i.test(rel);
    const authRe = /\b(auth|requireUser|requireMember|requireRole|requireAuth|requireAdmin|getUser|getServerSession|currentUser|getSession|withAuth|protectedProcedure|verifySignature|constructEvent|verifyWebhook)\s*\(/;
    const sigRe = /signature|constructEvent|verify|hmac|timingSafeEqual|CRON_SECRET/i;
    if (isWebhook ? !sigRe.test(text) : !authRe.test(text))
      findings.push(isWebhook
        ? "webhook/cron uç noktasında imza veya gizli anahtar doğrulaması görünmüyor (bkz. sky-payments, sky-webhooks-out)."
        : `${isRoute ? "route handler" : "server action"} içinde kimlik/yetki kontrolü görünmüyor — her yazma işlemi herkese açık bir uç noktadır (bkz. sky-auth). Herkese açıksa bilinçli olduğunu not et.`);
  }
}

// 3) Metadata eksik (Next.js sayfaları, uygulama içi olmayanlar)
if (/\/app\/.*page\.(t|j)sx$/.test(rel) && deps().next) {
  const privateArea = /\/\((app|dashboard|admin|panel|auth)\)\/|\/(dashboard|admin|panel|hesap|ayarlar|settings)\/|\/o\/\[/.test(rel);
  if (!privateArea && !/export\s+(const\s+metadata|async\s+function\s+generateMetadata|function\s+generateMetadata)/.test(text))
    findings.push(/^\s*["']use client["']/m.test(text)
      ? "\"use client\" sayfası metadata dışa aktaramaz — etkileşimli kısmı alt bileşene taşıyıp sayfayı Server Component yap ve metadata ekle (bkz. sky-seo)."
      : "herkese açık sayfada `metadata`/`generateMetadata` yok — title, description ve OG ekle (bkz. sky-seo).");
}

// 4) Next projesinde ham <img>
if (isJsx && deps().next) {
  const hits = lineOf(/<img\s/);
  if (hits.length) findings.push(`ham <img> (satır ${fmt(hits)}) — next/image boyut, lazy yükleme ve format optimizasyonu sağlar (bkz. sky-perf).`);
}

// 5) "use client" dosyasında sunucu kodu sızıntısı
if (isScript && /^\s*["']use client["']/m.test(text)) {
  const importHits = lineOf(/from\s+["'](@\/|~\/|\.\.?\/)*(server|lib\/db|db|prisma|drizzle)(\/|["'])|from\s+["'](@prisma\/client|drizzle-orm|pg|mysql2|server-only|fs|child_process)["']/);
  const envHits = lineOf(/process\.env\.(?!NEXT_PUBLIC_|NODE_ENV)[A-Z_]+/);
  if (importHits.length) findings.push(`istemci bileşeninde sunucu modülü importu (satır ${fmt(importHits)}) — veritabanı/sır istemci paketine sızabilir (bkz. sky-nextjs).`);
  if (envHits.length) findings.push(`istemci bileşeninde gizli env okuması (satır ${fmt(envHits)}) — istemcide yalnızca NEXT_PUBLIC_ değişkenleri tanımlıdır.`);
}

// 6) Token dosyasında kontrast
if (/\.(s?css)$/.test(ext) && /(tokens|globals|theme|variables|app)\.s?css$/.test(rel)) {
  for (const issue of contrastIssues(text)) findings.push(issue);
}

// 7) Sen/siz karışımı ve 8) sabit Türkçe metin
if (isJsx || (ext === ".json" && /messages|locales|i18n/.test(rel))) {
  const strings = text.match(/["'`>][^"'`<>{}]{3,}["'`<]/g) || [];
  const joined = strings.join(" ").toLocaleLowerCase("tr-TR");
  const siz = joined.match(/[a-zçğıöşü]+(ınız|iniz|unuz|ünüz)(ı|i|u|ü|a|e|da|de|dan|den|la|le)?(?![a-zçğıöşü])|(?<![a-zçğıöşü])(girin|seçin|tıklayın|deneyin|kaydedin|ekleyin|oluşturun|edin|yapın|yazın|bakın|bekleyin|doğrulayın|değiştirin|gönderin|yükleyin|silin)(?![a-zçğıöşü])/g) || [];
  const sen = joined.match(/(?<![a-zçğıöşü])(hesabın|şifren|parolan|e-postan|adresin|bilgilerin|randevun|siparişin|profilin|telefonun|sepetin|planın|aboneliğin|ekibin|verilerin)(ı|i|u|ü|a|e|da|de|dan|den)?(?![a-zçğıöşü])/g) || [];
  if (siz.length && sen.length)
    findings.push(`aynı dosyada hem "siz" (${[...new Set(siz)].slice(0, 3).join(", ")}) hem "sen" (${[...new Set(sen)].slice(0, 3).join(", ")}) hitabı var — projenin kararına göre birini seç (bkz. sky-ux-writing).`);
}
if (isJsx) {
  const d = deps();
  if (d["next-intl"] || d["react-i18next"] || d.i18next || d["@lingui/react"]) {
    const hits = lineOf(/>\s*[A-ZÇĞİÖŞÜa-zçğıöşü][^<>{}]*[çğıöşüÇĞİÖŞÜ][^<>{}]*\s*</);
    if (hits.length) findings.push(`JSX içinde sabit Türkçe metin (satır ${fmt(hits)}) — proje i18n kullanıyor, metni mesaj dosyasına taşıyıp t() ile çağır (bkz. sky-i18n).`);
  }
}

if (findings.length) {
  process.stderr.write(`[Sky] ${path.basename(filePath)} için öneriler:\n${findings.map((f) => "  - " + f).join("\n")}\nBilinçli tercihse yok say.\n`);
  process.exit(2);
}
process.exit(0);

// ---- kontrast hesabı (WCAG 2.x) ----
function contrastIssues(css) {
  const out = [];
  const pairs = [
    ["fg", "bg", 4.5], ["fg-muted", "bg", 4.5], ["fg", "surface", 4.5], ["fg-muted", "surface", 4.5], ["accent-fg", "accent", 4.5],
    ["foreground", "background", 4.5], ["muted-foreground", "background", 4.5], ["primary-foreground", "primary", 4.5],
  ];
  const blockRe = /([^{}]*)\{([^{}]*)\}/g;
  let m;
  while ((m = blockRe.exec(css))) {
    const selector = m[1].trim().split("\n").pop().trim().slice(0, 60);
    const vars = {};
    for (const d of m[2].matchAll(/--([\w-]+)\s*:\s*([^;]+);/g)) vars[d[1]] = d[2].trim();
    for (const [a, b, min] of pairs) {
      if (!(a in vars) || !(b in vars)) continue;
      const ca = parseColor(vars[a], vars), cb = parseColor(vars[b], vars);
      if (!ca || !cb) continue;
      const ratio = contrast(ca, cb);
      if (ratio < min) out.push(`\`${selector}\`: --${a} / --${b} kontrastı ${ratio.toFixed(2)}:1 (< ${min}:1) — metin okunurluğu WCAG AA altında (bkz. sky-color).`);
    }
  }
  return out;
}
function parseColor(v, vars, depth = 0) {
  v = v.trim();
  const ref = v.match(/^var\(--([\w-]+)\)$/);
  if (ref) return depth < 4 && vars[ref[1]] ? parseColor(vars[ref[1]], vars, depth + 1) : null;
  let h = v.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (h) {
    let s = h[1];
    if (s.length === 3) s = s.split("").map((c) => c + c).join("");
    return [0, 2, 4].map((i) => toLinear(parseInt(s.slice(i, i + 2), 16) / 255));
  }
  const rgb = v.match(/^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)\s*(?:[/,]\s*([\d.]+%?))?\s*\)$/i);
  if (rgb) {
    if (rgb[4] && parseFloat(rgb[4]) < (rgb[4].endsWith("%") ? 100 : 1)) return null; // yarı saydam: atla
    return [rgb[1], rgb[2], rgb[3]].map((x) => toLinear(parseFloat(x) / 255));
  }
  const ok = v.match(/^oklch\(\s*([\d.]+)(%?)\s+([\d.]+)\s+([\d.]+)(?:deg)?\s*(?:\/\s*([\d.]+%?))?\s*\)$/i);
  if (ok) {
    if (ok[5] && parseFloat(ok[5]) < (ok[5].endsWith("%") ? 100 : 1)) return null;
    const L = parseFloat(ok[1]) / (ok[2] ? 100 : 1), C = parseFloat(ok[3]), H = (parseFloat(ok[4]) * Math.PI) / 180;
    const a = C * Math.cos(H), b = C * Math.sin(H);
    const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
    const mm = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
    const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
    return [
      4.0767416621 * l - 3.3077115913 * mm + 0.2309699292 * s,
      -1.2684380046 * l + 2.6097574011 * mm - 0.3413193965 * s,
      -0.0041960863 * l - 0.7034186147 * mm + 1.707614701 * s,
    ].map((x) => Math.min(1, Math.max(0, x)));
  }
  if (/^(white|#fff)$/i.test(v)) return [1, 1, 1];
  if (/^black$/i.test(v)) return [0, 0, 0];
  return null;
}
function toLinear(c) {
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}
function contrast(a, b) {
  const lum = ([r, g, bl]) => 0.2126 * r + 0.7152 * g + 0.0722 * bl;
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}
