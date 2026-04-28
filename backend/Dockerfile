FROM docker.io/oven/bun:1.2.13-alpine

WORKDIR /app

COPY backend/package.json ./package.json
COPY backend/tsconfig.json ./tsconfig.json
COPY backend/src ./src
COPY shared /shared

RUN bun install

# Install dotenvx for environment variable handling
RUN bun add -g dotenvx

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

# Use start script which handles .env files via dotenvx
CMD ["bun", "run", "start"]
