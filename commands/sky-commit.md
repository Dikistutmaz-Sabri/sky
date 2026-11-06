---
description: Sahnelenmiş değişikliklerden Conventional Commits uyumlu commit mesajı hazırla, kalıntı kontrolü yap ve onayla commit'le; gerekirse değişikliği mantıklı commit'lere bölmeyi öner.
argument-hint: "[--yes] [ek bağlam]"
disable-model-invocation: true
---

# /sky-commit

Seçenekler: `$ARGUMENTS`

1. `sky:sky-git` skill'ini yükle.
2. `git status` ve `git diff --staged` oku. Hiçbir şey sahnelenmemişse değişiklikleri listele ve hangilerinin sahneleneceğini sor (her şeyi körlemesine `git add -A` yapma).
3. Kalıntı kontrolü (sahnelenenlerde): `console.log`/`print`/`dbg!`, `debugger`, `.only`, `@ts-ignore`, gizli anahtar kalıpları, `.env` dosyası — varsa uyar.
4. Birden çok bağımsız değişiklik varsa ayrı commit'lere bölmeyi öner (dosya grupları ile).
5. Mesaj taslağı: tür(kapsam): başlık (≤ 72 karakter, emir kipi) + gövde (neden) + ilgili issue; repo geçmişindeki dil ve biçime uy (`git log --oneline -15`).
6. Taslağı göster. `--yes` verilmediyse onay bekle; onaydan sonra `git commit`. Push **yapma** (kullanıcı ayrıca isterse).
7. Commit sonrası kısa özet: SHA, başlık, dosya sayısı.
