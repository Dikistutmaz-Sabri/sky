#!/usr/bin/env node
// Sky Pano yerel sunucusu — eklenti klasöründe `npm start` ile http://localhost:4242 adresinde açılır.
// Dosyaları izler; skill, agent, komut, hook veya şablon değişince sayfa kendini yeniler.
// Bağımlılık yok (Node 18.17+). Yalnızca 127.0.0.1'e bağlanır, dışarıya açılmaz.
//
// Seçenekler:  --port <n> (ya da PORT=<n>)   --no-open
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { performance } from "node:perf_hooks";
import { buildData, renderHtml, openUrl, summary, ROOT } from "./build.mjs";

const argv = process.argv.slice(2);
const arg = (name) => { const i = argv.indexOf(name); return i >= 0 ? argv[i + 1] : undefined; };
const HOST = "127.0.0.1";
const FIXED_PORT = arg("--port") || process.env.PORT;
const START_PORT = Number(FIXED_PORT) || 4242;
const OPEN = !argv.includes("--no-open") && !process.env.CI;

// ---------- terminal çıktısı ----------
const tty = process.stdout.isTTY && !process.env.NO_COLOR;
const paint = (open, close) => (s) => (tty ? `\x1b[${open}m${s}\x1b[${close}m` : String(s));
const c = { bold: paint(1, 22), dim: paint(2, 22), cyan: paint(36, 39), green: paint(32, 39), yellow: paint(33, 39), red: paint(31, 39), magenta: paint(35, 39) };
const time = () => new Date().toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
const log = (msg) => console.log(`${c.dim(time())}  ${msg}`);

// ---------- derleme ----------
// Sayfaya yalnızca sunucu modunda eklenen canlı yenileme istemcisi.
const LIVE_CLIENT = `<script>(()=>{let es;const connect=()=>{es=new EventSource("/__sky/events");es.addEventListener("reload",()=>{try{sessionStorage.setItem("sky-scroll",String(scrollY));sessionStorage.setItem("sky-updated","1")}catch(e){}location.reload()});es.onerror=()=>{es.close();setTimeout(connect,1500)}};connect();try{const y=sessionStorage.getItem("sky-scroll");if(y!==null){sessionStorage.removeItem("sky-scroll");requestAnimationFrame(()=>scrollTo(0,+y))}}catch(e){}})();</script>`;

let page = { html: null, data: null, error: null, version: 0 };

function rebuild(reason) {
  const t0 = performance.now();
  try {
    const { data, warnings } = buildData({ live: true });
    const base = renderHtml(data);
    const at = base.lastIndexOf("</body>");
    const html = at >= 0 ? base.slice(0, at) + LIVE_CLIENT + base.slice(at) : base + LIVE_CLIENT;
    page = { html, data, error: null, version: page.version + 1 };
    if (reason) log(`${c.green("↻")} ${reason} ${c.dim(`· ${Math.round(performance.now() - t0)} ms`)}`);
    for (const w of warnings) log(`${c.yellow("uyarı")} ${w}`);
    broadcast("reload");
    return true;
  } catch (e) {
    page = { ...page, error: e };
    log(`${c.red("derleme hatası")} ${e.message}`);
    if (page.html) log(c.dim("Son çalışan sürüm sunulmaya devam ediyor."));
    return false;
  }
}

const errorPage = (e) => `<!doctype html><html lang="tr"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Sky Pano · hata</title>
<body style="margin:0;min-height:100vh;display:grid;place-items:center;background:#07080c;color:#eceef5;font:15px/1.6 system-ui,sans-serif">
<div style="max-width:560px;padding:24px"><h1 style="font-weight:500">Pano derlenemedi</h1><pre style="white-space:pre-wrap;background:#0e1016;border:1px solid #23262f;border-radius:12px;padding:16px;color:#ffb38f">${String(e && e.message || e).replace(/[&<>]/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[ch])}</pre>
<p style="color:#a5abbb">Dosyayı düzelttiğinde sayfa kendiliğinden yenilenir.</p></div>${LIVE_CLIENT}</body></html>`;

// ---------- canlı yenileme (Server-Sent Events) ----------
const clients = new Set();
function broadcast(event) {
  for (const res of clients) res.write(`event: ${event}\ndata: ${page.version}\n\n`);
}
setInterval(() => { for (const res of clients) res.write(": ping\n\n"); }, 25_000).unref();

// ---------- HTTP ----------
let port = START_PORT;
const allowedHost = (h) => !h || [`localhost:${port}`, `127.0.0.1:${port}`, `[::1]:${port}`].includes(h);

const server = http.createServer((req, res) => {
  if (!allowedHost(req.headers.host)) { res.writeHead(403, { "Content-Type": "text/plain; charset=utf-8" }); return res.end("Yalnızca localhost"); }
  if (req.method !== "GET" && req.method !== "HEAD") { res.writeHead(405, { Allow: "GET, HEAD" }); return res.end(); }
  const { pathname } = new URL(req.url, `http://${HOST}:${port}`);
  const headers = { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff", "Referrer-Policy": "no-referrer" };

  if (pathname === "/" || pathname === "/index.html") {
    if (!page.html) {
      res.writeHead(500, { ...headers, "Content-Type": "text/html; charset=utf-8" });
      return res.end(errorPage(page.error || "Henüz derlenmedi"));
    }
    res.writeHead(200, { ...headers, "Content-Type": "text/html; charset=utf-8" });
    return res.end(req.method === "HEAD" ? undefined : page.html);
  }
  if (pathname === "/__sky/events") {
    res.writeHead(200, { ...headers, "Content-Type": "text/event-stream; charset=utf-8", Connection: "keep-alive" });
    res.write("retry: 1500\n\n");
    clients.add(res);
    req.on("close", () => clients.delete(res));
    return;
  }
  if (pathname === "/api/data.json") {
    res.writeHead(page.data ? 200 : 503, { ...headers, "Content-Type": "application/json; charset=utf-8" });
    return res.end(req.method === "HEAD" ? undefined : JSON.stringify(page.data || { error: "Henüz derlenmedi" }));
  }
  if (pathname === "/favicon.ico") { res.writeHead(204, headers); return res.end(); }
  res.writeHead(404, { ...headers, "Content-Type": "text/plain; charset=utf-8" });
  res.end("Bulunamadı");
});

// ---------- dosya izleme ----------
const WATCHED = ["skills", "agents", "commands", "hooks", ".claude-plugin", "dashboard"];
const SELF = new Set([path.join("dashboard", "build.mjs"), path.join("dashboard", "server.mjs")]);
const ignored = (rel) =>
  rel === path.join("dashboard", "index.html") ||
  /(^|[\\/])(\.DS_Store|\.git|node_modules)([\\/]|$)/.test(rel) ||
  /(~|\.swp|\.tmp)$/.test(rel);
let timer = null;
const pending = new Set();

function onChange(rel) {
  if (!rel || ignored(rel)) return;
  if (!WATCHED.some((d) => rel === d || rel.startsWith(d + path.sep))) return;
  if (SELF.has(rel)) { log(`${c.yellow("!")} ${rel} değişti; etkili olması için sunucuyu yeniden başlat (Ctrl+C, npm start).`); return; }
  pending.add(rel);
  clearTimeout(timer);
  timer = setTimeout(() => {
    const list = [...pending];
    pending.clear();
    rebuild(list.length === 1 ? `${list[0]} değişti` : `${list.length} dosya değişti`);
  }, 120);
}

function snapshot() {
  let n = 0, sum = 0;
  const walk = (dir) => {
    let entries = [];
    try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
    for (const d of entries) {
      const p = path.join(dir, d.name);
      if (d.isDirectory()) { if (d.name !== "node_modules" && d.name !== ".git") walk(p); continue; }
      if (ignored(path.relative(ROOT, p))) continue;
      try { const st = fs.statSync(p); n++; sum += st.mtimeMs + st.size; } catch { /* silinmiş olabilir */ }
    }
  };
  for (const d of WATCHED) walk(path.join(ROOT, d));
  return `${n}:${sum}`;
}

function startWatching() {
  try {
    const w = fs.watch(ROOT, { recursive: true }, (_event, file) => file && onChange(String(file)));
    w.on("error", () => { w.close(); startPolling(); });
    return "anlık";
  } catch {
    startPolling();
    return "yoklama";
  }
}
function startPolling() {
  let last = snapshot();
  setInterval(() => {
    const now = snapshot();
    if (now !== last) { last = now; rebuild("dosyalar değişti"); }
  }, 1500).unref();
}

// ---------- başlat ----------
function listen(p, triesLeft) {
  // Her denemenin dinleyicileri kendi içinde temizlenir; aksi hâlde başarısız denemenin
  // "listening" geri çağrısı sonraki portta da tetiklenip karşılamayı iki kez basar.
  const onError = (e) => {
    server.off("listening", onListening);
    if (e.code === "EADDRINUSE" && !FIXED_PORT && triesLeft > 0) return listen(p + 1, triesLeft - 1);
    console.error(c.red(e.code === "EADDRINUSE" ? `\n  Port ${p} kullanımda. Başka bir port dene:  PORT=4300 npm start\n` : `\n  ${e.message}\n`));
    process.exit(1);
  };
  const onListening = () => {
    server.off("error", onError);
    server.on("error", (e) => log(`${c.red("sunucu hatası")} ${e.message}`));
    port = p;
    ready();
  };
  server.once("error", onError);
  server.once("listening", onListening);
  server.listen(p, HOST);
}

function ready() {
  const url = `http://localhost:${port}`;
  const mode = startWatching();
  const v = page.data ? `v${page.data.plugin.version}` : "";
  console.log(`
  ${c.magenta("✦")} ${c.bold("Sky Pano")} ${c.dim(v)}

  ${c.green("➜")}  ${c.bold("Yerel:")}  ${c.cyan(url)}
  ${c.dim("➜")}  ${c.dim("Veri:")}   ${c.dim(url + "/api/data.json")}

  ${page.data ? summary(page.data) : c.red("İlk derleme başarısız; hata sayfası gösteriliyor.")}
  ${c.dim(`Dosyalar ${mode === "anlık" ? "anlık" : "1,5 sn'de bir"} izleniyor; değişince sayfa kendini yeniler. Durdurmak için Ctrl+C.`)}
`);
  if (port !== START_PORT) log(`${c.yellow("!")} ${START_PORT} doluydu, ${port} kullanılıyor.`);
  if (OPEN) openUrl(url);
}

function shutdown() {
  for (const res of clients) res.end();
  server.close();
  console.log(`\n  ${c.dim("Sky Pano kapatıldı.")}\n`);
  process.exit(0);
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

rebuild();
listen(START_PORT, 20);
