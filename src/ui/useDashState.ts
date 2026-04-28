import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Fzf, type FzfResultItem } from "fzf";

import { MAX_RECENT } from "../recent/store.js";
import { selectionKey, type Project, type Selection } from "../types.js";

export type DashMode = "tree" | "flat" | "favourites" | "modified" | "recent";

const MODE_ORDER: DashMode[] = ["tree", "flat", "favourites", "modified", "recent"];
const EMPTY_AFFECTED: Set<string> = new Set();
const EMPTY_RECENT: string[] = [];

export interface VisibleItem {
  id: string;
  kind: "project" | "target" | "configuration";
  label: string;
  depth: number;
  hasChildren: boolean;
  expanded: boolean;
  selection: Selection | null;
  isFavourite: boolean;
  isModified: boolean;
  matchPositions?: Set<number>;
}

export interface DashState {
  mode: DashMode;
  effectiveMode: DashMode | "search";
  query: string;
  selectedIndex: number;
  items: VisibleItem[];
  toggleMode: (direction?: 1 | -1) => void;
  setQuery: (q: string) => void;
  appendToQuery: (s: string) => void;
  popFromQuery: () => void;
  clearQuery: () => void;
  moveUp: () => void;
  moveDown: () => void;
  pageUp: (n: number) => void;
  pageDown: (n: number) => void;
  toggleExpand: (id: string) => void;
  expandSelected: () => void;
  collapseSelected: () => void;
  toggleFavouriteSelected: () => void;
  recordRecentSelected: () => void;
}

interface UseDashStateOptions {
  initialMode?: DashMode;
  initialFavourites?: Set<string>;
  initialRecent?: string[];
  affected?: Set<string>;
  onFavouritesChange?: (favourites: Set<string>) => void;
  onRecentChange?: (recent: string[]) => void;
  onModeChange?: (mode: DashMode) => void;
}

export function useDashState(projects: Project[], options: UseDashStateOptions = {}): DashState {
  const affected = options.affected ?? EMPTY_AFFECTED;
  const [mode, setMode] = useState<DashMode>(options.initialMode ?? "tree");
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [favourites, setFavourites] = useState<Set<string>>(
    () => new Set(options.initialFavourites ?? []),
  );
  const [recent, setRecent] = useState<string[]>(() =>
    (options.initialRecent ?? EMPTY_RECENT).slice(0, MAX_RECENT),
  );
  const recentRef = useRef<string[]>(recent);
  recentRef.current = recent;

  const effectiveMode: DashMode | "search" = query.length > 0 ? "search" : mode;

  const items = useMemo<VisibleItem[]>(() => {
    if (query.length > 0) return buildSearchItems(projects, query, favourites, affected);
    if (mode === "favourites") return buildFavouriteItems(projects, favourites, affected);
    if (mode === "modified") return buildModifiedItems(projects, expanded, favourites, affected);
    if (mode === "recent") return buildRecentItems(projects, favourites, affected, recent);
    if (mode === "flat") return buildFlatItems(projects, favourites, affected);
    return buildTreeItems(projects, expanded, favourites, affected);
  }, [projects, mode, query, expanded, favourites, affected, recent]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query, mode]);

  useEffect(() => {
    if (selectedIndex >= items.length) {
      setSelectedIndex(Math.max(0, items.length - 1));
    }
  }, [items.length, selectedIndex]);

  const toggleExpand = useCallback((id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const onFavChange = options.onFavouritesChange;
  const toggleFavourite = useCallback(
    (key: string) => {
      setFavourites((prev) => {
        const next = new Set(prev);
        if (next.has(key)) next.delete(key);
        else next.add(key);
        onFavChange?.(next);
        return next;
      });
    },
    [onFavChange],
  );

  const onRecentChange = options.onRecentChange;
  const recordRecent = useCallback(
    (key: string) => {
      const prev = recentRef.current;
      const next = [key, ...prev.filter((k) => k !== key)].slice(0, MAX_RECENT);
      recentRef.current = next;
      onRecentChange?.(next);
      setRecent(next);
    },
    [onRecentChange],
  );

  const onModeChange = options.onModeChange;
  const cycleMode = useCallback(
    (direction: 1 | -1 = 1) => {
      setMode((m) => {
        const len = MODE_ORDER.length;
        const idx = (MODE_ORDER.indexOf(m) + direction + len) % len;
        const next = MODE_ORDER[idx] ?? "tree";
        onModeChange?.(next);
        return next;
      });
    },
    [onModeChange],
  );

  const currentItem = items[selectedIndex];

  return {
    mode,
    effectiveMode,
    query,
    selectedIndex,
    items,
    toggleMode: cycleMode,
    setQuery,
    appendToQuery: (s) => setQuery((q) => q + s),
    popFromQuery: () => setQuery((q) => q.slice(0, -1)),
    clearQuery: () => setQuery(""),
    moveUp: () => setSelectedIndex((i) => Math.max(0, i - 1)),
    moveDown: () => setSelectedIndex((i) => Math.min(Math.max(items.length - 1, 0), i + 1)),
    pageUp: (n) => setSelectedIndex((i) => Math.max(0, i - n)),
    pageDown: (n) => setSelectedIndex((i) => Math.min(Math.max(items.length - 1, 0), i + n)),
    toggleExpand,
    expandSelected: () => {
      if (currentItem && currentItem.hasChildren && !currentItem.expanded) {
        toggleExpand(currentItem.id);
      }
    },
    collapseSelected: () => {
      if (currentItem && currentItem.hasChildren && currentItem.expanded) {
        toggleExpand(currentItem.id);
      }
    },
    toggleFavouriteSelected: () => {
      if (currentItem && currentItem.selection) {
        toggleFavourite(selectionKey(currentItem.selection));
      }
    },
    recordRecentSelected: () => {
      if (currentItem && currentItem.selection) {
        recordRecent(selectionKey(currentItem.selection));
      }
    },
  };
}

function isFav(selection: Selection | null, favourites: Set<string>): boolean {
  return selection ? favourites.has(selectionKey(selection)) : false;
}

function buildTreeItems(
  projects: Project[],
  expanded: Set<string>,
  favourites: Set<string>,
  affected: Set<string>,
): VisibleItem[] {
  const items: VisibleItem[] = [];
  for (const p of projects) {
    const projectId = `p:${p.name}`;
    const projectExpanded = expanded.has(projectId);
    const projectModified = affected.has(p.name);
    items.push({
      id: projectId,
      kind: "project",
      label: p.name,
      depth: 0,
      hasChildren: p.targets.length > 0,
      expanded: projectExpanded,
      selection: null,
      isFavourite: false,
      isModified: projectModified,
    });
    if (!projectExpanded) continue;

    for (const t of p.targets) {
      const targetId = `t:${p.name}:${t.name}`;
      const targetExpanded = expanded.has(targetId);
      const targetSelection: Selection = { kind: "target", project: p.name, target: t.name };
      items.push({
        id: targetId,
        kind: "target",
        label: t.name,
        depth: 1,
        hasChildren: t.configurations.length > 0,
        expanded: targetExpanded,
        selection: targetSelection,
        isFavourite: isFav(targetSelection, favourites),
        isModified: projectModified,
      });
      if (!targetExpanded) continue;

      for (const c of t.configurations) {
        const cfgSelection: Selection = {
          kind: "configuration",
          project: p.name,
          target: t.name,
          configuration: c.name,
        };
        items.push({
          id: `c:${p.name}:${t.name}:${c.name}`,
          kind: "configuration",
          label: c.name,
          depth: 2,
          hasChildren: false,
          expanded: false,
          selection: cfgSelection,
          isFavourite: isFav(cfgSelection, favourites),
          isModified: projectModified,
        });
      }
    }
  }
  return items;
}

function buildFlatItems(
  projects: Project[],
  favourites: Set<string>,
  affected: Set<string>,
): VisibleItem[] {
  const items: VisibleItem[] = [];
  for (const p of projects) {
    const projectModified = affected.has(p.name);
    for (const t of p.targets) {
      const targetSelection: Selection = { kind: "target", project: p.name, target: t.name };
      items.push({
        id: `t:${p.name}:${t.name}`,
        kind: "target",
        label: `${p.name}:${t.name}`,
        depth: 0,
        hasChildren: false,
        expanded: false,
        selection: targetSelection,
        isFavourite: isFav(targetSelection, favourites),
        isModified: projectModified,
      });
      for (const c of t.configurations) {
        const cfgSelection: Selection = {
          kind: "configuration",
          project: p.name,
          target: t.name,
          configuration: c.name,
        };
        items.push({
          id: `c:${p.name}:${t.name}:${c.name}`,
          kind: "configuration",
          label: `${p.name}:${t.name}:${c.name}`,
          depth: 0,
          hasChildren: false,
          expanded: false,
          selection: cfgSelection,
          isFavourite: isFav(cfgSelection, favourites),
          isModified: projectModified,
        });
      }
    }
  }
  return items;
}

function buildFavouriteItems(
  projects: Project[],
  favourites: Set<string>,
  affected: Set<string>,
): VisibleItem[] {
  if (favourites.size === 0) return [];
  const flat = buildFlatItems(projects, favourites, affected);
  const byKey = new Map<string, VisibleItem>();
  for (const item of flat) {
    if (item.selection) byKey.set(selectionKey(item.selection), item);
  }
  const result: VisibleItem[] = [];
  for (const key of favourites) {
    const item = byKey.get(key);
    if (item) result.push(item);
  }
  return result;
}

function buildRecentItems(
  projects: Project[],
  favourites: Set<string>,
  affected: Set<string>,
  recent: string[],
): VisibleItem[] {
  if (recent.length === 0) return [];
  const flat = buildFlatItems(projects, favourites, affected);
  const byKey = new Map<string, VisibleItem>();
  for (const item of flat) {
    if (item.selection) byKey.set(selectionKey(item.selection), item);
  }
  const result: VisibleItem[] = [];
  for (const key of recent) {
    const item = byKey.get(key);
    if (item) result.push(item);
  }
  return result;
}

function buildModifiedItems(
  projects: Project[],
  expanded: Set<string>,
  favourites: Set<string>,
  affected: Set<string>,
): VisibleItem[] {
  if (affected.size === 0) return [];
  const filtered = projects.filter((p) => affected.has(p.name));
  return buildTreeItems(filtered, expanded, favourites, affected);
}

function buildSearchItems(
  projects: Project[],
  query: string,
  favourites: Set<string>,
  affected: Set<string>,
): VisibleItem[] {
  const flat = buildFlatItems(projects, favourites, affected);
  const fzf = new Fzf<VisibleItem[]>(flat, {
    selector: (item: VisibleItem) => item.label,
    casing: "smart-case",
  });
  const results: FzfResultItem<VisibleItem>[] = fzf.find(query);
  return results.map((r) => ({ ...r.item, matchPositions: r.positions }));
}
