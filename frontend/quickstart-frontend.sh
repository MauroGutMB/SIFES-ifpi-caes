#!/usr/bin/env bash
# Sobe o frontend do zero: instala deps, gera o cliente da API a partir do
# backend (se ele estiver no ar) e inicia o Vite em modo dev.
set -euo pipefail

cd "$(dirname "$0")"
BACKEND_URL="${BACKEND_URL:-http://localhost:3000}"

echo "==> Instalando dependências (npm install)"
npm install

echo "==> Gerando cliente da API (orval)"
if curl -sf -m 3 "$BACKEND_URL/docs-json" >/dev/null 2>&1; then
  npm run codegen
else
  echo "    Backend não respondeu em $BACKEND_URL — pulando codegen."
  echo "    Suba o backend (./quickstart-backend.sh) e depois rode \"npm run codegen\" aqui."
fi

echo "==> Subindo o Vite em modo dev"
echo "    Frontend disponível em http://localhost:5173"
npm run dev
