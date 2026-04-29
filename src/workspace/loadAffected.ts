import { resolveNxBin } from "./nxBin.js";
import { parseProjectNames, runJson } from "./loadProjects.js";

const NX_AFFECTED_TIMEOUT_MS = 15_000;

export async function loadAffectedProjects(workspaceRoot: string): Promise<Set<string>> {
  try {
    const nxBin = resolveNxBin(workspaceRoot);
    if (!nxBin) return new Set();
    const raw = await runJson(
      nxBin.cmd,
      [...nxBin.args, "show", "projects", "--affected", "--json"],
      workspaceRoot,
      NX_AFFECTED_TIMEOUT_MS,
    );
    return new Set(parseProjectNames(raw));
  } catch {
    return new Set();
  }
}
