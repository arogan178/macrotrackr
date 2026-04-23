FROM docker.io/oven/bun:1.2.13-alpine AS build

WORKDIR /app

COPY frontend/package.json ./package.json
COPY frontend/tsconfig.json ./tsconfig.json
COPY frontend/tsconfig.app.json ./tsconfig.app.json
COPY frontend/tsconfig.node.json ./tsconfig.node.json
COPY frontend/tsconfig.base.json ./tsconfig.base.json
COPY frontend/vite.config.ts ./vite.config.ts
COPY frontend/tailwind.config.js ./tailwind.config.js
COPY frontend/index.html ./index.html
COPY frontend/public ./public
COPY frontend/src ./src
COPY frontend/scripts ./scripts
COPY frontend/nginx.conf ./nginx.conf
COPY shared /shared

ARG VITE_API_URL=
ARG VITE_APP_URL=http://localhost:5173
ARG VITE_PUBLIC_APP_NAME="Macro Tracker"
ARG VITE_SUPPORT_EMAIL=support@local.invalid
ARG VITE_AUTH_MODE=local
ARG VITE_BILLING_MODE=disabled
ARG VITE_ANALYTICS_MODE=disabled
ARG VITE_ENABLE_POSTHOG=false

ENV VITE_API_URL=$VITE_API_URL
ENV VITE_APP_URL=$VITE_APP_URL
ENV VITE_PUBLIC_APP_NAME=$VITE_PUBLIC_APP_NAME
ENV VITE_SUPPORT_EMAIL=$VITE_SUPPORT_EMAIL
ENV VITE_AUTH_MODE=$VITE_AUTH_MODE
ENV VITE_BILLING_MODE=$VITE_BILLING_MODE
ENV VITE_ANALYTICS_MODE=$VITE_ANALYTICS_MODE
ENV VITE_ENABLE_POSTHOG=$VITE_ENABLE_POSTHOG

RUN bun install
RUN bun run build

FROM docker.io/library/nginx:1.27-alpine

COPY --from=build /app/dist /usr/share/nginx/html
COPY --from=build /app/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
