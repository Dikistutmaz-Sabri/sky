---
description: Sky performans turu — ölç, darboğazı bul, düzelt, tekrar ölç; önce/sonra Core Web Vitals ve bundle tablosu üretir.
argument-hint: "[route veya URL]"
---

# /sky-perf

Hedef: `$ARGUMENTS` (boşsa ana sayfa)

1. `sky:sky-perf` skill'ini yükle.
2. **Ölç (önce):** production build al ve çalıştır; Lighthouse (mobil) veya DevTools performance
   trace ile LCP, INP/TBT, CLS, TTFB; bundle analizörüyle JS boyutu. Ölçemiyorsan nedenini söyle.
3. En büyük 3 darboğazı kanıtıyla listele (hangi öğe LCP, hangi görev uzun, hangi paket büyük).
4. Etkisi en yüksek olandan başlayarak düzelt; her değişiklik davranışı korusun.
5. **Ölç (sonra):** aynı koşullarda tekrar ölç.
6. `sky-perf` rapor biçimindeki tabloyla önce/sonra sonuçlarını ve yapılan değişiklikleri raporla.
