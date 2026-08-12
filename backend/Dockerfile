FROM docker.io/oven/bun:1.2.13-alpine

WORKDIR /app

COPY backend/package.json ./package.json
COPY backend/tsconfig.json ./tsconfig.json
COPY backend/src ./src
COPY shared /shared

RUN bun install

ENV NODE_ENV=production
ENV PORT=3000

# The SQLite file lives on a mounted volume; give the runtime user a home for it.
RUN mkdir -p /data && chown -R bun:bun /app /data

# Drop root. The `bun` user ships with the base image.
USER bun

EXPOSE 3000

CMD ["bun", "run", "src/index.ts"]
