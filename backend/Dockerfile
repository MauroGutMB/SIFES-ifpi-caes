# ---- build ----
FROM node:24-alpine AS build
WORKDIR /app

# prisma7.config.ts + prisma/ precisam estar presentes antes do `npm ci` porque o postinstall
# (`prisma generate`) já roda nesse passo e falha sem o schema.
COPY package*.json prisma7.config.ts ./
COPY prisma ./prisma
RUN npm ci

COPY . .
RUN npm run build

# ---- runtime ----
FROM node:24-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

# npm ci de novo aqui (não copiado do estágio de build) para que o `postinstall` (prisma generate)
# rode contra o schema já presente nesta imagem — gera o client do Prisma direto no runtime, sem
# precisar copiar `generated/` entre estágios.
COPY package*.json prisma7.config.ts ./
COPY prisma ./prisma
RUN npm ci

COPY --from=build /app/dist ./dist

EXPOSE 3000

# Aplica migrations pendentes antes de subir — mesmo comando usado no deploy do Render.
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/src/main"]
