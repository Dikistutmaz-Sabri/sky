---
description: Sky tasarım sistemine uygun yeni bir UI bileşeni oluştur — cva varyantları, tüm durumlar, erişilebilirlik, test ve örnek/story ile.
argument-hint: "<bileşen adı ve amacı, ör. 'Stepper — çok adımlı form ilerlemesi'>"
disable-model-invocation: true
---

# /sky-component

Bileşen: `$ARGUMENTS`

1. `sky:sky-design-system`, `sky:sky-ui-craft` ve `sky:sky-a11y` skill'lerini yükle.
2. Projede benzer bir bileşen veya Radix/React Aria primitive'i var mı kontrol et; varsa genişlet, yoksa primitive üzerine kur.
3. API'yi önce yaz (props, varyantlar, boyutlar, kontrollü/kontrolsüz) ve kısaca göster.
4. Uygula: `components/ui/<ad>/<ad>.tsx` — cva varyantları, `cn()`, semantic token'lar, `className` birleştirme, `asChild` gerekiyorsa.
5. Durumlar: hover, focus-visible, active, disabled, loading, hata, uzun içerik, koyu tema, reduced-motion.
6. Test (`<ad>.test.tsx`): davranış + klavye + axe. Örnek/story: tüm varyant × boyut × durum matrisi (Storybook veya `/design` sayfası).
7. `typecheck`, `lint`, `test` çalıştır; tarayıcıda örnek sayfasını 375px ve masaüstünde, açık/koyu temada kontrol et.
8. Kullanım örneği ve "ne zaman kullan / kullanma" notunu raporla.
