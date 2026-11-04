---
description: Bir işi uygulamadan önce planla — netleştir, dikey dilimlere böl, riskleri ve bilinmeyenleri çıkar, her dilim için bitti ölçütü ve tahmin aralığı ver, isteğe bağlı plan dosyası yaz. Kod yazmaz.
argument-hint: "<iş/özellik açıklaması>"
---

# /sky-plan

İş: `$ARGUMENTS`

1. `sky:sky-planning` skill'ini yükle; mimari karar varsa `sky-architect`, ürün belirsizliği varsa `sky-product-manager` agent'ını kullan.
2. İlgili kodu ve CLAUDE.md'yi oku (mevcut yapıyı yeniden icat etme).
3. Netleştir: hedef ve başarı ölçütü, kapsam dışı, kısıtlar; yalnızca kullanıcıya ait kararlar için soru listesi.
4. Dikey dilimler (her biri deploy edilebilir değer), en riskli/bilinmeyen önce (gerekirse zaman kutulu spike).
5. Her dilim: dokunulacak dosyalar/alanlar, bitti ölçütü, tahmin aralığı, riskler.
6. Büyük kararlar için `sky-critic` ile hızlı itiraz turu (isteğe bağlı).
7. Planı göster; kullanıcı isterse `docs/plans/<özellik>.md` olarak yaz. Bu komut kod yazmaz.
