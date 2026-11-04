---
description: Son sürümden bu yana yapılan değişikliklerden kullanıcı dostu changelog ve teknik sürüm notu çıkar, sürüm numarası öner; değişiklikleri koddan/git'ten okur.
argument-hint: "[önceki etiket/sürüm, ör. v1.3.0]"
---

# /sky-changelog

Önceki sürüm: `$ARGUMENTS` (boşsa son git etiketi)

1. `sky:sky-changelog` skill'ini yükle.
2. Değişiklikleri topla: `git log <önceki>..HEAD --oneline`, `git diff --stat`; Conventional Commits'ten grupla (feat/fix/perf…).
3. **Kullanıcı changelog'u** (fayda odaklı, Türkçe, kategorili: Yeni / İyileştirme / Düzeltme) — teknik commit mesajını kullanıcı diline çevir, teşekkür notu.
4. **Teknik sürüm notu** (geliştiriciler için) + kırıcı değişiklikler ayrı bölüm.
5. semver veya tarih bazlı sürüm numarası öner (gerekçesiyle).
6. İstenirse `CHANGELOG.md`'ye ekle ve `/changelog` sayfası için MDX taslağı; `sky-release-manager` agent'ı tam yayın hazırlığı yapar.
