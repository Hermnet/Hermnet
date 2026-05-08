#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"

if [ ! -f .env ]; then
  echo "Falta .env — copia .env.example y rellénalo." >&2
  exit 1
fi

set -a
. ./.env
set +a

export PATH="$JAVA_HOME/bin:$PATH"

docker compose up -d
exec mvn spring-boot:run
