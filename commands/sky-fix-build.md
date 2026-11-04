---
description: Kırık build'i, typecheck'i veya lint'i en küçük düzeltmelerle yeşile döndür — susturma (any/ts-ignore/disable) yok, davranış değişikliği yok.
argument-hint: "[komut — ör. 'pnpm build']"
---

# /sky-fix-build

Komut: `$ARGUMENTS` (boşsa projenin `build`, `typecheck` ve `lint` scriptleri)

1. Komutu çalıştır, tam çıktıyı al.
2. `sky-build-fixer` agent'ını çıktıyla birlikte çalıştır (veya aynı yöntemi doğrudan uygula): hataları grupla, kök nedenden başla, en küçük düzeltme.
3. Her turdan sonra yeniden çalıştır; yeşil olana kadar. Susturma (`any`, `@ts-ignore`, `eslint-disable`, testleri atlama) yasak — kaçınılmazsa gerekçesiyle raporla.
4. Bağımlılık/sürüm kaynaklıysa büyük yükseltmeyi kendi başına yapma; öner (bkz. `sky-upgrades`).
5. Raporla: kök neden, değişen dosyalar, son çıktı.
