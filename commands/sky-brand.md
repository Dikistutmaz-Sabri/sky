---
description: Sky marka kiti — kişilik, renk paleti (oklch, açık/koyu, kontrastlı), font eşleşmesi, tokens.css, favicon/OG/ikon seti ve marka sayfası üretir.
argument-hint: "<marka adı, sektör ve varsa mevcut logo/renk>"
---

# /sky-brand

Marka: `$ARGUMENTS`

1. `sky:sky-brand`, `sky:sky-color`, `sky:sky-web-fonts` skill'lerini yükle.
2. `sky-designer` agent'ı ile 2 tasarım yönü çıkar (3 sıfat, palet, fontlar, kompozisyon); önerileni işaretleyip kullanıcıya göster ve seçimini bekle (yalnızca bu karar için).
3. Seçilen yönle:
   - `styles/tokens.css` (veya `globals.css` token bölümü): oklch palet ölçekleri, semantic roller, açık + koyu tema, kontrast oranları yorum olarak.
   - Tailwind `@theme inline` eşlemesi.
   - Font kurulumu (`next/font` veya self-host, `latin-ext`).
   - Logo yoksa geçici SVG wordmark (`currentColor`).
   - Favicon (SVG + koyu mod), apple-icon, PWA ikonları, dinamik `opengraph-image`.
   - `/marka` sayfası veya `docs/brand.md` (renkler kopyalanabilir, logo indirme, ses tonu).
4. Kontrastları hesaplayıp doğrula; tarayıcıda örnek sayfayı açık/koyu temada kontrol et.
5. Raporla: oluşturulan dosyalar, palet özeti, kullanım notları.
