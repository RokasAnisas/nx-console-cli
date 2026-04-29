import { spawn } from "node:child_process";

import { resolveNxBin } from "../workspace/nxBin.js";
import type { Selection } from "../types.js";

export interface RunOptions {
  workspaceRoot: string;
  selection: Selection;
  dryRun?: boolean;
}

export function buildTargetSpec(selection: Selection): string {
  if (selection.kind === "configuration") {
    return `${selection.project}:${selection.target}:${selection.configuration}`;
  }
  return `${selection.project}:${selection.target}`;
}

export { resolveNxBin };

export function runTarget({ workspaceRoot, selection, dryRun }: RunOptions): Promise<number> {
  const nxBin = resolveNxBin(workspaceRoot);
  if (!nxBin) {
    process.stderr.write(
      `nx is not installed in this workspace. Run \`npm install nx\` (or your package manager's equivalent) and try again.\n`,
    );
    return Promise.resolve(1);
  }
  const { cmd, args: prefix } = nxBin;
  const args = [...prefix, "run", buildTargetSpec(selection)];

  if (dryRun) {
    process.stdout.write(`[dry-run] cwd=${workspaceRoot}\n`);
    process.stdout.write(`[dry-run] ${cmd} ${args.join(" ")}\n`);
    return Promise.resolve(0);
  }

  return new Promise((resolve) => {
    const child = spawn(cmd, args, { cwd: workspaceRoot, stdio: "inherit" });

    const forward = (sig: NodeJS.Signals) => {
      if (!child.killed) child.kill(sig);
    };
    process.on("SIGINT", forward);
    process.on("SIGTERM", forward);
    process.on("SIGHUP", forward);

    child.on("error", (err) => {
      process.stderr.write(`Failed to start nx: ${err.message}\n`);
      cleanup();
      resolve(1);
    });

    child.on("exit", (code, signal) => {
      cleanup();
      if (signal) {
        process.kill(process.pid, signal);
        return;
      }
      resolve(code ?? 0);
    });

    function cleanup() {
      process.off("SIGINT", forward);
      process.off("SIGTERM", forward);
      process.off("SIGHUP", forward);
    }
  });
}
