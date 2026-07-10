# syntax=docker/dockerfile:1

# ---- Build stage: compile the Vite/React app into static assets ----
FROM node:22-alpine AS build
WORKDIR /app

# Copy the workspace manifests first so `npm ci` is cached until deps change.
# All workspace package.json files are needed for npm to resolve the workspace tree.
COPY package.json package-lock.json ./
COPY apps/web/package.json ./apps/web/package.json
COPY apps/mobile/package.json ./apps/mobile/package.json
COPY packages/shared/package.json ./packages/shared/package.json

# Install only the web app and the shared package it depends on. This skips the
# heavy mobile/Expo toolchain. If your npm version does not support scoped `ci`,
# replace the workspace flags below with a plain `RUN npm ci --include=dev`.
# `--include=dev` forces devDependencies (typescript, vite, ...) to install even
# when the build host sets NODE_ENV=production (e.g. Coolify), since the build
# toolchain lives in devDependencies.
RUN npm ci --include=dev --workspace=apps/web --workspace=packages/shared --include-workspace-root

# Copy the sources required to build the web app.
COPY tsconfig.json ./tsconfig.json
COPY packages/shared ./packages/shared
COPY apps/web ./apps/web

# Produce the static build in apps/web/dist.
RUN npm run build --workspace=apps/web

# ---- Runtime stage: serve the static assets with nginx ----
FROM nginx:1.27-alpine AS runtime
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/apps/web/dist /usr/share/nginx/html
EXPOSE 80
