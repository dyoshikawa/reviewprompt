import { defineConfig } from "vite-plus";

// One file configures the whole Vite+ toolchain: the package build (`pack`),
// the formatter (`fmt`), the linter (`lint`) and the pre-commit checks
// (`staged`). The unit and e2e tests keep their own `vitest.config.ts` and
// `vitest.e2e.config.ts`.
export default defineConfig({
  // `vp pack` (tsdown). Builds the CLI entry into the paths `package.json`
  // publishes: `dist/index.js` (ESM, the `bin`), `dist/index.cjs` (CJS) and
  // their `dist/index.d.ts` / `dist/index.d.cts` declarations.
  pack: {
    entry: ["src/cli/index.ts"],
    format: ["cjs", "esm"],
    // tsup emitted no source maps. tsdown turns them on (for the ESM build
    // too) when tsconfig.json sets `declarationMap`, so switch them off here.
    dts: { sourcemap: false },
    clean: true,
    // Keep `.js` / `.d.ts` for ESM (the package is `"type": "module"`)
    // instead of tsdown's `.mjs` / `.d.mts` default.
    fixedExtension: false,
    // tsup took the target from tsconfig.json; tsdown would derive it from
    // `engines.node` instead.
    target: "es2024",
    // Keep the `"use strict"` prologue tsup put at the top of the CJS build
    // (the sources are ES modules, so they are strict code).
    outputOptions: { strict: true },
  },

  // `vp fmt` (Oxfmt).
  fmt: {
    printWidth: 100,
    tabWidth: 2,
    useTabs: false,
    semi: true,
    singleQuote: false,
    trailingComma: "all",
    arrowParens: "always",
    experimentalSortImports: {},
    ignorePatterns: [
      "package.json",
      "node_modules/**",
      "dist/**",
      "dist*/**",
      "coverage/**",
      "pnpm-lock.yaml",
      "opencode.json",
      ".serena/**",
      ".vscode/**",
      ".zed/**",
      ".github/workflows/**",
    ],
    overrides: [
      {
        files: ["**/*.json", "**/*.jsonc"],
        options: { trailingComma: "none" },
      },
    ],
  },

  // `vp lint` (Oxlint). Type checking stays with `tsgo` (`pnpm typecheck`):
  // Oxlint's type-aware mode would add rules the project does not use.
  lint: {
    plugins: ["typescript", "import", "unicorn"],
    // Vite+'s own rule, which reports `vite` / `vitest` imports that should
    // come from `vite-plus`.
    jsPlugins: [{ name: "vite-plus", specifier: "vite-plus/oxlint-plugin" }],
    categories: {
      correctness: "error",
      suspicious: "warn",
      style: "off",
      pedantic: "off",
    },
    rules: {
      eqeqeq: "error",
      "import/no-cycle": "error",
      "no-console": "off",
      "typescript/no-explicit-any": "warn",
      "unicorn/prefer-node-protocol": "error",
      "unicorn/no-array-reduce": "off",
      "vite-plus/prefer-vite-plus-imports": "error",
    },
    env: {
      browser: false,
      node: true,
      es2024: true,
    },
    ignorePatterns: ["dist/**", "coverage/**", "*.d.ts", "node_modules/**"],
    overrides: [
      {
        files: ["**/*.test.ts"],
        rules: {
          "typescript/no-explicit-any": "off",
        },
      },
    ],
  },

  // `vp staged`, run by the pre-commit hook (`.vite-hooks/pre-commit`).
  staged: {
    "*.{ts,tsx,js,jsx}": ["vp fmt --write", "vp lint --fix --max-warnings 0"],
    "*.{ts,tsx}": [() => "tsgo --noEmit", () => "pnpm test"],
    "**/*": ["secretlint --secretlintignore .gitignore", "cspell"],
  },
});
