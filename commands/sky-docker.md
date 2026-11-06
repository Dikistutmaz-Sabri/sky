---
description: Projeyi Dockerize et — dile uygun çok aşamalı Dockerfile, .dockerignore, healthcheck, yerel geliştirme için docker compose (DB, Redis, Mailpit, MinIO) ve build doğrulaması.
argument-hint: "[servis veya klasör]"
disable-model-invocation: true
---

# /sky-docker

Hedef: `$ARGUMENTS` (boşsa proje kökü)

1. `sky:sky-docker` skill'ini yükle; stack'i tanı (package.json, pyproject.toml, go.mod, Cargo.toml, pom.xml, *.csproj, composer.json, Gemfile).
2. Mevcut Dockerfile/compose varsa önce oku ve iyileştirme önerisi sun; üzerine körlemesine yazma.
3. Oluştur: çok aşamalı Dockerfile (bağımlılık katmanı önce, non-root, exec biçimi CMD, sürüm sabitli taban imaj), `.dockerignore`, uygulamaya sağlık uç noktası yoksa ekleme önerisi.
4. `compose.yaml`: uygulama + ihtiyaç duyduğu servisler (Postgres, Redis, Mailpit, MinIO), healthcheck'li `depends_on`, volume'ler, `develop.watch`.
5. Doğrula: `docker build` (çalıştırılabiliyorsa), imaj boyutunu raporla, `docker compose config` ile sözdizimi; `hadolint` varsa çalıştır.
6. Raporla: dosyalar, imaj boyutu, çalıştırma komutları (`docker compose up --watch`), üretim için notlar (bkz. `sky-deploy`).
