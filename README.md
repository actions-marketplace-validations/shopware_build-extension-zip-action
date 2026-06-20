# Build Extension Zip Action

GitHub Action to zip a Shopware extension using [`shopware-cli`](https://github.com/shopware/shopware-cli). It runs `shopware-cli extension zip` for a given path and wires up the GitHub Actions cache so that Composer dependencies and built assets are cached across runs.

## How caching works

`shopware-cli` talks to the GitHub Actions cache service **directly** (via [`go-actions-cache`](https://github.com/tonistiigi/go-actions-cache)) to restore and store the asset cache. To do that it needs the cache service credentials (`ACTIONS_RESULTS_URL` / `ACTIONS_CACHE_URL` / `ACTIONS_RUNTIME_TOKEN`), which GitHub exposes to JavaScript actions but not to plain shell `run:` steps.

This action is a thin Node wrapper that runs `shopware-cli extension zip` as a child process. Because the child inherits the action's environment, the CLI sees those credentials automatically and handles both cache restore and save itself — there is no separate restore/save step.

To enable asset caching, set this in your extension's `.shopware-extension.yaml`:

```yaml
build:
  zip:
    assets:
      enabled: true
      enable_asset_caching: true
```

## Requirements

- `shopware-cli` available on the runner. Recommended: install via the official setup action:
  - `- uses: shopware/shopware-cli-action@v3`

## Inputs

| Input | Description | Default |
| --- | --- | --- |
| `path` | Path to the extension. | `.` |
| `branch` | Branch / tag to check out via Git before zipping. | `""` |
| `output-directory` | Output directory for the zip file. | `""` |
| `filename` | Name of the zip file. If empty, it is generated from the extension name and tag. | `""` |
| `git-commit` | Commit hash / tag to use. | `""` |
| `disable-git` | Use the source folder as-is, without a Git checkout. | `false` |
| `release` | Release mode (remove app secrets). | `false` |
| `use-git-tag-as-version` | Use the detected git tag as the extension version. | `false` |
| `overwrite-version` | Change the extension version to this value. | `""` |
| `overwrite-app-backend-url` | Change all URLs in `manifest.xml` to this URL. | `""` |
| `overwrite-app-backend-secret` | Change the app secret to this value. | `""` |

## Outputs

| Output | Description |
| --- | --- |
| `zip` | Path to the generated zip file. |

## Usage

```yaml
name: Build Extension Zip
on: [push, pull_request]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v7
        with:
          fetch-depth: 0 # needed for git-based versioning

      # Ensure shopware-cli is installed
      - uses: shopware/shopware-cli-action@v3

      # Zip the extension
      - name: Build extension zip
        id: zip
        uses: shopware/build-extension-zip-action@v1
        with:
          path: .
          output-directory: .build

      - uses: actions/upload-artifact@v7
        with:
          name: extension
          path: ${{ steps.zip.outputs.zip }}
```

### Release build

```yaml
      - uses: shopware/build-extension-zip-action@v1
        with:
          release: true
          use-git-tag-as-version: true
          output-directory: .build
```

## Development

```bash
npm install
npm run typecheck
npm run build    # bundles src/main.ts into dist/index.js via @vercel/ncc
```

The bundled `dist/index.js` is committed so the action can run without an install step.

## License

MIT — see [LICENSE.md](LICENSE.md).
