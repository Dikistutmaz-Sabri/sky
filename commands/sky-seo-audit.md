---
description: Sky SEO denetimi — teknik SEO, metadata, JSON-LD, sitemap/robots, slug/yönlendirme, hreflang ve yerel SEO kontrolü; öncelikli düzeltme listesi üretir.
argument-hint: "[route, klasör veya canlı URL]"
---

# /sky-seo-audit

Kapsam: `$ARGUMENTS` (boşsa tüm proje)

1. `sky:sky-seo` skill'ini yükle.
2. `sky-seo-auditor` agent'ını kapsamla çalıştır.
3. Canlı URL verildiyse veya erişilebiliyorsa: ana sayfaların HTML'inde title/description/canonical/OG/JSON-LD'yi doğrula; Lighthouse SEO + performans puanlarını al.
4. Bulguları birleştir, önceliklendir (etki × kolaylık), raporla:
   `[Yüksek|Orta|Düşük] sayfa — sorun — düzeltme`
5. "İlk 30 gün" listesi: Search Console doğrulama + sitemap gönderimi, Google İşletme profili (yerel işletmeyse), içerik önerileri.
6. Kullanıcıya hangi önceliğe kadar düzeltmek istediğini sor; bu komut kendi başına kod değiştirmez.
