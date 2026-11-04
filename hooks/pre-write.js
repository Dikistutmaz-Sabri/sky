#!/usr/bin/env node
// PreToolUse(Write|Edit|MultiEdit): .env dosyalarına yazmadan önce kullanıcı onayı ister.
const path = require("path");
const { readInput, disabled, ask } = require("./lib");

if (disabled("env")) process.exit(0);
const input = readInput();
const filePath = (input.tool_input && (input.tool_input.file_path || input.tool_input.path)) || "";
const base = path.basename(filePath);

if (/^\.env(\..+)?$/.test(base) && !/\.(example|sample|template|defaults)$/.test(base)) {
  ask(
    `Sky: \`${base}\` gerçek gizli anahtarlar içerebilir. Bu dosyayı değiştirmek için kullanıcı onayı gerekiyor; ` +
      `yeni değişken eklemek yeterliyse \`.env.example\` dosyasını güncelle.`
  );
}
process.exit(0);
