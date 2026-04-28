import { defineConfig } from "tsup";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  entry: ["src/cli.tsx"],
  format: ["esm"],
  target: "node18",
  outDir: "dist",
  clean: true,
  sourcemap: false,
  splitting: false,
  shims: true,
  noExternal: [/.*/],
  platform: "node",
  banner: {
    js: [
      "#!/usr/bin/env node",
      "import { createRequire as __nxDashCreateRequire } from 'node:module';",
      "const require = __nxDashCreateRequire(import.meta.url);",
    ].join("\n"),
  },
  esbuildOptions(options) {
    options.alias = {
      ...(options.alias ?? {}),
      "react-devtools-core": resolve(here, "src/stubs/react-devtools-core.ts"),
    };
  },
});
