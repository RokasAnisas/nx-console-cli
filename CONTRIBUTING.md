# Contributing to nx-dash

Thanks for taking the time to look at the code. Issues and pull requests are welcome.

## Prerequisites

- **Node.js** ≥ 18 (Node 22 LTS or newer is recommended for development)
- **Yarn 4** — auto-installed via Corepack the first time you run `yarn`

## Setup

```sh
git clone https://github.com/RokasAnisas/nx-console-cli.git
cd nx-console-cli
yarn install
```

## Scripts

| Script           | What it does                                                          |
| ---------------- | --------------------------------------------------------------------- |
| `yarn build`     | Bundle the CLI to `dist/cli.js` via [tsup](https://tsup.egoist.dev)   |
| `yarn dev`       | `tsup --watch` for fast iteration                                     |
| `yarn typecheck` | `tsc --noEmit`                                                        |
| `yarn test`      | Smoke test the favourites / preferences / projects cache stores       |
| `yarn start`     | Run the bundled CLI (`node dist/cli.js`)                              |

## Manual testing

The repo ships with a tiny fixture workspace so you can drive the UI without a real NX project:

```sh
yarn build
node dist/cli.js --cwd src/__fixtures__/tiny-workspace --dry-run
```

Or point it at any real NX monorepo on your machine:

```sh
node dist/cli.js --cwd ~/path/to/some-nx-monorepo
```

## Project layout

```
src/
├── cli.tsx                    # Entry point: parses args, mounts Bootstrap
├── ui/
│   ├── App.tsx                # Main interactive view
│   ├── Bootstrap.tsx          # Loads cache + projects, transitions to App
│   ├── LoadingScreen.tsx      # First-launch loading state
│   ├── Logo.tsx               # ANSI Shadow gradient logo
│   ├── Shortcuts.tsx          # Keyboard shortcut bar
│   ├── SearchInput.tsx        # Mode label + filter prompt
│   ├── TreeView.tsx           # Tree-mode renderer
│   ├── FlatList.tsx           # Flat / search-mode renderer
│   ├── useDashState.ts        # Mode + filter + favourites state hook
│   └── useSpinnerFrame.ts     # Shared braille spinner hook
├── workspace/
│   ├── findRoot.ts            # Walks up for nx.json
│   └── loadProjects.ts        # `nx show` with project.json glob fallback
├── runner/
│   └── runTarget.ts           # Spawns nx with stdio: 'inherit'
├── favourites/store.ts        # .nx-dash/favourites.json
├── preferences/store.ts       # .nx-dash/preferences.json
├── cache/projectsCache.ts     # .nx-dash/projects-cache.json
├── storage/workspaceDir.ts    # Self-gitignoring .nx-dash/ helper
├── stubs/                     # Build-time aliases (e.g. react-devtools)
├── types.ts
├── __fixtures__/              # Tiny fake NX workspace for manual testing
└── __tests__/                 # Smoke tests
```

## Architecture notes

- **Stack:** TypeScript ESM, [Ink](https://github.com/vadimdemedes/ink) v5 + React 18 for the TUI, [fzf](https://www.npmjs.com/package/fzf) for ranked filtering, [tinyglobby](https://www.npmjs.com/package/tinyglobby) for the project.json fallback. Bundled to a single file by [tsup](https://tsup.egoist.dev).
- **Alt-screen handoff:** the TUI runs in the terminal's alternate screen buffer (`\x1B[?1049h`); on selection it exits the alt buffer before spawning `nx run …` with `stdio: 'inherit'` so the child takes over the original terminal.
- **Stale-while-revalidate cache:** `Bootstrap` reads `.nx-dash/projects-cache.json` synchronously and renders the App immediately; a fresh `nx show` scan always runs in the background and silently swaps in the new result.

## CI / release

- [`.github/workflows/ci.yml`](.github/workflows/ci.yml) runs `typecheck → test → build` on every PR and push to `main`.
- [`.github/workflows/publish.yml`](.github/workflows/publish.yml) publishes to npm when a **GitHub Release** is published, via [OIDC trusted publishing](https://docs.npmjs.com/trusted-publishers) — no long-lived `NPM_TOKEN` required.

To release a new version:

1. Bump the version locally and push the tag:
   ```sh
   yarn version patch          # or: minor / major
   git push origin main --follow-tags
   ```
2. On GitHub, **Create a new Release** from the pushed tag (`Releases → Draft a new release`). The tag name may be either `0.1.2` or `v0.1.2`.
3. Publishing the release triggers the workflow, which verifies the tag matches `package.json#version` and runs `npm publish --access public` (with provenance attestations generated automatically).

You can also trigger the workflow manually via *Actions → Publish → Run workflow*.

## Filing issues / PRs

- Search [existing issues](https://github.com/RokasAnisas/nx-console-cli/issues) before opening a new one.
- For features, a short description of the use case in an issue first is appreciated — saves implementing something that ends up not fitting.
- PRs: please make sure `yarn typecheck`, `yarn test`, and `yarn build` are clean.
