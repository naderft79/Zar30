import nextCoreWebVitals from "eslint-config-next/core-web-vitals"
import nextTypescript from "eslint-config-next/typescript"

const eslintConfig = [
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "android/**",
      "ios/**",
      "public/sw.js",
      "prisma/migrations/**",
      "coverage/**",
      // خروجی‌های تست Playwright لینت نمی‌شوند
      "playwright-report/**",
      "test-results/**",
      // کدهای تولیدشده Prisma لینت نمی شوند
      "src/generated/**",
      // snapshot ثابت UI Skills (upstream) — بخشی از کد پروژه نیست
      ".agent/**",
    ],
  },
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
    },
  },
]

export default eslintConfig
