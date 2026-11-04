# Sky Pano

Sky'daki her şeyi tek sayfada gösteren yerel pano: skill'ler, agent'lar, komutlar, hook'lar ve ilkeler.

Eklenti klasöründe (`sky/`):

```bash
npm start
```

**http://localhost:4242** açılır; `npm install` gerekmez. Dosyalar değişince sayfa kendini yeniler.

- `server.mjs` — yerel sunucu. `build.mjs`'nin verisini bellekte derler, `skills/`, `agents/`, `commands/`,
  `hooks/`, `.claude-plugin/` ve `dashboard/template.html` değişikliklerini izler, tarayıcıya SSE ile
  "yenile" der. Yalnızca `127.0.0.1`'e bağlanır. Seçenekler: `PORT=3000`, `--port 3000`, `--no-open`.
- `build.mjs` — eklentiyi tarar, `template.html` ile birleştirip tek dosyalık `index.html` üretir
  (`npm run build`). Sunucusuz, çevrimdışı açılır. `--out <yol>`, `--open` alır.
  Claude Code içinden `/sky:sky-pano` bunu kullanır.
- `template.html` — sayfanın tasarımı ve uygulaması. Sunucu açıkken düzenlersen anında görürsün.
- `build.mjs` veya `server.mjs`'yi değiştirirsen sunucuyu yeniden başlat.

Kısayollar: `⌘K` / `Ctrl+K` veya `/` arama, `Esc` kapat, `T` tema.
