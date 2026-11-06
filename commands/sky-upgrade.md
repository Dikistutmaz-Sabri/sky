---
description: Bir bağımlılığı, framework'ü veya dil sürümünü güvenle yükselt — resmi codemod, adım adım göç, kırılma noktaları ve doğrulama (typecheck/lint/test/build/E2E) ile.
argument-hint: "<ne, ör. 'Next 15'e', 'Tailwind v4', 'React 19', 'TypeScript'e geç'>"
disable-model-invocation: true
---

# /sky-upgrade

Hedef: `$ARGUMENTS`

1. `sky:sky-upgrades` skill'ini (ve ilgili framework skill'ini: `sky-nextjs`, `sky-tailwind` vb.) yükle.
2. Mevcut durumu tespit et: sürümler (`package.json`/kilit, `go.mod`, `Cargo.toml`…), testlerin yeşil olduğu, temiz çalışma alanı (git).
3. Resmi upgrade guide'ı/sürüm notlarını oku (güncel bilgi — ezberden değil); resmi codemod varsa önce onu çalıştır.
4. Bir seferde bir büyük yükseltme; değişiklikleri küçük adımlarla uygula.
5. Doğrula: `typecheck`, `lint`, `test`, `build`, (varsa) E2E; kritik sayfaları/komutları dene.
6. Kırılma noktalarını ve elle gereken değişiklikleri raporla; geri alma = commit'i geri al (bkz. `sky-git`).
