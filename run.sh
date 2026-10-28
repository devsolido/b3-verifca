#!/usr/bin/env bash
# Compila e executa o Radar Fundamentalista B3 (requer JDK 17 ou superior).
set -euo pipefail
cd "$(dirname "$0")"

if ! command -v javac >/dev/null 2>&1; then
  echo "JDK 17+ não encontrado. Instale o JDK e tente novamente." >&2
  exit 1
fi

mkdir -p out
javac -encoding UTF-8 -d out src/main/java/br/radar/*.java
exec java -cp out br.radar.Main
