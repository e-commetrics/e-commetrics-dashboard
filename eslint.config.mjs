import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

// eslint-config-next 16 ships native flat configs, so FlatCompat is no longer
// needed (it crashed with "Converting circular structure to JSON").
export default defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // New React Compiler rule. It flags the "load data in useEffect" pattern
      // used across the app (setLoading(true) before a fetch). Kept visible as a
      // warning; the real fix is moving data fetching to TanStack Query.
      "react-hooks/set-state-in-effect": "warn",
    },
  },
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts"]),
]);
