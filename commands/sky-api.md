---
description: Sky ile bir API uç noktası veya server action oluştur — şema, kimlik, yetki, servis katmanı, hata modeli ve testlerle birlikte.
argument-hint: "<kaynak ve işlem, ör. 'randevu oluşturma POST'>"
---

# /sky-api

Görev: `$ARGUMENTS`

1. `sky:sky-backend-api` ve gerekirse `sky:sky-data` skill'lerini yükle.
2. Projede API'lerin nasıl yazıldığını bul (route handler, server action, Express, tRPC…) ve aynı kalıbı kullan.
3. Sırayla yaz:
   - Zod girdi şeması (istemciyle paylaşılabilir konumda)
   - Gerekirse şema/migration değişikliği (indeks ve kısıtlarla)
   - Servis fonksiyonu: iş kuralları + yetki kontrolü
   - Handler: kimlik → parse → servis → DTO yanıtı; tutarlı hata gövdesi
   - Hassas uç noktaysa rate limit
4. Testler: başarılı yol, doğrulama hatası (422), yetkisiz (401), başkasının kaynağı (403/404).
5. Testleri çalıştır, ardından `sky-api-reviewer` agent'ıyla değişikliği denetlet ve kritik/yüksek bulguları düzelt.
6. Uç noktanın sözleşmesini (yöntem, yol, girdi, yanıt, hata kodları) kısaca raporla.
