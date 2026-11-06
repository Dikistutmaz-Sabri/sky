---
description: Sky UI + erişilebilirlik denetimi — sky-ui-reviewer yöntemi ve otomatik axe taramasıyla önem sıralı rapor üretir, kod değiştirmez.
argument-hint: "[route, dosya veya klasör]"
disable-model-invocation: true
---

# /sky-ui-audit

Kapsam: `$ARGUMENTS` (boşsa tüm `src/` UI kodu)

1. `sky:sky-a11y` skill'ini yükle.
2. `sky-ui-reviewer` yöntemini kapsamla çalıştır.
3. Geliştirme sunucusu çalışıyor veya başlatılabiliyorsa:
   - Ana route'ları tarayıcıda aç, yalnızca klavyeyle temel akışı dene (Tab sırası, odak görünürlüğü, Esc).
   - Projede Playwright varsa `@axe-core/playwright` ile tarama yap (paket yoksa kurmadan önce sor).
4. Bulguları birleştir, tekrarları ayıkla, önem sırasına göre raporla:
   `[Önem] dosya:satır — sorun — düzeltme`
5. Sonunda kullanıcıya hangi önem seviyesine kadar düzeltmek istediğini sor. Bu komut kendi başına kod değiştirmez.
