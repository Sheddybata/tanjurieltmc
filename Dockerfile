FROM node:20-bookworm-slim

WORKDIR /app

# Requires full repo build context (Railway Root Directory must be empty).
COPY . .

RUN npm ci --include=dev \
  && npm run db:generate \
  && npm run build --workspace=@tanjuriel/shared \
  && npm run build --workspace=@tanjuriel/database \
  && npm run build --workspace=@tanjuriel/api \
  && npm prune --omit=dev

ENV NODE_ENV=production
EXPOSE 4000

CMD ["sh", "-c", "npm run db:migrate:deploy && node apps/api/dist/main.js"]
