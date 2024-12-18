module.exports = {
  env: {
    es2021: true,
    node: true,
    "jest/globals": true,
  },
  globals: {
    NodeJS: true,
  },
  ignorePatterns: ["src/generated/**"],
  extends: [
    "airbnb-base",
    "plugin:import/errors",
    "plugin:import/warnings",
    "plugin:import/typescript",
    "prettier",
  ],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: 12,
    sourceType: "module",
    project: "tsconfig.json",
    tsconfigRootDir: __dirname,
  },
  plugins: ["@typescript-eslint"],
  overrides: [
    {
      files: "*.test.*",
      plugins: ["jest"],
      extends: ["plugin:jest/recommended", "plugin:jest/style"],
      rules: {
        "jest/no-disabled-tests": "error",
      },
    },
  ],
  rules: {
    "arrow-body-style": "off",
    "consistent-return": "off", // use typescript-eslint rules instead
    "@typescript-eslint/no-floating-promises": "error",
    "@typescript-eslint/no-misused-promises": "error",
    "no-return-await": "off",
    "@typescript-eslint/return-await": [
      "error",
      "error-handling-correctness-only",
    ],
    "@typescript-eslint/no-unsafe-return": "error",
    "no-unused-vars": "off",
    "@typescript-eslint/no-unused-vars": "error",
    "no-shadow": "off",
    "@typescript-eslint/no-shadow": "error",
    "max-len": [
      "error",
      {
        code: 120,
        ignoreComments: true,
        ignoreUrls: true,
        ignoreStrings: true,
        ignoreTemplateLiterals: true,
        ignoreRegExpLiterals: true,
      },
    ],
    "no-restricted-syntax": ["error", "ForInStatement"],
    "no-await-in-loop": "off",
    // disabled because not specifying a default case is often very valid
    // i.e. you definitely want the compiler to complain if e.g. new values
    // are added to an enum that you do not yet know how to handle
    "default-case": "off",
    "import/no-extraneous-dependencies": ["error", { devDependencies: true }],
    "no-void": ["error", { allowAsStatement: true }],
    "@typescript-eslint/only-throw-error": "error",
    "@typescript-eslint/await-thenable": "error",
    "import/extensions": [
      "error",
      "ignorePackages",
      {
        js: "never",
        jsx: "never",
        ts: "never",
        tsx: "never",
      },
    ],
    "import/no-relative-packages": "off",
    "import/prefer-default-export": "off",
  },
};
