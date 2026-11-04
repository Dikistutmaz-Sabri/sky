---
description: Sky ile dönüşüm odaklı bir landing sayfası oluştur — bölüm iskeleti, metin, token'lı tasarım, SEO meta ve JSON-LD dahil.
argument-hint: "<ürün/işletme ve hedef kitle>"
---

# /sky-landing

Konu: `$ARGUMENTS`

1. `sky:sky-landing`, `sky:sky-ui-craft` ve `sky:sky-motion` skill'lerini yükle.
2. Tasarım yönünü bir cümleyle belirle (ton, vurgu rengi, font eşleşmesi) ve kullanıcıya göster.
3. Bölüm iskeletini konuya göre seç (tam veya kısa sayfa) ve her bölümü ayrı bileşen olarak yaz.
4. Metni sonuç odaklı yaz. Gerçek veri yoksa istatistik, yorum ve logolar için açıkça
   "yer tutucu" kullan — uydurma rakam veya gerçek marka logosu koyma.
5. SEO: metadata, OG görseli yeri, canonical, uygun JSON-LD, sitemap/robots.
6. Erişilebilirlik ve performans: tek h1, hero görseli öncelikli, diğerleri lazy, aspect-ratio, reduced-motion.
7. Tarayıcıda 375px + 1280px, açık + koyu temada kontrol et; Lighthouse çalıştırılabiliyorsa puanları raporla.
