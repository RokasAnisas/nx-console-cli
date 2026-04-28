export interface Configuration {
  name: string;
}

export interface Target {
  name: string;
  executor?: string;
  defaultConfiguration?: string;
  configurations: Configuration[];
}

export interface Project {
  name: string;
  root: string;
  projectType?: "application" | "library";
  targets: Target[];
}

export type Selection =
  | { kind: "target"; project: string; target: string }
  | { kind: "configuration"; project: string; target: string; configuration: string };

export function selectionKey(s: Selection): string {
  return s.kind === "configuration"
    ? `${s.project}:${s.target}:${s.configuration}`
    : `${s.project}:${s.target}`;
}

export type NodeKind = "project" | "target" | "configuration";

export interface TreeNode {
  id: string;
  kind: NodeKind;
  label: string;
  depth: number;
  parentId: string | null;
  hasChildren: boolean;
  selection: Selection | null;
}
