---
description: Teslim öncesi Sky kontrolü — typecheck, lint, test, build, güvenlik taraması, UI kontrolü ve diff incelemesi; GEÇTİ/KALDI raporu.
argument-hint: "[--hizli]"
---

# /sky-check

Seçenekler: `$ARGUMENTS` (`--hizli` verilirse build ve tarayıcı adımlarını atla)

Projenin `package.json` scriptlerini oku ve mevcut olanları sırayla çalıştır. Bir adım başarısız
olursa durma; hepsini çalıştırıp sonunda raporla.

1. **Tipler** — `typecheck` veya `tsc --noEmit`
2. **Lint** — `lint`
3. **Testler** — `test` (coverage varsa yüzdesini not et)
4. **Build** — `build`
5. **Güvenlik taraması** — değişen dosyalarda: sabit anahtar/token kalıpları, istemci dosyasında
   `process.env` sırları, `dangerouslySetInnerHTML`, ham SQL, `console.log` kalıntıları; `npm audit --omit=dev` (yüksek/kritik)
6. **UI** — UI dosyası değiştiyse geliştirme sunucusunda değişen ekranları 375px ve masaüstünde aç; konsol hatalarını oku
7. **Diff incelemesi** — `git diff` üzerinden: kapsam dışı değişiklik, debug kodu, TODO, yorum satırına alınmış kod

## Rapor

```
Sky Check — GEÇTİ | KALDI
Tipler   ✓/✗
Lint     ✓/✗
Test     ✓/✗ (n geçti, m kaldı, %coverage)
Build    ✓/✗/atlandı
Güvenlik ✓/⚠ (bulgular)
UI       ✓/⚠/atlandı
Diff     ✓/⚠
```
Başarısız her adım için ilgili çıktının kısa alıntısını ve önerilen düzeltmeyi ekle.
