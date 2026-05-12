// ESLint 9 flat config. Next 16 removed `next lint`, so lint via `eslint .`
// (see the "lint" script in package.json). eslint-config-next@16 ships a native
// flat-config array as its default export — spread it here.
import next from "eslint-config-next";

const eslintConfig = [
  ...next,
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "convex/_generated/**",
      "next-env.d.ts",
    ],
  },
];

export default eslintConfig;
