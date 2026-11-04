---
description: Uygulamaya bir AI özelliği ekle — kullanım senaryosu, model seçimi, streaming/structured output/tool use/RAG mimarisi, güvenlik, maliyet, UX ve eval seti ile.
argument-hint: "<AI özelliği, ör. 'serbest metinden randevu formu doldurma'>"
---

# /sky-ai

Özellik: `$ARGUMENTS`

1. `claude-api` skill'ini (güncel model ID'leri ve SDK) ve `sky:sky-ai`, `sky:sky-ai-ux` skill'lerini yükle; çok adımlı/araçlı ise `sky:sky-ai-agents`, belge tabanlıysa RAG bölümü.
2. Senaryoyu netleştir: girdi, çıktı, kim kullanır, hata maliyeti (yanlış çıktı ne kadar zararlı?), insan onayı gereken noktalar.
3. Mimari seç: tek çağrı / structured output / tool use / RAG / ajan — en basit yeterli olanı. Model seçimini görev zorluğuna göre gerekçelendir.
4. Uygula: sunucu tarafı uç nokta (auth, rate limit, kota, log), Zod şemalı çıktı, streaming gerekiyorsa UI, düzenlenebilir/onaylanabilir sonuç, geri bildirim (👍/👎).
5. Güvenlik: prompt injection önlemleri, yıkıcı araçlarda onay, kişisel veri minimizasyonu, çıktının güvenli render'ı.
6. Maliyet: prompt caching, uygun model, `max_tokens`, kullanıcı kotası.
7. `sky:sky-ai-eval` ile 20+ örnekli başlangıç eval seti oluştur ve çalıştır; sonuçları raporla.
8. Raporla: mimari, dosyalar, tahmini maliyet/istek, eval sonucu, bilinen sınırlar.
