FROM node:24-alpine AS builder

WORKDIR /app

RUN corepack enable pnpm && corepack install -g pnpm@latest-9

COPY .npmrc package.json pnpm-lock.yaml ./

RUN pnpm fetch

COPY . .

RUN pnpm install -r --offline

RUN pnpm build

FROM node:24-alpine

WORKDIR /app

RUN corepack enable pnpm && corepack install -g pnpm@latest-9

COPY --from=builder /app/build ./build
COPY --from=builder /app/package.json ./
COPY --from=builder /app/pnpm-lock.yaml ./

RUN pnpm install -r --prod --frozen-lockfile

EXPOSE 3000

CMD ["node", "build"]
