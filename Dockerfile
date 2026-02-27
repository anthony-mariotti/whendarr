FROM node:24-alpine AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN corepack enable

COPY . /app

WORKDIR /app

FROM base AS prod-deps
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --prod --frozen-lockfile

FROM base AS build
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile
RUN pnpm run build

FROM base

ENV NODE_ENV="production"

COPY --from=prod-deps /app/node_modules /app/node_modules
COPY --from=build /app/build /app/build

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
