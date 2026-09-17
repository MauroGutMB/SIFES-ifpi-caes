import { defineConfig } from 'orval';

const target = process.env.API_DOCS_URL ?? 'http://localhost:3000/docs-json';

export default defineConfig({
  sifes: {
    input: { target },
    output: {
      mode: 'tags-split',
      target: 'src/api/generated/endpoints.ts',
      schemas: 'src/api/generated/models',
      client: 'react-query',
      httpClient: 'axios',
      clean: true,
      prettier: true,
      override: {
        mutator: {
          path: 'src/api/axios-instance.ts',
          name: 'customInstance',
        },
      },
    },
  },
  sifesZod: {
    input: { target },
    output: {
      mode: 'tags-split',
      client: 'zod',
      target: 'src/api/generated/zod',
      clean: true,
      prettier: true,
    },
  },
});
