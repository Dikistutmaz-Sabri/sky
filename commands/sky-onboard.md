---
description: Mevcut bir kod tabanını keşfet ve yeni gelen (veya AI) için harita çıkar — stack, giriş noktaları, klasör sorumlulukları, veri modeli, auth akışı, komutlar, test durumu, teknik borç; CODEMAP ve "ilk gün" özeti.
argument-hint: "[klasör veya 'proje']"
---

# /sky-onboard

Kapsam: `$ARGUMENTS` (boşsa tüm proje)

1. `sky-codebase-mapper` agent'ını çalıştır (yoksa `sky:sky-architecture-docs` kurallarıyla doğrudan).
2. Keşfet: `package.json`/manifest'ler → stack; klasör ağacı → sorumluluklar; route/giriş noktaları; şema → veri modeli; auth akışı; dış entegrasyonlar; test durumu; büyük dosyalar/`any`/TODO sinyalleri.
3. Üret: `docs/CODEMAP.md` (klasör → sorumluluk → "şunu değiştirmek için buraya bak"), 1 Mermaid bağlam diyagramı, "ilk gün" özeti (10 madde), risk/borç listesi, uygulanabilir Sky skill'leri.
4. İstenirse `sky:sky-claude-md` ile CLAUDE.md taslağı öner.
5. Açıklama gerekiyorsa `sky:sky-explain` ile seviyeye uygun özet.
