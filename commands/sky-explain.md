---
description: Bir dosyayı, fonksiyonu, kavramı, hata mesajını veya tüm kod tabanını seviyeye uygun Türkçe açıklar — özet, benzetme, örnek, adım adım izleme, diyagram ve kontrol soruları ile.
argument-hint: "<dosya yolu | kavram | hata mesajı | 'proje'> [başlangıç|orta|ileri]"
---

# /sky-explain

Konu: `$ARGUMENTS`

1. `sky:sky-explain` skill'ini yükle.
2. Konu türünü belirle: dosya/fonksiyon (oku), kavram (gerekirse projeden örnek bul), hata mesajı (ilgili kodu bul), "proje" (kod tabanı turu — gerekirse `sky-codebase-mapper` ile harita çıkar).
3. Seviye belirtilmemişse orta seviye varsay.
4. `sky-explainer` agent'ı ile veya doğrudan, skill'deki yapıyla açıkla; gerçek dosya:satır atıfları ver.
5. Sonunda kontrol sorusu ve "daha derin/daha basit istersen" seçeneği.
