<h1 align="center">
  Whendarr
</h1>

<p align="center">
  Public-friendly calendar for private media libraries.
</p>

<p align="center">
  <a title="Container" href="https://ghcr.io/anthony-mariotti/whendarr" target="_blank" rel="noreferrer"><img src="https://img.shields.io/badge/ghcr.io-whendarr-blue?style=flat-square&logo=docker&logoColor=white" alt="Docker" /></a>
  <a title="Documentation" href="https://docs.whendarr.com" target="_blank" rel="noreferrer"><img src="https://img.shields.io/badge/docs-whendarr.com-a86add?style=flat-square" alt="Documentation" /></a>
  <a title="License" href="https://github.com/anthony-mariotti/whendarr/blob/main/LICENSE.md" target="_blank" rel="noreferrer"><img src="https://img.shields.io/github/license/anthony-mariotti/whendarr?style=flat-square" alt="License" /></a>
  <a title="Crowdin" href="https://crowdin.com/project/whendarr" target="_blank" rel="noreferrer"><img src="https://badges.crowdin.net/whendarr/localized.svg" alt="Crowdin"></a>
</p>
<p align="center">
  <a title="CI Workflow" href="https://github.com/anthony-mariotti/whendarr/actions/workflows/ci.yml" target="_blank" rel="noreferrer"><img src="https://img.shields.io/github/actions/workflow/status/anthony-mariotti/whendarr/ci.yml?branch=main&style=flat-square&label=CI&logo=github" alt="CI Status" /></a>
  <a title="CodeQL Workflow" href="https://github.com/anthony-mariotti/whendarr/actions/workflows/github-code-scanning/codeql" target="_blank" rel="noreferrer"><img alt="GitHub Actions Workflow Status" src="https://img.shields.io/github/actions/workflow/status/anthony-mariotti/whendarr/github-code-scanning%2Fcodeql?style=flat-square&label=CodeQL&logo=github"/></a>
  <a title="Release" href="https://github.com/anthony-mariotti/whendarr/releases"><img src="https://img.shields.io/badge/Release-Alpha-red?style=flat-square" alt="Latest Version" /></a>
  <!-- https://img.shields.io/github/v/release/anthony-mariotti/whendarr?style=flat-square&color=a86add&cacheSeconds=3600&label=latest -->
</p>

Whendarr is an open source, self hosted calendar that aggregates release data from *arr services into a simple monthly interface.

## Docker Tags

| Tag      | Description                                         |
| -------- | --------------------------------------------------- |
| `latest` | Stable Release (requires external redis/valkey)     |
| `next`   | Latest Pre-Release (requires external redis/valkey) |

<!--  -->

```bash
# Stable
docker pull ghcr.io/anthony-mariotti/whendarr:latest

# Beeding Edge
docker pull ghcr.io/anthony-mariotti/whendarr:next
```

## Logging

**Docker** - Checking the service running in its container

```bash
docker logs whendarr
docker logs whendarr-redis # or valkey
```

## Contributing

Want to help contribute, but not sure how to code or just want to participate in the coding process?

- Submit a bug report
- Propose new features
- Help translate the project on [Crowdin](https://crowdin.com/project/whendarr)

Read contributing guide: [https://docs.whendarr.com/contribute](https://docs.whendarr.com/contribute)

## Development Setup

More detailed setup process can be found at [https://docs.whendarr.com/contribute/develop/setup](https://docs.whendarr.com/contribute/develop/setup)

### Tooling

- [NodeJS](https://nodejs.org/en/download)
- [VSCode](https://code.visualstudio.com/download)
- [Docker](https://www.docker.com/products/docker-desktop/)
- [PNPM](https://pnpm.io/installation)

## Current Roadmap

The roadmap is available on [https://docs.whendarr.com/roadmap](https://docs.whendarr.com/roadmap)

Check the [issues](https://github.com/anthony-mariotti/whendarr/issues) for things to work on.
