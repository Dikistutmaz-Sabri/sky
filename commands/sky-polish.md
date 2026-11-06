---
description: Bir ekranı veya bileşeni Sky UI standartlarına göre cilala — token'lar, tipografi, boşluk, durumlar, dark mode, hareket ve responsive.
argument-hint: "[dosya, route veya bileşen adı]"
disable-model-invocation: true
---

# /sky-polish

Hedef: `$ARGUMENTS` (boşsa son değiştirilen UI dosyaları)

1. `sky:sky-ui-craft` ve `sky:sky-motion` skill'lerini yükle.
2. Hedefi tarayıcıda aç ve 375px + 1280px, açık + koyu temada **önce** ekran görüntüsü al.
3. Sorunları listele (token dışı değerler, hiyerarşi, boşluk ritmi, eksik durumlar, hizalama,
   hareket, taşma). Kullanıcıya kısa bir liste göster.
4. Düzelt — davranışı değiştirmeden, yalnızca görsel ve etkileşim kalitesi:
   - Ham değerleri token'a çevir
   - Tipografi ölçeği ve ağırlıkları düzenle
   - Eksik hover/focus/active/disabled/loading/boş/hata durumlarını ekle
   - Uygun yerlere ince geçişler (≤ 240ms, ease-out, reduced-motion desteği)
   - Responsive taşmaları gider
5. **Sonra** ekran görüntülerini al, önce/sonra farkını özetle. Konsol hatası olmadığını doğrula.
