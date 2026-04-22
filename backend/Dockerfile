FROM docker.io/oven/bun:1.2.13-alpine

WORKDIR /app

COPY backend/package.json ./package.json
COPY backend/tsconfig.json ./tsconfig.json
COPY backend/src ./src
COPY shared /shared

RUN bun install

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

CMD ["bun", "run", "src/index.ts"]
