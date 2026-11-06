---
description: Sky Pano'yu aç — tüm skill, agent, komut ve hook'ları gösteren yerel, aranabilir sayfayı derleyip tarayıcıda açar.
argument-hint: "[--out <dosya.html>]"
disable-model-invocation: true
---

# /sky-pano

Ek argüman: `$ARGUMENTS`

1. Panoyu derle ve aç:
   ```bash
   node "${CLAUDE_PLUGIN_ROOT}/dashboard/build.mjs" --open $ARGUMENTS
   ```
   `${CLAUDE_PLUGIN_ROOT}` boş gelirse Sky'ın klasörünü bul (`~/.claude/plugins/` altında `dashboard/build.mjs`
   içeren `sky` klasörü) ve betiği oradan çalıştır. Betik yalnızca Node kullanır, hiçbir şey kurmaz.
2. Çıktıdaki dosya yolunu ve sayıları kullanıcıya bildir. Tarayıcı açılmadıysa yolu ver; sayfa tek dosyadır,
   sunucu gerektirmez ve çevrimdışı açılır.
3. Çıktıda `uyarı:` satırı varsa kısaca aktar. Bunlar Sky'ın kendi tutarlılık kontrolüdür: router'da olmayan
   skill, açıklaması olmayan hook gibi.
4. Canlı sürümü de söyle: eklenti klasöründe `npm start` yazınca pano http://localhost:4242 adresinde açılır ve
   dosyalar değiştikçe kendini yeniler. Sunucuyu sen başlatma; kullanıcı kendi terminalinde çalıştırsın.
5. Kısayolları hatırlat: `⌘K` / `Ctrl+K` her şeyi ara, `/` listede ara, `T` tema, ayrıntı panelinde `←` `→` gezin.
