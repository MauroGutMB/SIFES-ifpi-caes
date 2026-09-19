# SIFES — Frontend

SPA em **React 19 + Vite**, com **MUI** para componentes visuais, **React Router** para rotas, **TanStack Query** para dados/cache, **React Hook Form + Zod** para formulários e **Axios** para HTTP. O client da API (hooks + tipos) é gerado automaticamente a partir do Swagger do backend via **orval** — não se escreve chamada HTTP feita à mão.

Consulte o [README principal](../README.md) para a visão geral do projeto e o [README do backend](../backend/README.md) para a API que este frontend consome.

## Pré-requisitos

- Node.js 24+
- O **backend rodando localmente** em `http://localhost:3000` (veja o [README do backend](../backend/README.md)) — o frontend não sobe sozinho, ele depende da API pra tudo (login, dados, etc.)

## Rodando em desenvolvimento

```bash
npm install
npm run dev
```

Abre em `http://localhost:5173`. Não é preciso configurar nenhuma variável de ambiente para isso: o Vite já vem com um **proxy de desenvolvimento** (`vite.config.ts`) que encaminha toda chamada para os prefixos de rota da API (`/auth`, `/users`, `/alunos`, `/materias`, etc.) direto para `http://localhost:3000`, sem reescrever o path — isso é importante porque o cookie `httpOnly` do refresh token (`Path=/auth`) precisa bater com a mesma origem que o navegador enxerga.

Se um módulo novo do backend ganhar um prefixo de rota de topo (`@Controller('novo-prefixo')`), ele precisa ser adicionado em `API_ROUTE_PREFIXES` no `vite.config.ts`, senão as chamadas para ele não vão ser interceptadas pelo proxy.

## Gerando o client da API (codegen)

Sempre que a API do backend mudar (novo endpoint, DTO alterado), regenere o client:

```bash
npm run codegen
```

Isso lê o Swagger do backend em `http://localhost:3000/docs-json` (backend precisa estar rodando) e regrava tudo em `src/api/generated/` — hooks do TanStack Query por tag/módulo, tipos TypeScript e os schemas de validação Zod usados nos formulários. **Nunca edite nada dentro de `src/api/generated/` manualmente** — é sobrescrito no próximo `codegen`.

Para gerar contra uma API publicada em outro lugar (ex: staging), passe a URL do `docs-json` via variável de ambiente:

```bash
API_DOCS_URL=https://sua-api.onrender.com/docs-json npm run codegen
```

## Build de produção

```bash
npm run build
```

Roda `tsc -b` (typecheck) seguido de `vite build`, gerando os arquivos estáticos em `dist/`. Em produção (backend e frontend em domínios diferentes — ex: Cloudflare Pages + Render), é preciso apontar o cliente Axios para a URL pública da API via variável de ambiente de build:

```bash
VITE_API_URL=https://sua-api.onrender.com npm run build
```

Sem essa variável, o Axios usa uma `baseURL` vazia (relativa à própria origem do frontend) — funciona em dev por causa do proxy do Vite, mas quebra em produção se a API estiver em outro domínio.

## Testes

```bash
npm run test        # roda a suíte uma vez (Vitest)
npm run test:watch  # modo watch
```

Os testes ficam ao lado do código que testam (`*.test.ts`/`*.test.tsx`), usando `@testing-library/react` para componentes. `vitest.config.ts` já configura o ambiente `jsdom` e os matchers do `@testing-library/jest-dom`.

## Lint e typecheck

```bash
npm run lint           # oxlint
npx tsc --noEmit       # typecheck sem gerar arquivos
```

## Estrutura de pastas

```
src/
├── api/
│   ├── generated/       # gerado por orval — NUNCA editar à mão
│   ├── axios-instance.ts  # instância do Axios usada pelo client gerado (baseURL, interceptors)
│   └── ...
├── auth/                # AuthContext, guarda de rota por papel (RoleGate)
├── components/          # componentes reutilizáveis (FormDialog, ConfirmDialog, ToastProvider...)
├── layouts/             # layouts por papel (AdminLayout, sidebar)
├── pages/               # telas, organizadas por papel: admin/, professor/, aluno/
├── theme/               # tokens de cor/identidade visual (MUI theme)
└── routes/              # definição de rotas (router.tsx)
```

## Papéis e rotas

O sistema tem três papéis (`ADMIN`, `PROFESSOR`, `ALUNO`), cada um com seu próprio conjunto de telas sob `src/pages/<papel>/`. O `RoleGate` (em `src/auth/`) bloqueia acesso a rotas de um papel que o usuário logado não possui, redirecionando para a home do papel correto.
