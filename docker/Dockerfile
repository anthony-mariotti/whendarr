FROM node:24-alpine3.23 AS builder

ARG BUILD_VERSION=0.0.0
ARG BUILD_TAG=
ARG BUILD_COMMIT=
ARG BUILD_DATE=
ARG BUILD_PNPM_VERSION=10.33.0

RUN corepack enable && corepack prepare pnpm@${BUILD_PNPM_VERSION} --activate

WORKDIR /build
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/backend/package.json ./apps/backend/
COPY apps/frontend/package.json ./apps/frontend/
COPY packages/shared/package.json ./packages/shared/
COPY packages/translations/package.json ./packages/translations/
COPY packages/tsconfig/package.json ./packages/tsconfig/

RUN pnpm install --frozen-lockfile

COPY . .

RUN pnpm turbo run build --filter=@whendarr/shared --filter=@whendarr/backend --filter=@whendarr/frontend

FROM node:24-alpine3.23 AS runner

ARG BUILD_VERSION=0.0.0
ARG BUILD_TAG=
ARG BUILD_COMMIT=
ARG BUILD_DATE=
ARG BUILD_PNPM_VERSION=10.33.0

RUN corepack enable && corepack prepare pnpm@${BUILD_PNPM_VERSION} --activate
WORKDIR /srv/whendarr

ARG BUST_CACHE

RUN echo "BUILD: ${BUILD_VERSION} (${BUILD_COMMIT}) - ${BUST_CACHE:-nocache}" \
  && printf '{"version":"%s","tag":"%s","commit":"%s","buildDate":"%s"}\n' \
    "${APP_VERSION}" "${APP_TAG}" "${APP_COMMIT}" "${APP_BUILD_DATE}" > /srv/whendarr/.build.json

ENV NODE_ENV=production
ENV APP_VERSION=${BUILD_VERSION}
ENV APP_TAG=${BUILD_TAG}
ENV APP_COMMIT=${BUILD_COMMIT}
ENV APP_BUILD_DATE=${BUILD_DATE}

COPY --from=builder /build/package.json ./
COPY --from=builder /build/pnpm-workspace.yaml ./
COPY --from=builder /build/pnpm-lock.yaml ./

COPY --from=builder /build/apps/backend/package.json ./apps/backend/
COPY --from=builder /build/apps/backend/dist ./apps/backend/dist

COPY --from=builder /build/apps/frontend/dist ./apps/frontend/dist

COPY --from=builder /build/packages/shared/package.json ./packages/shared/
COPY --from=builder /build/packages/shared/dist ./packages/shared/dist

RUN pnpm install --prod --frozen-lockfile --ignore-scripts

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 whendarr

RUN chown -R whendarr:nodejs /srv/whendarr

USER whendarr

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:3000/health || exit 1

LABEL org.opencontainers.image.source="https://github.com/anthony-mariotti/whendarr"
LABEL org.opencontainers.image.url="https://github.com/anthony-mariotti/whendarr"
LABEL org.opencontainers.image.title="Whendarr"
LABEL org.opencontainers.image.description="Lightweight web calendar for Sonarr and Radarr that aggregates upcoming tv and movie releases"
LABEL org.opencontainers.image.vendor="anthony-mariotti"
LABEL org.opencontainers.image.licenses="AGPL-3.0"
LABEL org.opencontainers.image.version="${BUILD_VERSION}"
LABEL org.opencontainers.image.revision="${BUILD_COMMIT}"
LABEL org.opencontainers.image.created="${BUILD_DATE}"

CMD ["node", "apps/backend/dist/index.js"]
