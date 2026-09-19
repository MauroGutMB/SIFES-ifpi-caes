# SIFES — Backend

API REST em **NestJS 11**, organizada por módulos (usuários, alunos, professores, turmas, matérias, aulas, atividades, relatórios...), com **Prisma 7** sobre **PostgreSQL**, autenticação por **JWT** (access token curto + refresh token rotativo em cookie httpOnly) e autorização por papel (**ADMIN** / **PROFESSOR** / **ALUNO**) com checagem de posse dos recursos.

Consulte o [README principal](../README.md) para a visão geral do projeto e o [README do frontend](../frontend/README.md) para o cliente que consome esta API.

## Pré-requisitos

- Node.js 24+
- PostgreSQL 16 (via Docker, veja abaixo, ou uma instância própria)

## Configuração inicial

1. Copie o `.env.example` para `.env` e ajuste se necessário (os valores padrão já funcionam com o Postgres do Docker Compose abaixo):

   ```bash
   cp .env.example .env
   ```

   | Variável | Para quê serve |
   |---|---|
   | `DATABASE_URL` | Connection string do Postgres. Em produção (Neon), inclua `?sslmode=require`. |
   | `JWT_ACCESS_SECRET` / `JWT_ACCESS_EXPIRES_IN` | Segredo e validade do access token (padrão 15m). |
   | `JWT_REFRESH_SECRET` / `JWT_REFRESH_EXPIRES_IN` | Segredo e validade do refresh token (padrão 7d). |
   | `COOKIE_SECURE` | `false` em dev (HTTP local). **Precisa ser `true` em produção** (frontend e backend em domínios diferentes) senão o navegador descarta o cookie do refresh token. |
   | `WEB_ORIGIN` | Origem exata do frontend, sem barra no final — usada no CORS. |

2. Suba o Postgres local (Docker Compose, na raiz do repo):

   ```bash
   cd .. && docker compose -f docker-compose.dev.yml up -d && cd backend
   ```

   Ou use o helper `./db-util.sh --up`, que já espera o banco ficar pronto antes de retornar (veja a seção **Helper de banco** abaixo).

3. Instale as dependências, aplique as migrations e gere o Prisma Client:

   ```bash
   npm install
   npx prisma migrate deploy
   ```

   (`npm install` já roda `prisma generate` via `postinstall`.)

4. Crie o usuário admin inicial:

   ```bash
   npx prisma db seed
   ```

   Cria o login `admin` / senha `admin123` (ou os valores de `ADMIN_LOGIN`/`ADMIN_SENHA`, se definidos no ambiente) — não faz nada se esse login já existir.

## Rodando em desenvolvimento

```bash
npm run start:dev
```

Sobe em `http://localhost:3000` com hot-reload (`nest start --watch`). A documentação interativa da API (Swagger) fica em **`http://localhost:3000/docs`**, e o JSON usado pelo codegen do frontend em `http://localhost:3000/docs-json`.

Outros modos:

```bash
npm run start        # sem watch
npm run start:debug  # com watch + debugger
npm run start:prod   # produção (espera dist/ já buildado)
```

## Helper de banco (`db-util.sh`)

Script de conveniência pra manipular o Postgres local sem decorar comandos do Docker/Prisma:

```bash
./db-util.sh --up                    # sobe o Postgres e espera ficar pronto
./db-util.sh --down                  # para o Postgres (mantém os dados)
./db-util.sh --status                # status das migrations (aplicadas/pendentes)
./db-util.sh --migrate               # aplica migrations pendentes
./db-util.sh --generate              # regenera o Prisma Client
./db-util.sh --seed                  # roda o seed mínimo (cria o admin)
./db-util.sh --reset-db              # apaga e recria o banco do zero
./db-util.sh --populate-realcase     # popula um cenário acadêmico completo (2 semestres, 20 professores, 5 turmas, ~150 alunos) — útil pra testar manualmente sem cadastrar tudo na mão
./db-util.sh --shell                 # abre um psql interativo
./db-util.sh --studio                # abre o Prisma Studio (GUI web do banco)
```

## Testes

```bash
npm run test          # testes unitários (Jest, mocka o Prisma)
npm run test:cov      # unitários com relatório de cobertura
npm run test:e2e      # testes de integração — batem no Postgres de verdade
```

Os e2e (`test/*.e2e-spec.ts`) sobem a aplicação NestJS inteira e fazem requisições reais via `supertest`, então **exigem um Postgres acessível** através da `DATABASE_URL` do `.env` (o mesmo do Docker Compose serve). Eles rodam em modo ESM nativo do Jest (`NODE_OPTIONS=--experimental-vm-modules`, já embutido no script `test:e2e`) — necessário porque o compilador de queries do Prisma 7 carrega um módulo WASM via `import()` dinâmico, que o CJS padrão do Jest não suporta. Essa config fica isolada em `test/tsconfig.e2e.json` e não afeta o build de produção.

## Lint, typecheck e build

```bash
npm run lint                       # eslint --fix
npx tsc --noEmit -p tsconfig.json  # typecheck sem gerar arquivos
npm run build                      # nest build -> dist/
```

## Estrutura de pastas

```
src/
├── <módulo>/
│   ├── <módulo>.controller.ts   # rotas HTTP
│   ├── <módulo>.service.ts      # regra de negócio
│   ├── <módulo>.service.spec.ts # testes unitários (Prisma mockado)
│   └── dto/                     # DTOs de entrada (class-validator) e saída
├── auth/          # login, refresh, guards (JwtAuthGuard, RolesGuard), decorators (@Roles, @Public, @CurrentUser)
├── common/         # utilitários compartilhados: posse.util (checagem de dono do recurso), tempo.util (fuso "Brasília fake"), arquivos.util
└── prisma/         # PrismaService (client injetável)

prisma/
├── schema.prisma       # modelos, enums, datasource
├── migrations/         # histórico de migrations
├── seed.ts             # cria o admin inicial
└── seed-realcase.ts    # popula um cenário acadêmico realista de 2 semestres, pra testes manuais

test/
├── *.e2e-spec.ts        # testes de integração (Postgres real)
└── jest-e2e.json / tsconfig.e2e.json  # config isolada de e2e (ESM)
```

## Autenticação e autorização

- **Login:** `POST /auth/login` retorna um access token (JWT, ~15min) no corpo da resposta e seta um refresh token opaco (cookie `httpOnly`, ~7 dias). O refresh token é armazenado no banco como hash (nunca em texto puro) e é **rotativo**: cada uso gera um novo e invalida o anterior — reuso de um token já rotacionado revoga toda a sessão.
- **Guards globais:** `JwtAuthGuard` e `RolesGuard` são aplicados a **todas** as rotas por padrão. Uma rota só fica pública com o decorator `@Public()` explícito (hoje só `login` e `refresh`).
- **Papéis:** `@Roles(Role.ADMIN, ...)` no controller ou por rota restringe o acesso. Sem `@Roles`, qualquer usuário autenticado acessa.
- **Posse de recurso:** endpoints "meus dados" (`/alunos/me`, `/materias` filtrado, etc.) usam o `alunoId`/`professorId` **do token**, nunca de parâmetro de URL — e checagens de dono (`common/posse.util.ts`) devolvem **404** em vez de 403 quando o recurso não pertence ao usuário, pra não vazar a existência dele.

## Endpoints

> Referência rápida por módulo. Para o contrato completo (schemas de request/response), use o Swagger em `/docs` com o servidor rodando.

### Auth

- `POST /auth/login` — público — Autentica (login + senha), retorna access token e seta cookie de refresh. Rate limit de 30 req/min por IP.
- `POST /auth/refresh` — público — Renova o access token a partir do refresh token (cookie httpOnly). Rate limit de 30 req/min.
- `POST /auth/logout` — autenticado — Invalida o refresh token atual e limpa o cookie.
- `POST /auth/change-password` — autenticado — Troca a senha do próprio usuário logado.

### Users

- `GET /users` — ADMIN — Lista usuários, filtro opcional por role.
- `GET /users/me` — autenticado — Dados do próprio usuário logado.
- `POST /users/me/foto` — ADMIN, PROFESSOR — Upload direto da própria foto (multipart, campo `foto`).
- `DELETE /users/:id/foto` — ADMIN — Remove a foto de um usuário.
- `PUT /users/:id/redefinir-senha` — ADMIN — Redefine a senha de um usuário.
- `GET /users/modelo-importacao` — ADMIN — Baixa o CSV modelo pra importação em massa.
- `POST /users/importar` — ADMIN — Importa usuários em massa via CSV (multipart, campo `arquivo`).

### Alunos

- `POST /alunos` — ADMIN — Cria aluno.
- `GET /alunos` — ADMIN — Lista alunos, filtro opcional por turma.
- `GET /alunos/me` — ALUNO — Perfil do próprio aluno.
- `GET /alunos/me/semestres` — ALUNO — Semestres do próprio aluno.
- `GET /alunos/me/turma` — ALUNO — Detalhes da turma do próprio aluno.
- `GET /alunos/me/atividades-resumo` — ALUNO — Resumo de atividades por matéria.
- `GET /alunos/me/atividades-pendentes` — ALUNO — Atividades pendentes (aceita `limite`).
- `GET /alunos/:id` — ADMIN — Busca aluno por id.
- `PATCH /alunos/:id` — ADMIN — Edita aluno.
- `DELETE /alunos/:id` — ADMIN — Exclui aluno.
- `POST /alunos/:id/turma` — ADMIN — Vincula aluno a uma turma.
- `DELETE /alunos/:id/turma` — ADMIN — Desvincula aluno da turma.
- `POST /alunos/:id/materias/:materiaId` — ADMIN — Vincula aluno a uma disciplina.
- `DELETE /alunos/:id/materias/:materiaId` — ADMIN — Remove vínculo aluno-disciplina.

### Professores

- `POST /professores`, `GET /professores`, `GET /professores/:id`, `PATCH /professores/:id`, `DELETE /professores/:id` — ADMIN — CRUD de professores.

### Turmas

- `POST /turmas`, `GET /turmas` (filtro opcional por semestre), `GET /turmas/:id`, `PATCH /turmas/:id`, `DELETE /turmas/:id` — ADMIN — CRUD de turmas.

### Semestres

- `POST /semestres`, `GET /semestres`, `GET /semestres/:id`, `PATCH /semestres/:id`, `DELETE /semestres/:id` — ADMIN — CRUD de semestres.

### Matérias (disciplinas)

- `POST /materias` — ADMIN — Cria disciplina.
- `GET /materias` — ADMIN, PROFESSOR, ALUNO — Lista disciplinas (professor só vê as próprias; aluno só as vinculadas); filtros por turma/professor/estado.
- `GET /materias/:id` — ADMIN — Busca disciplina por id.
- `PATCH /materias/:id` — ADMIN — Edita disciplina.
- `DELETE /materias/:id` — ADMIN — Exclui disciplina.
- `POST /materias/:id/encerrar` — ADMIN, PROFESSOR — Encerra a disciplina (professor só depois do fim do semestre).
- `POST /materias/:id/reabrir` — ADMIN — Reabre disciplina encerrada.

### Aulas

- `GET /aulas/:id` — ADMIN, PROFESSOR — Detalhes de uma aula (com presenças).
- `PATCH /aulas/:id` — ADMIN, PROFESSOR — Edita uma aula.
- `PUT /aulas/:id/frequencias` — ADMIN, PROFESSOR — Lança/atualiza a frequência dos alunos na aula.
- `POST /aulas/:id/override` — ADMIN — Override administrativo do estado de uma aula.
- `GET /materias/:materiaId/aulas` — ADMIN, PROFESSOR, ALUNO — Lista as aulas de uma disciplina.

### Atividades

- `POST /materias/:materiaId/atividades` — ADMIN, PROFESSOR — Cria atividade (multipart: titulo, descricao, formatoExigido, prazo, anexo opcional).
- `GET /materias/:materiaId/atividades` — ADMIN, PROFESSOR, ALUNO — Lista atividades da disciplina.
- `PATCH /atividades/:id` — ADMIN, PROFESSOR — Edita atividade (multipart, anexo opcional).
- `DELETE /atividades/:id` — ADMIN, PROFESSOR — Exclui atividade.
- `GET /atividades/:id/entregas` — ADMIN, PROFESSOR — Lista entregas dos alunos.
- `POST /atividades/:id/entrega` — ALUNO — Envia a própria entrega (multipart, campo `arquivo`).
- `GET /atividades/:id/entrega` — ALUNO — Consulta a própria entrega.

### Plano de disciplina (itens de avaliação e boletim)

- `POST /materias/:materiaId/itens-avaliacao` — ADMIN, PROFESSOR — Cria item de avaliação.
- `GET /materias/:materiaId/itens-avaliacao` — ADMIN, PROFESSOR — Lista itens de avaliação.
- `PUT /materias/:materiaId/regra-aprovacao` — ADMIN, PROFESSOR — Configura a regra de aprovação da disciplina.
- `GET /materias/:materiaId/boletim` — ADMIN, PROFESSOR, ALUNO — Boletim da disciplina.
- `GET /materias/:materiaId/alunos/:alunoId/detalhamento` — ADMIN, PROFESSOR — Notas detalhadas de um aluno.
- `GET /materias/:materiaId/meu-detalhamento` — ALUNO — Notas detalhadas do próprio aluno.
- `PATCH /itens-avaliacao/:id` — ADMIN, PROFESSOR — Edita item de avaliação.
- `DELETE /itens-avaliacao/:id` — ADMIN, PROFESSOR — Exclui item de avaliação.
- `PUT /itens-avaliacao/:id/notas` — ADMIN, PROFESSOR — Lança notas dos alunos.
- `PUT /itens-avaliacao/:id/alunos/:alunoId` — ADMIN, PROFESSOR — Habilita/desabilita item especial para um aluno.
- `PUT /itens-avaliacao/:id/aplicar-abaixo-media` — ADMIN, PROFESSOR — Aplica item especial a todos abaixo da média.

### Materiais de aula

- `POST /aulas/:aulaId/materiais` — ADMIN, PROFESSOR — Upload de material (multipart: titulo, arquivo — PDF/JPEG/PNG/Word/PPT).
- `GET /aulas/:aulaId/materiais` — ADMIN, PROFESSOR, ALUNO — Lista materiais de uma aula.
- `DELETE /materiais-aula/:id` — ADMIN, PROFESSOR — Remove um material.

### Solicitações de foto

- `GET /users/me/foto/solicitacoes` — ALUNO — Lista as próprias solicitações de troca de foto.
- `POST /users/me/foto/solicitacoes` — ALUNO — Cria solicitação de troca de foto (multipart, campo `foto`).
- `GET /admin/foto-solicitacoes` — ADMIN — Lista solicitações, filtro opcional por status.
- `POST /admin/foto-solicitacoes/aprovar-todas` — ADMIN — Aprova todas as pendentes.
- `POST /admin/foto-solicitacoes/:id/aprovar` — ADMIN — Aprova uma solicitação.
- `POST /admin/foto-solicitacoes/:id/rejeitar` — ADMIN — Rejeita uma solicitação.

### Pendências

- `GET /admin/pendencias` — ADMIN — Lista pendências, filtro opcional por status.
- `GET /admin/pendencias/relatorio` — ADMIN — Relatório de pendências (PDF/Excel).
- `GET /admin/pendencias/:alunoId` — ADMIN — Detalhamento das pendências de um aluno.
- `PUT /admin/pendencias/:alunoId/:materiaId/resolver` — ADMIN — Resolve uma pendência específica.
- `PUT /admin/pendencias/:alunoId/resolver-todas` — ADMIN — Resolve todas as pendências de um aluno.

### Relatórios (PDF/Excel)

Todas retornam arquivo binário via query `formato=pdf|xlsx`, exceto a de frequência detalhada (JSON).

- `GET /relatorios/diario/:materiaId` — ADMIN, PROFESSOR — Diário de classe da disciplina.
- `GET /relatorios/boletim/:alunoId` — ADMIN, ALUNO — Boletim do aluno (`semestreId` opcional).
- `GET /relatorios/turma/:turmaId` — ADMIN — Lista de alunos da turma.
- `GET /relatorios/frequencia-materia/:materiaId` — ADMIN, PROFESSOR — Frequência da disciplina.
- `GET /relatorios/frequencia-turma/:turmaId` — ADMIN — Frequência da turma.
- `GET /relatorios/agenda` — PROFESSOR, ALUNO — Agenda semanal do usuário logado.
- `GET /relatorios/usuarios` — ADMIN — Relatório de usuários ativos (filtro por role).
- `GET /relatorios/turma/:turmaId/frequencia` — ADMIN, PROFESSOR, ALUNO — Frequência detalhada em JSON (filtros: materiaId, alunoId, dataInicio, dataFim).
- `GET /relatorios/turma/:turmaId/frequencia-por-disciplina` — ADMIN, PROFESSOR — Frequência da turma agrupada por disciplina.

### Arquivos

- `GET /arquivos/:id` — público — Serve o conteúdo binário de um upload (foto, material, entrega, anexo) pelo id, identificando o Content-Type. Sem checagem de posse — acesso por UUID não-enumerável, equivalente ao antigo comportamento de arquivo estático.

### Logs de auditoria

- `GET /admin/logs` — ADMIN — Lista logs, filtro opcional por semestre.
- `DELETE /admin/logs/semestre/:semestreId` — ADMIN — Apaga os logs de um semestre.

### Dashboard administrativo

- `GET /admin/dashboard` — ADMIN — Contagens e estatísticas gerais (semestre atual, total de professores/alunos, disciplinas abertas, pendências, solicitações de foto pendentes).

## CI

`.github/workflows/ci.yml` roda em toda PR: lint, typecheck, testes unitários, migrations + testes e2e contra um Postgres de serviço, e build. `.github/workflows/deploy.yml` roda a mesma bateria em push pra `main`, antes de disparar o deploy no Render.
