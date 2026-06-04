FROM node:26-alpine3.23 AS builder

ARG BUILD_VERSION=0.0.0
ARG BUILD_TAG=
ARG BUILD_COMMIT=
ARG BUILD_DATE=

# SETUP PNPM FOR NODE 26
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN npm install -g corepack && \
    corepack enable && \
    corepack prepare pnpm --activate

WORKDIR /build

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/backend/package.json ./apps/backend/
COPY apps/frontend/package.json ./apps/frontend/
COPY packages/shared/package.json ./packages/shared/
COPY packages/translations/package.json ./packages/translations/
COPY packages/tsconfig/package.json ./packages/tsconfig/

RUN --mount=type=cache,id=pnpm-whendarr,target=/pnpm/store \
    pnpm install --frozen-lockfile --store-dir /pnpm/store

COPY . .

RUN --mount=type=cache,id=turbo-whendarr,target=/build/.turbo \
    pnpm turbo run build \
      --filter=@whendarr/shared \
      --filter=@whendarr/backend \
      --filter=@whendarr/frontend

FROM node:26-alpine3.23 AS runner

ARG BUILD_VERSION=0.0.0
ARG BUILD_TAG=
ARG BUILD_COMMIT=
ARG BUILD_DATE=
ARG BUST_CACHE

WORKDIR /srv/whendarr

RUN apk add --no-cache dumb-init && \
    addgroup -Sg 1001 whendarr && \
    adduser -SHu 1001 -G whendarr whendarr && \
    chown whendarr:whendarr /srv/whendarr

ENV NODE_ENV=production \
    APP_VERSION=${BUILD_VERSION} \
    APP_TAG=${BUILD_TAG} \
    APP_COMMIT=${BUILD_COMMIT} \
    APP_BUILD_DATE=${BUILD_DATE}

RUN echo "BUILD: ${APP_VERSION} (${APP_COMMIT}) - ${BUST_CACHE:-nocache}" && \
    printf '{"version":"%s","tag":"%s","commit":"%s","date":"%s"}\n' \
      "${APP_VERSION}" "${APP_TAG}" "${APP_COMMIT}" "${APP_BUILD_DATE}" > /srv/whendarr/.build.json && \
    chown whendarr:whendarr /srv/whendarr

COPY --from=builder --chown=whendarr:whendarr /build/apps/backend/dist ./
COPY --from=builder --chown=whendarr:whendarr /build/apps/frontend/dist ./frontend

RUN find . -name "*.map" -type f -delete

USER whendarr

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:3000/health || exit 1

LABEL org.opencontainers.image.source="https://github.com/anthony-mariotti/whendarr" \
      org.opencontainers.image.url="https://github.com/anthony-mariotti/whendarr" \
      org.opencontainers.image.title="Whendarr" \
      org.opencontainers.image.description="Lightweight web calendar for Sonarr and Radarr that aggregates upcoming tv and movie releases" \
      org.opencontainers.image.vendor="anthony-mariotti" \
      org.opencontainers.image.licenses="AGPL-3.0" \
      org.opencontainers.image.version="${BUILD_VERSION}" \
      org.opencontainers.image.revision="${BUILD_COMMIT}" \
      org.opencontainers.image.created="${BUILD_DATE}"

CMD ["dumb-init", "node", "index.js"]
