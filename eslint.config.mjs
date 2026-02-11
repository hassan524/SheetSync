import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  // extend Next.js core + TypeScript rules
  ...compat.extends("next/core-web-vitals", "next/typescript"),

  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
    ],
    rules: {
      // turn off react/no-unescaped-entities globally
      "react/no-unescaped-entities": "off",

      // optional: make React strict
      "react/react-in-jsx-scope": "off",
      "react/prop-types": "off",

      // optional: make TS ESLint strict
      "@typescript-eslint/no-unused-vars": ["error"],
      "@typescript-eslint/explicit-function-return-type": "warn",
    },
  },
];

export default eslintConfig;
