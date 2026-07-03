FROM node:20-bookworm-slim

# Prisma needs OpenSSL on Debian slim images.
RUN apt-get update -y \
  && apt-get install -y openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

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
ENV APP_BUILD=81db107-startup-v2
EXPOSE 4000

RUN chmod +x scripts/railway-start.sh

CMD ["sh", "scripts/railway-start.sh"]
