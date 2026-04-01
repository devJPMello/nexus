# Monorepo Nexus: NestJS (backend) + Vite/React (frontend) — otimizado para Railway
# Requer contexto de build na raiz do repositório (docker build -f Dockerfile .)

FROM node:20-slim AS builder

WORKDIR /app

COPY backend/package.json backend/package-lock.json ./backend/
COPY frontend/package.json frontend/package-lock.json ./frontend/

RUN cd backend && npm ci
RUN cd frontend && npm ci

COPY backend ./backend
COPY frontend ./frontend

RUN cd backend && npm run build
RUN cd frontend && npm run build

# --- Runtime (canvas precisa de libs glibc no Debian slim) ---
FROM node:20-slim AS production

WORKDIR /app/backend

RUN apt-get update && apt-get install -y --no-install-recommends \
    libcairo2 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libjpeg62-turbo \
    libgif7 \
    librsvg2-2 \
    && rm -rf /var/lib/apt/lists/*

COPY backend/package.json backend/package-lock.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/backend/dist ./dist
COPY --from=builder /app/frontend/dist ../frontend/dist

ENV NODE_ENV=production

EXPOSE 3000

CMD ["node", "dist/main.js"]
