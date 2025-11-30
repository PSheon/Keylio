import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // ===== React Best Practices =====
      "react/jsx-no-leaked-render": "warn",
      "react/self-closing-comp": "warn",
      "react/jsx-curly-brace-presence": ["warn", { props: "never", children: "never" }],
      
      // ===== React Hooks =====
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
      
      // ===== TypeScript =====
      "@typescript-eslint/no-unused-vars": ["warn", { 
        argsIgnorePattern: "^_",
        varsIgnorePattern: "^_",
        caughtErrorsIgnorePattern: "^_"
      }],
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/consistent-type-imports": ["warn", {
        prefer: "type-imports",
        fixStyle: "inline-type-imports"
      }],
      
      // ===== Import Organization =====
      "import/order": ["warn", {
        groups: [
          "builtin",
          "external", 
          "internal",
          ["parent", "sibling"],
          "index",
          "type"
        ],
        pathGroups: [
          {
            pattern: "react",
            group: "builtin",
            position: "before"
          },
          {
            pattern: "next/**",
            group: "builtin",
            position: "before"
          },
          {
            pattern: "@/**",
            group: "internal",
            position: "before"
          }
        ],
        pathGroupsExcludedImportTypes: ["react", "next"],
        "newlines-between": "never",
        alphabetize: {
          order: "asc",
          caseInsensitive: true
        }
      }],
      "import/no-duplicates": "warn",
      
      // ===== General Best Practices =====
      "no-console": ["warn", { allow: ["warn", "error"] }],
      "prefer-const": "warn",
      "no-var": "error",
      "eqeqeq": ["warn", "always", { null: "ignore" }],
      
      // ===== Formatting =====
      "no-multiple-empty-lines": ["warn", { max: 1, maxEOF: 0, maxBOF: 0 }],
      "no-trailing-spaces": "warn",
      "eol-last": ["warn", "always"],
    }
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Additional ignores
    "node_modules/**",
    "*.config.js",
    "*.config.mjs",
    "*.config.ts",
  ]),
]);

export default eslintConfig;
