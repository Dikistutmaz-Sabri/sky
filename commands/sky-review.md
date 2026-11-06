---
description: Sky kod incelemesi — mevcut değişiklikleri (veya verilen PR/dalı) öncelik sırasıyla inceler, dil/alan denetçilerini devreye sokar ve etiketli bulgular raporlar. Kod değiştirmez.
argument-hint: "[dal | PR numarası | dosya yolu]"
disable-model-invocation: true
---

# /sky-review

Kapsam: `$ARGUMENTS` (boşsa: `git diff` + `git diff --staged`; ikisi de boşsa `main...HEAD`)

1. `sky:sky-code-review` skill'ini yükle.
2. Değişen dosyaları listele ve türüne göre denetçi seç:
   - her durumda `sky-code-reviewer`
   - auth/ödeme/API/webhook/yükleme dokunulduysa `sky-security-reviewer`
   - şema/migration/sorgu varsa `sky-db-reviewer`
   - UI dosyaları varsa `sky-ui-reviewer`
   - Python/Go/Rust/mobil dosyalar varsa ilgili dil denetçisi (`sky-python-reviewer`, `sky-go-reviewer`, `sky-rust-reviewer`, `sky-mobile-reviewer`)
   Bağımsız olanları paralel çalıştır.
3. Mümkünse `typecheck`, `lint`, `test` çalıştır.
4. Bulguları birleştir, tekrarları ayıkla, önem sırasına koy: `[blocker]` → `[öneri]` → `[nit]` → `[soru]` → `[övgü]`.
5. Sonunda: "Birleştirmeye hazır mı?" (evet / blocker'lar düzelince / hayır) ve kullanıcıya hangi bulguları düzeltmek istediğini sor.
