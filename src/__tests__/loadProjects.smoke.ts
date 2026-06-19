import { isNxProjectJson } from "../workspace/loadProjects.js";

function ok(cond: boolean, label: string): void {
  if (!cond) {
    process.stderr.write(`FAIL: ${label}\n`);
    process.exit(1);
  }
  process.stdout.write(`ok: ${label}\n`);
}

// Accepts: real NX project.json shapes
ok(
  isNxProjectJson({
    name: "kortlist-infra",
    $schema: "../../../node_modules/nx/schemas/project-schema.json",
    projectType: "library",
    sourceRoot: "apps/kortlist/infra",
    tags: ["infra"],
    targets: { "get-secrets": {} },
  }),
  "accepts full NX project.json",
);
ok(isNxProjectJson({ name: "lib", projectType: "library" }), "accepts lib with only projectType");
ok(isNxProjectJson({ name: "app", projectType: "application" }), "accepts app projectType");
ok(isNxProjectJson({ name: "x", targets: { build: {} } }), "accepts project with only targets");
ok(isNxProjectJson({ name: "x", targets: {} }), "accepts project with empty targets object");
ok(isNxProjectJson({ sourceRoot: "src" }), "accepts project with only sourceRoot");
ok(isNxProjectJson({ tags: ["scope:foo"] }), "accepts project with only tags");
ok(
  isNxProjectJson({ $schema: "node_modules/nx/schemas/project-schema.json" }),
  "accepts on $schema reference alone",
);

// Rejects: translation files and other non-NX JSON
ok(!isNxProjectJson({ hello: "Labas", bye: "Viso gero" }), "rejects flat translation map");
ok(
  !isNxProjectJson({ common: { ok: "Gerai" }, errors: { notFound: "Nerasta" } }),
  "rejects nested translation object",
);
ok(!isNxProjectJson({ name: "translations" }), "rejects object with only a name field");
ok(!isNxProjectJson({ targets: ["build", "test"] }), "rejects when targets is an array");
ok(!isNxProjectJson({ tags: "infra" }), "rejects when tags is a string");
ok(!isNxProjectJson([{ name: "x" }]), "rejects a JSON array");
ok(!isNxProjectJson("project.json"), "rejects a string");
ok(!isNxProjectJson(42), "rejects a number");
ok(!isNxProjectJson(null), "rejects null");

process.stdout.write("all loadProjects fingerprint checks passed\n");
