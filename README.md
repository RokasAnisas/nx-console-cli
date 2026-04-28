# nx-dash

Terminal UI for browsing and running [NX](https://nx.dev) targets — like NX Console for the CLI.

```
$ npx nx-dash

nx-dash · 12 projects · via nx show · /path/to/workspace
tree › type to filter…
▾ web
  ▸ build
  • dev
  • lint
  • test
▸ api
▸ shared
↑↓ navigate · ←→ collapse/expand · Enter run · Tab tree/flat · Esc clear · Ctrl-C quit
```

## Install

```sh
# global
npm i -g nx-dash

# or one-off
npx nx-dash
```

## Usage

Run `nx-dash` (or `npx nx-dash`) anywhere inside an NX monorepo. It walks up to find `nx.json`, lists projects → targets → configurations, and on Enter unmounts the UI and runs `nx run <project>:<target>[:<config>]` in the same terminal — exit code, stdio, and signals all forwarded.

### Keys

| Key         | Action                                              |
| ----------- | --------------------------------------------------- |
| `↑` / `↓`   | Move selection                                      |
| `←` / `→`   | Collapse / expand the selected node                 |
| `Enter`     | Run selected target (or expand selected project)    |
| `Tab`       | Cycle modes: tree → flat → ★ favourites             |
| `Shift` + `→` | Toggle ★ favourite on the selected target/config  |
| type        | Filter — auto-switches to ranked flat mode          |
| `Esc`       | Clear filter, then quit                             |
| `Ctrl-C`    | Quit                                                |

### Favourites

Press `Shift+→` on any target or configuration to mark it as a favourite. Press `Tab` until the prompt shows `★ favs` to view them. Favourites are stored at `<workspace>/.nx-dash/favourites.json`; the directory ships its own `.gitignore` so nothing leaks into your commits.

### Remembered view

`nx-dash` also remembers the last view mode (tree / flat / ★ favs) per workspace and reopens directly in that mode. Stored alongside favourites at `<workspace>/.nx-dash/preferences.json`.

### Flags

```
nx-dash [--cwd <path>] [--dry-run] [--help] [--version]
```

- `--cwd <path>` — pretend the CLI was launched from `<path>`.
- `--dry-run` — print the resolved `nx run …` command instead of executing it.

## How it discovers projects

Primary path: `nx show projects --json` then `nx show project <name> --json` per project, using the workspace's local `node_modules/.bin/nx` when available. This picks up project.json projects, package.json `nx` fields, and inferred targets from NX plugins.

Fallback: when `nx` isn't installed or the call fails, it globs every `project.json` under the workspace and parses targets/configurations directly. A one-line warning is printed.

## Develop

```sh
yarn install
yarn build
node dist/cli.js --cwd src/__fixtures__/tiny-workspace --dry-run
```
