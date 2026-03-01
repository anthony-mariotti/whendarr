<h1 align="center">
  Whendarr
</h1>

<p align="center">
  Public-friendly calendar for private media libraries.
</p>

<p align="center">
  <a href="https://github.com/anthony-mariotti/whendarr/actions/workflows/ci.yml"><img src="https://img.shields.io/github/actions/workflow/status/anthony-mariotti/whendarr/ci.yml?branch=main&style=flat-square&label=CI" alt="CI Status" /></a>
  <a href="https://github.com/anthony-mariotti/whendarr/releases"><img src="https://img.shields.io/github/v/release/anthony-mariotti/whendarr?style=flat-square&color=a86add" alt="Latest Release" /></a>
  <a href="https://ghcr.io/anthony-mariotti/whendarr"><img src="https://img.shields.io/badge/ghcr.io-whendarr-blue?style=flat-square&logo=docker&logoColor=white" alt="Docker" /></a>
  <a href="https://github.com/anthony-mariotti/whendarr/blob/main/LICENSE.md"><img src="https://img.shields.io/github/license/anthony-mariotti/whendarr?style=flat-square" alt="License" /></a>
  <a href="https://docs.whendarr.com"><img src="https://img.shields.io/badge/docs-whendarr.com-a86add?style=flat-square" alt="Documentation" /></a>
</p>

A lightweight web calendar for Sonarr and Radarr that aggregates upcoming TV and movie releases into a fast, shareable monthly view with caching and rate limiting.

### Docker Tags

| Tag      | Description                                         |
| -------- | --------------------------------------------------- |
| `latest` | Stable Release (requires external redis/valkey)     |
| `next`   | Latest Pre-Release (requires external redis/valkey) |

```bash
# Stable (requires externall services)
docker pull ghcr.io/anthony-mariotti/whendarr:latest

# Beeding Edge
docker pull ghcr.io/anthony-mariotti/whendarr:next
```

### Logging

**Docker** - Checking the service running in its container

```bash
docker logs whendarr
docker logs whendarr-redis # or valkey
```

### Development Setup

```bash
pnpm install

# Copy and Configure Environment
cp .env.example .env

# Start Development Server
pnpm dev
```

SvelteKit typically starts at `localhost:5173`

## Contributing

Contributions are welcome! Please:

1. Fork the repo
2. Create a feature branch (`git checkout -b feature/thing`)
3. Make desiered changes
4. Run tests and linting (`pnpm test && pnpm lint`)
5. Open a PR

Check the [issues](https://github.com/anthony-mariotti/whendarr/issues) for things to work on.
