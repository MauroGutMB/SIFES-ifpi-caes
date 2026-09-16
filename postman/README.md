# Collection do Postman — SIFES

Dois arquivos:

- `SIFES.postman_collection.json` — todos os endpoints da API, organizados por módulo.
- `SIFES.postman_environment.json` — variáveis de ambiente (`baseUrl`, tokens, IDs).

## Como usar

1. No Postman: **Import** os dois arquivos (`File > Import`).
2. Selecione o environment **"SIFES - Dev"** no seletor do canto superior direito.
3. Confirme que `baseUrl` aponta para onde a API está rodando (padrão: `http://localhost:3000`).
4. Rode as requisições **na ordem das pastas**:
   1. **Auth → Login Admin** — salva `adminToken` automaticamente.
   2. **Semestres → Criar Semestre** — salva `semestreId`.
   3. **Turmas → Criar Turma** — usa `semestreId`, salva `turmaId`.
   4. **Professores → Criar Professor** + **Login Professor** — salva `professorId`/`professorToken`.
   5. **Alunos → Criar Aluno** + **Vincular Aluno a Turma** + **Login Aluno** — salva
      `alunoId`/`alunoToken`.
   6. **Materias → Criar Materia** — usa `turmaId`/`professorId`, salva `materiaId`.
   7. Daí em diante (Aulas, Plano de Disciplina, Materiais, Atividades, Foto de Perfil,
      Solicitações, Dashboard, Relatórios) já usam as variáveis encadeadas.

As requisições de criação (`Criar Semestre`, `Criar Turma`, `Criar Professor`, `Criar Aluno`,
`Criar Materia`, `Criar Item de Avaliacao`, `Criar Atividade`, `Solicitar Troca de Foto`) têm um
script de teste que captura o `id` da resposta e já grava na variável de ambiente certa — não
precisa copiar/colar manualmente.

Requisições de upload (foto, material de aula, entrega de atividade) usam `multipart/form-data`
com um campo de arquivo vazio — selecione o arquivo manualmente no Postman antes de enviar.

`DELETE /users/:userId/foto` precisa do id do **User** (não do Aluno/Professor) — pegue esse id na
resposta de `GET /users/me` ou de qualquer endpoint que inclua `userId`.
