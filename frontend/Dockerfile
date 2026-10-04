FROM docker.io/oven/bun:1.3.14-alpine AS build

WORKDIR /app

# Mirror the workspace layout so the root bun.lock applies as-is.
COPY package.json bun.lock bunfig.toml ./
COPY patches ./patches
COPY backend/package.json ./backend/package.json
COPY frontend/package.json ./frontend/package.json
RUN bun install --frozen-lockfile --filter macrotrackr-frontend

COPY frontend/tsconfig.json ./frontend/tsconfig.json
COPY frontend/tsconfig.app.json ./frontend/tsconfig.app.json
COPY frontend/tsconfig.node.json ./frontend/tsconfig.node.json
COPY frontend/tsconfig.base.json ./frontend/tsconfig.base.json
COPY frontend/vite.config.ts ./frontend/vite.config.ts
COPY frontend/index.html ./frontend/index.html
COPY frontend/public ./frontend/public
COPY frontend/src ./frontend/src
COPY frontend/scripts ./frontend/scripts
COPY frontend/nginx.conf ./frontend/nginx.conf
COPY shared ./shared

WORKDIR /app/frontend

ARG VITE_API_URL=
ARG VITE_APP_URL=http://localhost:5173
ARG VITE_PUBLIC_APP_NAME="MacroTrackr"
ARG VITE_SUPPORT_EMAIL=support@local.invalid
ARG VITE_AUTH_MODE=local
ARG VITE_BILLING_MODE=disabled
ARG VITE_ANALYTICS_MODE=disabled
ARG VITE_ENABLE_POSTHOG=false
ARG VITE_PUBLIC_POSTHOG_KEY=
ARG VITE_PUBLIC_POSTHOG_HOST=
ARG VITE_CLERK_PUBLISHABLE_KEY=

ENV VITE_API_URL=$VITE_API_URL
ENV VITE_APP_URL=$VITE_APP_URL
ENV VITE_PUBLIC_APP_NAME=$VITE_PUBLIC_APP_NAME
ENV VITE_SUPPORT_EMAIL=$VITE_SUPPORT_EMAIL
ENV VITE_AUTH_MODE=$VITE_AUTH_MODE
ENV VITE_BILLING_MODE=$VITE_BILLING_MODE
ENV VITE_ANALYTICS_MODE=$VITE_ANALYTICS_MODE
ENV VITE_ENABLE_POSTHOG=$VITE_ENABLE_POSTHOG
ENV VITE_PUBLIC_POSTHOG_KEY=$VITE_PUBLIC_POSTHOG_KEY
ENV VITE_PUBLIC_POSTHOG_HOST=$VITE_PUBLIC_POSTHOG_HOST
ENV VITE_CLERK_PUBLISHABLE_KEY=$VITE_CLERK_PUBLISHABLE_KEY

RUN bun run build

FROM docker.io/library/nginx:1.27-alpine

COPY --from=build /app/frontend/dist /usr/share/nginx/html
COPY --from=build /app/frontend/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
