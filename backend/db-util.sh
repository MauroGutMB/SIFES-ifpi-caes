#!/usr/bin/env bash
# CLI de manipulação do banco de dados do SIFES (Postgres + Prisma).
set -euo pipefail

cd "$(dirname "$0")"
COMPOSE_FILE="../docker-compose.dev.yml"
DB_USER="sifes"
DB_NAME="sifes"
SNAPSHOTS_DIR="db-snapshots"

postgres_cid() {
  docker compose -f "$COMPOSE_FILE" ps -q postgres
}

ensure_up() {
  local cid
  cid=$(postgres_cid)
  if [ -z "$cid" ]; then
    echo "==> Postgres não está rodando, subindo (docker compose up -d)"
    docker compose -f "$COMPOSE_FILE" up -d
  fi
  echo "==> Aguardando o Postgres aceitar conexões"
  until docker exec "$(postgres_cid)" pg_isready -U "$DB_USER" -d "$DB_NAME" >/dev/null 2>&1; do
    sleep 1
  done
}

cmd_up() {
  ensure_up
  echo "Postgres no ar."
}

cmd_down() {
  echo "==> Parando o Postgres (dados preservados no volume)"
  docker compose -f "$COMPOSE_FILE" down
}

cmd_status() {
  ensure_up
  npx prisma migrate status
}

cmd_migrate() {
  ensure_up
  npx prisma migrate deploy
}

cmd_generate() {
  npx prisma generate
}

cmd_seed() {
  ensure_up
  npx prisma db seed
}

cmd_reset_db() {
  ensure_up
  echo "==> ATENÇÃO: isso apaga TODOS os dados do banco e reaplica as migrations do zero."
  npx prisma migrate reset --force
  # O Prisma 7 não roda mais o seed automaticamente no reset (diferente de versões antigas).
  echo "==> Rodando o seed (cria o admin)"
  npx prisma db seed
}

cmd_populate_realcase() {
  ensure_up
  echo "==> Populando cenário realista de demonstração"
  npx tsx prisma/seed-realcase.ts
}

cmd_snapshot() {
  ensure_up
  mkdir -p "$SNAPSHOTS_DIR"
  local nome="${1:-$(date +%Y%m%d-%H%M%S)}"
  local arquivo="$SNAPSHOTS_DIR/${nome}.sql"
  echo "==> Gerando snapshot em $arquivo"
  docker exec "$(postgres_cid)" pg_dump -U "$DB_USER" -d "$DB_NAME" --clean --if-exists > "$arquivo"
  echo "Snapshot salvo: $arquivo"
}

cmd_list_snapshots() {
  if [ ! -d "$SNAPSHOTS_DIR" ] || [ -z "$(ls -A "$SNAPSHOTS_DIR" 2>/dev/null)" ]; then
    echo "Nenhum snapshot encontrado em $SNAPSHOTS_DIR/"
    return
  fi
  ls -lh "$SNAPSHOTS_DIR"
}

cmd_restore() {
  local arquivo="${1:-}"
  if [ -z "$arquivo" ] || [ ! -f "$arquivo" ]; then
    echo "Uso: db-util.sh --restore <caminho-do-snapshot.sql>"
    echo "Snapshots disponíveis:"
    cmd_list_snapshots
    exit 1
  fi
  ensure_up
  echo "==> Restaurando $arquivo (o dump já limpa o schema antes de recriar, via --clean --if-exists)"
  docker exec -i "$(postgres_cid)" psql -U "$DB_USER" -d "$DB_NAME" < "$arquivo"
  echo "Restauração concluída."
}

cmd_shell() {
  ensure_up
  echo "==> Abrindo psql (\\q para sair)"
  docker exec -it "$(postgres_cid)" psql -U "$DB_USER" -d "$DB_NAME"
}

cmd_studio() {
  ensure_up
  npx prisma studio
}

cmd_help() {
  cat <<'EOF'
db-util.sh — manipulação do banco de dados do SIFES

Uso: ./db-util.sh <comando> [argumento]

Ciclo de vida do Postgres:
  --up                       Sobe o Postgres (docker compose up -d) e espera ficar pronto
  --down                     Para o Postgres (mantém os dados no volume)
  --shell                    Abre um psql interativo dentro do container

Prisma / schema:
  --status                   Mostra o status das migrations (aplicadas/pendentes)
  --migrate                  Aplica migrations pendentes (prisma migrate deploy)
  --generate                 Regenera o Prisma Client
  --seed                     Roda o seed mínimo (cria o admin, se não existir)
  --studio                   Abre o Prisma Studio (GUI web pra inspecionar o banco)

Dados de teste:
  --reset-db                 Apaga tudo e reaplica as migrations do zero (roda o seed no final)
  --populate-realcase        Popula um cenário acadêmico completo de demonstração
                              (semestre, turmas, professores, alunos, matérias, notas,
                              frequência, uma matéria já encerrada) — não duplica se já rodou

Backup/restauração:
  --snapshot [nome]           Salva um dump em db-snapshots/<nome-ou-timestamp>.sql
  --list-snapshots            Lista os snapshots salvos
  --restore <caminho>         Restaura o banco a partir de um snapshot

  --help                      Mostra esta ajuda
EOF
}

case "${1:-}" in
  --up) cmd_up ;;
  --down) cmd_down ;;
  --status) cmd_status ;;
  --migrate) cmd_migrate ;;
  --generate) cmd_generate ;;
  --seed) cmd_seed ;;
  --reset-db) cmd_reset_db ;;
  --populate-realcase) cmd_populate_realcase ;;
  --snapshot|--snapshot-db) cmd_snapshot "${2:-}" ;;
  --list-snapshots) cmd_list_snapshots ;;
  --restore) cmd_restore "${2:-}" ;;
  --shell) cmd_shell ;;
  --studio) cmd_studio ;;
  --help|"") cmd_help ;;
  *)
    echo "Comando desconhecido: $1"
    echo
    cmd_help
    exit 1
    ;;
esac
