# Backend Dockerfile
# Usar Debian (slim) em vez de Alpine: canvas tem prebuilds para glibc (linux-x64-gnu),
# mas não para musl. Em Alpine faltam Python/build deps e o build nativo falha no Render.
FROM node:20-slim AS builder

WORKDIR /app

# Copiar arquivos de dependências
COPY package*.json ./
RUN npm ci

# Copiar código fonte
COPY . .

# Build da aplicação
RUN npm run build

# Produção
FROM node:20-slim AS production

WORKDIR /app

# Dependências de runtime do canvas (Cairo, Pango, etc.)
RUN apt-get update && apt-get install -y --no-install-recommends \
    libcairo2 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libjpeg62-turbo \
    libgif7 \
    librsvg2-2 \
    && rm -rf /var/lib/apt/lists/*

# Copiar apenas arquivos necessários
COPY package*.json ./
RUN npm ci --only=production

# Copiar build do stage anterior
COPY --from=builder /app/dist ./dist

# Expor porta
EXPOSE 3000

# Variável de ambiente para porta
ENV PORT=3000
ENV NODE_ENV=production

# Comando para iniciar
CMD ["node", "dist/main.js"]
