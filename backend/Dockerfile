FROM docker.io/oven/bun:1.3.14-alpine

WORKDIR /app

# Mirror the workspace layout so the root bun.lock applies as-is.
COPY package.json bun.lock bunfig.toml ./
COPY patches ./patches
COPY backend/package.json ./backend/package.json
COPY frontend/package.json ./frontend/package.json
RUN bun install --frozen-lockfile --production --filter macrotrackr-backend

COPY backend/tsconfig.json ./backend/tsconfig.json
COPY backend/src ./backend/src
COPY shared ./shared

WORKDIR /app/backend

ENV NODE_ENV=production
ENV PORT=3000

# The SQLite file lives on a mounted volume; give the runtime user a home for it.
RUN mkdir -p /data && chown -R bun:bun /app /data

# Drop root. The `bun` user ships with the base image.
USER bun

EXPOSE 3000

CMD ["bun", "run", "src/index.ts"]
