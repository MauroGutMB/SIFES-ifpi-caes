import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Prefixos de rota da API (um por @Controller() de topo no backend). O proxy encaminha
// esses caminhos direto pro backend, sem reescrever o path — assim o cookie httpOnly do
// refresh token (Path=/auth) continua batendo com a origem que o navegador enxerga.
// Se um novo módulo de backend ganhar um prefixo de topo novo, ele precisa entrar aqui
// (e no Nginx, quando a etapa de infra for feita).
const API_ROUTE_PREFIXES = [
  'auth',
  'users',
  'alunos',
  'professores',
  'turmas',
  'semestres',
  'materias',
  'atividades',
  'aulas',
  'itens-avaliacao',
  'materiais-aula',
  'admin',
  'relatorios',
  'arquivos',
]

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: Object.fromEntries(
      API_ROUTE_PREFIXES.map((prefix) => [
        `/${prefix}`,
        { target: 'http://localhost:3000', changeOrigin: true },
      ]),
    ),
  },
})
