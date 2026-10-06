import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

// X-5 §(5): Decimal'in sessiz float kaçışı ve ham aritmetiği yasaktır. Kural
// sözdizimseldir, tip-farkında değildir (FAZ1 §D.2 — `parserOptions.project` lint
// süresini ikiye katlardı); bu yüzden `Number()` her yerde yasaktır, tam sayı
// ayrıştırma `parseInt(x, 10)` ile yapılır. Ham aritmetiğe izin verilen dosyalar
// aşağıdaki istisnadır (X-5 §(4)/(6)).
const decimalKacislari = [
  {
    selector: "CallExpression[callee.name='Number']",
    message: "Number() yasak (X-5 §(5)): tutar formatla() ile, tam sayı parseInt(x, 10) ile.",
  },
  {
    selector: "CallExpression[callee.name='parseFloat'], CallExpression[callee.property.name='parseFloat']",
    message: "parseFloat yasak (X-5 §(5)): parasal girdi validation.ts şemalarıyla Decimal'e çevrilir.",
  },
  {
    selector: "CallExpression[callee.property.name='toNumber']",
    message: ".toNumber() yasak (X-5 §(6)): istemciye giden değer formatla() ile string olur.",
  },
  {
    selector:
      "CallExpression[callee.property.name=/^(plus|minus|times|div|dividedBy|mul|sub|add|mod|pow|toDecimalPlaces|toDP)$/]",
    message:
      "Decimal ham aritmetiği yalnız hesaplaSatirTutarlari() ve cozumleBirimFiyat() içindedir (X-5 §(4)); toplamlar veritabanında SUM() ile alınır.",
  },
];

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: ["src/**/*.{ts,tsx}"],
    ignores: [
      "src/lib/satir-tutarlari.ts",
      "src/lib/fiyat.ts",
      "src/lib/money.ts",
      "src/**/*.test.ts",
      "src/**/*.itest.ts",
    ],
    rules: { "no-restricted-syntax": ["error", ...decimalKacislari] },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Prisma'nın ürettiği istemci (gitignored) — lint'lenmez (FAZ1 §D.2).
    "src/generated/**",
  ]),
]);

export default eslintConfig;
