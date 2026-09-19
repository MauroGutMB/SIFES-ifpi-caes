# ---- build ----
FROM node:24-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
# src/api/generated/ já vem commitado no repositório (gerado pelo orval contra o Swagger do
# backend) — não é preciso rodar `npm run codegen` nem ter um backend no ar pra buildar a imagem.
ARG VITE_API_URL=
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

# ---- runtime ----
FROM nginx:alpine AS runtime
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
