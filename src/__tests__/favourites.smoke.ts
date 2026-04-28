import { mkdtempSync, rmSync, existsSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { loadFavourites, saveFavourites, favouritesDir } from "../favourites/store.js";
import { loadPreferences, savePreferences } from "../preferences/store.js";
import { loadCachedProjects, saveCachedProjects } from "../cache/projectsCache.js";

function ok(cond: boolean, label: string): void {
  if (!cond) {
    process.stderr.write(`FAIL: ${label}\n`);
    process.exit(1);
  }
  process.stdout.write(`ok: ${label}\n`);
}

const root = mkdtempSync(join(tmpdir(), "nx-dash-test-"));
try {
  // Favourites round-trip
  const empty = loadFavourites(root);
  ok(empty.size === 0, "fresh dir returns empty Set");

  saveFavourites(root, new Set(["web:build", "api:serve:prod"]));
  const dir = favouritesDir(root);
  ok(existsSync(dir), "directory created");
  ok(existsSync(join(dir, ".gitignore")), ".gitignore created");
  ok(existsSync(join(dir, "favourites.json")), "favourites.json created");

  const giContent = readFileSync(join(dir, ".gitignore"), "utf8");
  ok(giContent.includes("*"), ".gitignore self-ignores all");

  const reloaded = loadFavourites(root);
  ok(reloaded.size === 2, "reloaded Set has 2 entries");
  ok(reloaded.has("web:build"), "reloaded contains web:build");
  ok(reloaded.has("api:serve:prod"), "reloaded contains api:serve:prod");

  const ordered = Array.from(reloaded);
  ok(ordered[0] === "web:build" && ordered[1] === "api:serve:prod", "insertion order preserved");

  saveFavourites(root, new Set());
  const empty2 = loadFavourites(root);
  ok(empty2.size === 0, "saved empty Set reloads empty");

  // Preferences round-trip
  const defaultPrefs = loadPreferences(root);
  ok(defaultPrefs.lastMode === "tree", "missing preferences default to tree");

  savePreferences(root, { lastMode: "favourites" });
  const reloadedPrefs = loadPreferences(root);
  ok(reloadedPrefs.lastMode === "favourites", "preferences round-trip favourites");

  savePreferences(root, { lastMode: "flat" });
  ok(loadPreferences(root).lastMode === "flat", "preferences round-trip flat");

  savePreferences(root, { lastMode: "modified" });
  ok(loadPreferences(root).lastMode === "modified", "preferences round-trip modified");

  // Tampering — invalid mode falls back to default
  const prefsPath = join(dir, "preferences.json");
  require("node:fs").writeFileSync(prefsPath, JSON.stringify({ version: 1, lastMode: "bogus" }));
  ok(loadPreferences(root).lastMode === "tree", "invalid mode falls back to tree");

  // Both stores share the single .gitignore — no duplicates
  ok(existsSync(join(dir, ".gitignore")), ".gitignore still present after preferences write");

  // Projects cache round-trip
  ok(loadCachedProjects(root) === null, "missing projects cache returns null");

  saveCachedProjects(root, "nx", [
    { name: "web", root: "apps/web", targets: [{ name: "build", configurations: [] }] },
    { name: "api", root: "apps/api", targets: [] },
  ]);

  const cached = loadCachedProjects(root);
  ok(cached !== null, "cache loads after save");
  ok(cached!.source === "nx", "cache preserves source");
  ok(cached!.projects.length === 2, "cache preserves 2 projects");
  ok(cached!.projects[0]!.name === "web" && cached!.projects[1]!.name === "api", "cache preserves project order");
  ok(typeof cached!.savedAt === "string" && cached!.savedAt.length > 0, "cache records savedAt timestamp");

  // Tampered cache (wrong version) → returns null instead of crashing
  const cachePath = join(dir, "projects-cache.json");
  require("node:fs").writeFileSync(cachePath, JSON.stringify({ version: 99, projects: [] }));
  ok(loadCachedProjects(root) === null, "incompatible cache version returns null");

  process.stdout.write("all storage smoke tests passed\n");
} finally {
  rmSync(root, { recursive: true, force: true });
}
