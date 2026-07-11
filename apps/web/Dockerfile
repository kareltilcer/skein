# syntax=docker/dockerfile:1

# ---- Build stage: compile the Vite/React app into static assets ----
FROM node:22-alpine AS build
WORKDIR /app

# Copy the workspace manifests first so the install layer is cached until deps
# change. All workspace package.json files are needed for npm to resolve the
# workspace tree. We intentionally do NOT copy package-lock.json: it was
# generated on macOS and only records that platform's optional native binaries
# (e.g. @rollup/rollup-darwin-arm64). Under `npm ci`/with the lockfile present,
# npm's optional-dependency bug (npm/cli#4828) then skips the Linux rollup binary
# the container needs, and `vite build` fails. Installing without the lockfile
# lets npm resolve the correct binary for this platform.
COPY package.json ./
COPY apps/web/package.json ./apps/web/package.json
COPY apps/mobile/package.json ./apps/mobile/package.json
COPY packages/shared/package.json ./packages/shared/package.json

# Install only the web app and the shared package it depends on; this skips the
# heavy mobile/Expo toolchain. `--include=dev` forces devDependencies
# (typescript, vite, ...) to install even when the build host sets
# NODE_ENV=production (e.g. Coolify), since the build toolchain lives there.
RUN npm install --include=dev --workspace=apps/web --workspace=packages/shared --include-workspace-root

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
