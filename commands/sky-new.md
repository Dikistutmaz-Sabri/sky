---
description: Sky ile yeni bir web projesi başlat — stack seç, iskeleti kur, token'ları, env doğrulamayı, temel layout'u ve test altyapısını ekle.
argument-hint: "<proje adı ve kısa açıklama>"
---

# /sky-new

Görev: `$ARGUMENTS`

1. `sky:sky-web-stack` ve `sky:sky-ui-craft` skill'lerini yükle.
2. Açıklamadan proje türünü çıkar (SEO'lu site → Next.js, SPA/panel → Vite + React).
   Veritabanı, auth veya ödeme gerekiyorsa ve seçim belirsizse kullanıcıya **tek soruda** sor.
3. Mevcut dizin boş değilse ne olduğuna bak; üzerine yazma.
4. Resmi oluşturucuyla iskeleti kur (`create-next-app` / `create vite`), TypeScript strict, Tailwind.
5. Ekle:
   - `src/styles/globals.css` → `sky-ui-craft/references/tokens.css` içeriği (vurgu rengini projeye göre seç)
   - `src/lib/env.ts` (Zod) + `.env.example`
   - Temel layout: skip-link, header, `<main>`, footer, `lang="tr"` (içerik diline göre)
   - 404 ve hata sayfası
   - Vitest + Testing Library, bir smoke testi; Playwright + bir E2E testi
   - `typecheck`, `lint`, `test`, `test:e2e` scriptleri
   - Kısa `README.md` ve proje için `CLAUDE.md` (stack, komutlar, Sky kurallarına atıf)
6. `typecheck`, `lint`, `test` çalıştır; geliştirme sunucusunu açıp ana sayfayı 375px ve masaüstünde kontrol et.
7. Kurulan yapıyı ve sonraki 3 önerilen adımı raporla.
