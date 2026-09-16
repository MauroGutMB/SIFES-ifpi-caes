#!/usr/bin/env bash
# Sobe o backend do zero: instala deps, sobe o Postgres, aplica migrations,
# gera o Prisma Client, roda o seed do admin e inicia a API em modo dev.
set -euo pipefail

cd "$(dirname "$0")"
COMPOSE_FILE="../docker-compose.dev.yml"

echo "==> Instalando dependências (npm install)"
npm install

echo "==> Subindo PostgreSQL (docker compose)"
docker compose -f "$COMPOSE_FILE" up -d

echo "==> Aguardando o PostgreSQL aceitar conexões"
POSTGRES_CID=$(docker compose -f "$COMPOSE_FILE" ps -q postgres)
until docker exec "$POSTGRES_CID" pg_isready -U sifes -d sifes >/dev/null 2>&1; do
  sleep 1
done

echo "==> Aplicando migrations (prisma migrate deploy)"
npx prisma migrate deploy

echo "==> Gerando Prisma Client (prisma generate)"
npx prisma generate

echo "==> Rodando seed do admin (prisma db seed)"
npx prisma db seed

echo "==> Subindo a API em modo dev (npm run start:dev)"
echo "    Swagger disponível em http://localhost:3000/docs"
npm run start:dev
