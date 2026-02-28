FROM node:24-alpine AS base

ARG APP_VERSION=0.0.0
ARG APP_TAG=
ARG APP_COMMIT=
ARG APP_BUILD_DATE=

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN corepack enable && corepack prepare pnpm@9.12.3 --activate

COPY . /app

WORKDIR /app

FROM base AS prod-deps

ARG APP_VERSION=0.0.0
ARG APP_TAG=
ARG APP_COMMIT=
ARG APP_BUILD_DATE=

RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --prod --frozen-lockfile

FROM base AS build

ARG APP_VERSION=0.0.0
ARG APP_TAG=
ARG APP_COMMIT=
ARG APP_BUILD_DATE=

RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile
RUN pnpm run build

FROM base

ARG APP_VERSION=0.0.0
ARG APP_TAG=
ARG APP_COMMIT=
ARG APP_BUILD_DATE=

ENV NODE_ENV="production"

COPY --from=prod-deps /app/node_modules /app/node_modules
COPY --from=build /app/build /app/build

RUN echo "Build: ${APP_VERSION} (${APP_COMMIT}) - ${CACHE_BUST:-nocache}" && \
    printf '{"version":"%s","tag":"%s","commit":"%s","buildDate":"%s"}\n' \
      "${APP_VERSION}" "${APP_TAG}" "${APP_COMMIT}" "${APP_BUILD_DATE}" > /app/build/.build-info.json

EXPOSE 3000

CMD [ "node", "build" ]



# FROM node:24-alpine AS builder

# WORKDIR /app

# RUN corepack enable pnpm && corepack install -g pnpm@latest-9

# COPY .npmrc package.json pnpm-lock.yaml ./

# RUN pnpm fetch

# COPY . .

# RUN pnpm install -r --offline

# RUN pnpm build

# FROM node:24-alpine

# WORKDIR /app

# RUN corepack enable pnpm && corepack install -g pnpm@latest-9

# COPY --from=builder /app/build ./build
# COPY --from=builder /app/package.json ./
# COPY --from=builder /app/pnpm-lock.yaml ./

# RUN pnpm install -r --prod --frozen-lockfile

# EXPOSE 3000

# CMD ["node", "build"]
