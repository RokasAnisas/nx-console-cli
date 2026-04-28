# nx-dash

[![npm version](https://img.shields.io/npm/v/nx-dash.svg?label=npm&color=cb3837)](https://www.npmjs.com/package/nx-dash)
[![npm downloads](https://img.shields.io/npm/dm/nx-dash.svg?color=cb3837)](https://www.npmjs.com/package/nx-dash)
[![license](https://img.shields.io/npm/l/nx-dash.svg?color=blue)](LICENSE)

> A terminal UI for browsing and running [NX](https://nx.dev) targets — like NX Console, for the CLI.

```
███╗   ██╗██╗  ██╗      ██████╗  █████╗ ███████╗██╗  ██╗
████╗  ██║╚██╗██╔╝      ██╔══██╗██╔══██╗██╔════╝██║  ██║
██╔██╗ ██║ ╚███╔╝ █████╗██║  ██║███████║███████╗███████║
██║╚██╗██║ ██╔██╗ ╚════╝██║  ██║██╔══██║╚════██║██╔══██║
██║ ╚████║██╔╝ ██╗      ██████╔╝██║  ██║███████║██║  ██║
╚═╝  ╚═══╝╚═╝  ╚═╝      ╚═════╝ ╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝
                                    terminal nx console

↑↓ navigate  ←→ expand  Enter run  Tab tree/flat/★  ⇧→ favourite  type filter  Esc clear  ^C quit

26 projects · via nx show · ~/projects/my-monorepo
tree › █ type to filter…

▾ apps
  ▾ calnote-landing
    ▸ build ★
    • dev
    • lint
    • test
  ▸ calnote-web-app
▸ libs
```

## Why

[NX Console](https://nx.dev/getting-started/editor-setup) is wonderful inside VS Code and JetBrains, but if you live in the terminal you're stuck with `nx run …`, shell completions, and remembering every target name. **nx-dash** gives you the same project tree, fuzzy filter, and one-keystroke run — right in the shell, no editor required.

## Features

- 🌳 **Tree** of projects → targets → configurations, just like NX Console.
- 🔍 **Fuzzy filter** — start typing; matches are ranked and highlighted.
- ⭐ **Favourites** — star the targets you run all day; persists per workspace.
- ⚡ **Instant restart** — first launch caches the project list; subsequent launches render in milliseconds while a fresh scan runs in the background.
- 🎯 **Clean handoff** — the TUI fully vanishes on `Enter`; the selected target runs in the original terminal with full stdio and signal forwarding.
- 🧠 **Remembers** the last view mode (tree / flat / favourites) per workspace.
- 🪶 **Zero config** — walks up to find `nx.json`, prefers the local `nx` binary, falls back to scanning `project.json` files.

## Quick start

```sh
# Run without installing
npx nx-dash

# Or install globally
npm install -g nx-dash
```

That's it — run `nx-dash` anywhere inside an NX monorepo. Navigate with arrows, type to filter, hit `Enter` to run.

## Keybindings

| Key             | Action                                        |
| --------------- | --------------------------------------------- |
| `↑` `↓`         | Move selection                                |
| `Shift` + `↑/↓` | Skip 5 items at a time                        |
| `←` `→`         | Collapse / expand                             |
| `Enter`         | Run selected target (or expand a project)     |
| `Tab`           | Cycle view: tree → flat → ★ favourites        |
| `Shift` + `→`   | Toggle ★ favourite on the selected target     |
| *type*          | Fuzzy filter (auto-switches to ranked list)   |
| `Esc`           | Clear filter, then quit                       |
| `Ctrl` + `C`    | Quit                                          |

## Flags

| Flag                | Description                                                  |
| ------------------- | ------------------------------------------------------------ |
| `--cwd <path>`      | Pretend the CLI was launched from `<path>`                   |
| `--dry-run`         | Print the resolved `nx run …` command instead of executing  |
| `-h`, `--help`      | Show help                                                    |
| `-v`, `--version`   | Print version                                                |

## How it works

`nx-dash` walks up from the current directory looking for `nx.json`, then:

1. Runs `nx show projects --json` (using the workspace's local `node_modules/.bin/nx` when present) followed by `nx show project <name> --json` per project. This picks up **inferred targets** from plugins like `@nx/vite` or `@nx/jest`.
2. Falls back to globbing `project.json` files if `nx` isn't installed or the daemon doesn't respond.

On every successful scan the result is cached. The next launch reads the cache synchronously and renders instantly, while a fresh scan runs in the background and silently swaps in the new data when ready (a small `⠋ refreshing…` indicator shows while it's in flight).

## Workspace state

All per-workspace state lives under a `.nx-dash/` directory at the workspace root. The directory ships its own `.gitignore` so nothing leaks into your commits:

```
<workspace>/.nx-dash/
├── .gitignore           # contains: *
├── favourites.json      # your starred targets
├── preferences.json     # last-used view mode
└── projects-cache.json  # cached project list
```

## Requirements

- Node.js ≥ 18
- A workspace containing an `nx.json` file

## License

[MIT](LICENSE) © Rokas Anisas

## Contributing

Bug reports, feature ideas, and pull requests welcome. See [CONTRIBUTING.md](CONTRIBUTING.md) for the dev setup and project layout.
