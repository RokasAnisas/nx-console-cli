import { spawn } from "node:child_process";
import { readFile } from "node:fs/promises";
import { basename, dirname, relative } from "node:path";
import { glob } from "tinyglobby";

import { resolveNxBin } from "./nxBin.js";
import type { Project, Target, Configuration } from "../types.js";

export interface LoadResult {
  projects: Project[];
  source: "nx" | "glob";
  warning?: string;
}

export type LoadProgress =
  | { phase: "discovering" }
  | { phase: "loading"; current: number; total: number }
  | { phase: "fallback"; reason: string };

export type ProgressCallback = (progress: LoadProgress) => void;

const NX_TIMEOUT_MS = 10_000;
const PER_PROJECT_TIMEOUT_MS = 10_000;
const PER_PROJECT_CONCURRENCY = 8;

export async function loadProjects(
  workspaceRoot: string,
  onProgress?: ProgressCallback,
): Promise<LoadResult> {
  onProgress?.({ phase: "discovering" });
  try {
    const projects = await loadViaNx(workspaceRoot, onProgress);
    if (projects.length > 0) return { projects, source: "nx" };
  } catch (err) {
    const reason = `\`nx show\` failed (${(err as Error).message}); falling back to project.json scan.`;
    onProgress?.({ phase: "fallback", reason });
    const projects = await loadViaGlob(workspaceRoot);
    return { projects, source: "glob", warning: reason };
  }

  const projects = await loadViaGlob(workspaceRoot);
  return { projects, source: "glob" };
}

async function loadViaNx(workspaceRoot: string, onProgress?: ProgressCallback): Promise<Project[]> {
  const nxBin = resolveNxBin(workspaceRoot);
  if (!nxBin) return [];
  const namesJson = await runJson(
    nxBin.cmd,
    [...nxBin.args, "show", "projects", "--json"],
    workspaceRoot,
    NX_TIMEOUT_MS,
  );
  const names = parseProjectNames(namesJson);
  if (names.length === 0) return [];

  const total = names.length;
  let done = 0;
  onProgress?.({ phase: "loading", current: done, total });

  const projects: Project[] = [];
  for (let i = 0; i < names.length; i += PER_PROJECT_CONCURRENCY) {
    const chunk = names.slice(i, i + PER_PROJECT_CONCURRENCY);
    const results = await Promise.all(
      chunk.map((name) =>
        runJson(
          nxBin.cmd,
          [...nxBin.args, "show", "project", name, "--json"],
          workspaceRoot,
          PER_PROJECT_TIMEOUT_MS,
        )
          .then((raw) => mapNxProject(name, raw))
          .catch(() => null)
          .finally(() => {
            done += 1;
            onProgress?.({ phase: "loading", current: done, total });
          }),
      ),
    );
    for (const r of results) if (r) projects.push(r);
  }

  projects.sort((a, b) => a.name.localeCompare(b.name));
  return projects;
}

export function parseProjectNames(raw: string): string[] {
  const trimmed = raw.trim();
  if (!trimmed) return [];
  try {
    const parsed = JSON.parse(trimmed);
    if (Array.isArray(parsed)) return parsed.filter((x) => typeof x === "string");
    return [];
  } catch {
    return trimmed
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
  }
}

function mapNxProject(name: string, raw: string): Project | null {
  let json: any;
  try {
    json = JSON.parse(raw);
  } catch {
    return null;
  }
  return normalizeProject({
    name: json.name ?? name,
    root: json.root ?? ".",
    projectType: json.projectType,
    targets: json.targets ?? {},
  });
}

/**
 * Distinguishes a real NX `project.json` from any other JSON file that happens
 * to share the name (e.g. i18n/translation files). NX projects carry a
 * recognizable fingerprint — the project schema reference or structural fields
 * like `targets`/`projectType`/`sourceRoot`/`tags` — that translation files lack.
 */
export function isNxProjectJson(json: unknown): boolean {
  if (typeof json !== "object" || json === null || Array.isArray(json)) return false;
  const obj = json as Record<string, unknown>;
  // Strongest signal: the NX project schema reference.
  if (typeof obj.$schema === "string" && obj.$schema.includes("project-schema")) return true;
  // Structural NX fingerprint — translation/i18n files have none of these.
  const hasTargets =
    typeof obj.targets === "object" && obj.targets !== null && !Array.isArray(obj.targets);
  const hasProjectType = obj.projectType === "application" || obj.projectType === "library";
  const hasSourceRoot = typeof obj.sourceRoot === "string";
  const hasTags = Array.isArray(obj.tags);
  return hasTargets || hasProjectType || hasSourceRoot || hasTags;
}

async function loadViaGlob(workspaceRoot: string): Promise<Project[]> {
  const matches = await glob(["**/project.json"], {
    cwd: workspaceRoot,
    ignore: ["**/node_modules/**", "**/dist/**", "**/.nx/**", "**/tmp/**", "**/.cache/**"],
    absolute: true,
  });

  const projects: Project[] = [];
  for (const file of matches) {
    try {
      const raw = await readFile(file, "utf8");
      const json = JSON.parse(raw);
      if (!isNxProjectJson(json)) continue; // skip non-NX project.json (e.g. i18n/translation files)
      const root = relative(workspaceRoot, dirname(file)) || ".";
      projects.push(
        normalizeProject({
          name: json.name ?? basename(dirname(file)),
          root,
          projectType: json.projectType,
          targets: json.targets ?? {},
        }),
      );
    } catch {
      // skip unparseable
    }
  }
  projects.sort((a, b) => a.name.localeCompare(b.name));
  return projects;
}

function normalizeProject(input: {
  name: string;
  root: string;
  projectType?: string;
  targets: Record<string, any>;
}): Project {
  const targets: Target[] = Object.entries(input.targets ?? {}).map(([targetName, def]) => {
    const configurations: Configuration[] = Object.keys(def?.configurations ?? {}).map(
      (cfgName) => ({
        name: cfgName,
      }),
    );
    return {
      name: targetName,
      executor: typeof def?.executor === "string" ? def.executor : undefined,
      defaultConfiguration:
        typeof def?.defaultConfiguration === "string" ? def.defaultConfiguration : undefined,
      configurations: configurations.sort((a, b) => a.name.localeCompare(b.name)),
    };
  });
  targets.sort((a, b) => a.name.localeCompare(b.name));
  return {
    name: input.name,
    root: input.root,
    projectType:
      input.projectType === "application" || input.projectType === "library"
        ? input.projectType
        : undefined,
    targets,
  };
}

export function runJson(
  cmd: string,
  args: string[],
  cwd: string,
  timeoutMs: number,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { cwd, stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    let killed = false;

    const timer = setTimeout(() => {
      killed = true;
      child.kill("SIGTERM");
    }, timeoutMs);

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    child.on("error", (err) => {
      clearTimeout(timer);
      reject(err);
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      if (killed) {
        reject(new Error(`${cmd} timed out after ${timeoutMs}ms`));
        return;
      }
      if (code !== 0) {
        reject(new Error(`${cmd} exited ${code}: ${stderr.trim() || stdout.trim()}`));
        return;
      }
      resolve(stdout);
    });
  });
}
