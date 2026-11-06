---
description: Sky ile yeni bir sayfa/route oluştur — veri çekme, metadata (SEO/OG), loading/error/boş durumlar, yetki, responsive düzen ve testle birlikte.
argument-hint: "<route ve amaç, ör. '/o/[slug]/raporlar — aylık gelir ve randevu raporu'>"
disable-model-invocation: true
---

# /sky-page

Sayfa: `$ARGUMENTS`

1. `sky:sky-nextjs` (veya projenin router'ına uygun skill), `sky:sky-rsc-streaming`, `sky:sky-ui-craft`, `sky:sky-states-library` yükle; sayfa türüne göre ek: `sky:sky-dashboard`, `sky:sky-landing`, `sky:sky-seo`.
2. Projedeki benzer bir sayfayı bul ve yapısını örnek al (layout, veri katmanı, bileşenler).
3. Oluştur: `page.tsx` (Server Component; yetki kontrolü — `requireUser`/`requireMember`), paralel veri çekme, yavaş parçalar `Suspense` içinde, `loading.tsx` iskeleti, `error.tsx`, `not-found` durumu.
4. `generateMetadata` (title, description, OG; özel/kişisel sayfalarda `robots: noindex`).
5. Boş/hata/yükleniyor durumları, mobil düzen (375px), koyu tema.
6. Navigasyona ekle (aktif durum, breadcrumb gerekiyorsa).
7. Test: yetki (yetkisiz → yönlendirme/404), ana render; kritik sayfaysa E2E.
8. `typecheck`, `lint`, `test`, gerekiyorsa `build`; tarayıcıda iki genişlikte kontrol; raporla.
