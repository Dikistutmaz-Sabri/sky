---
description: Bir özelliği veya hata düzeltmesini TDD ile uygula — önce davranış listesi, sonra başarısız testler (kullanıcıya gösterilir), sonra en küçük uygulama ve refactor.
argument-hint: "<davranış veya hata açıklaması>"
---

# /sky-tdd

Görev: `$ARGUMENTS`

1. `sky:sky-tdd` ve `sky:sky-testing` skill'lerini yükle (dile göre ilgili skill de).
2. Mevcut test altyapısını bul (çalıştırma komutu, test dosyası düzeni, fabrikalar).
3. **Davranış listesi** çıkar (mutlu yol, hata yolları, sınırlar, yetki, saat dilimi/Türkçe karakter ilgiliyse) ve kullanıcıya göster.
4. Listeden testleri yaz ve çalıştır — **kırmızı** olduklarını ve doğru sebeple başarısız olduklarını göster. Hata düzeltmesinde önce hatayı yeniden üreten test.
5. Testleri geçiren en küçük uygulamayı yaz → **yeşil**. Testleri değiştirerek geçirme; test yanlışsa ayrıca ve açıkça belirt.
6. Refactor (testler yeşil kalarak); typecheck + lint.
7. Raporla: davranış listesi (✓), test dosyaları, kırmızı → yeşil kanıtı (komut çıktısı özetleri), kapsanamayanlar.
