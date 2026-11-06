---
description: Sky hata ayıklama — hatayı yeniden üret, kök nedeni kanıtla, en küçük düzeltmeyi yap ve regresyon testi yaz.
argument-hint: "<belirti, hata mesajı veya adımlar>"
disable-model-invocation: true
---

# /sky-debug

Belirti: `$ARGUMENTS`

1. `sky:sky-debug` skill'ini yükle; belirtinin türüne göre tanı tablosunu bul (hydration, sonsuz render, CORS, env, cache, çerez, build, bellek, yavaşlık, flaky test, Türkçe karakter, saat dilimi).
2. Bilgi eksikse yalnızca gerekli olanı sor (hangi sayfa, hangi ortam, tam hata metni); yoksa kendin topla (loglar, `git log -10`, son değişiklikler).
3. Yeniden üret — mümkünse başarısız bir testle.
4. Hipotezleri sırala ve kanıtla (geçici log/test). Tahminle kod değiştirme.
5. Kök nedeni düzelt (en küçük değişiklik); regresyon testi önce kırmızı sonra yeşil.
6. Geçici debug kodunu temizle; `typecheck`, `lint`, `test`.
7. Karmaşık veya tekrarlayan hatalarda `sky-debugger` yöntemini kullan.
8. Raporla: belirti · kök neden (dosya:satır) · düzeltme · test · aynı kalıp başka yerde var mı.
