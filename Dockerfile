FROM node:20-bookworm-slim

WORKDIR /app

# Install deps (full monorepo lockfile)
COPY package.json package-lock.json ./
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/
COPY packages/database/package.json ./packages/database/
COPY packages/shared/package.json ./packages/shared/

RUN npm ci --include=dev

COPY . .

RUN npm run db:generate \
  && npm run build --workspace=@tanjuriel/shared \
  && npm run build --workspace=@tanjuriel/database \
  && npm run build --workspace=@tanjuriel/api \
  && npm prune --omit=dev

ENV NODE_ENV=production
EXPOSE 4000

CMD ["sh", "-c", "npm run db:migrate:deploy && node apps/api/dist/main.js"]
