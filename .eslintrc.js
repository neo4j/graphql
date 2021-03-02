const baseExtends = [
    "plugin:eslint-comments/recommended",
    "plugin:jest/recommended",
    "plugin:jest/style",
    "plugin:import/errors",
    "plugin:import/warnings",
    "plugin:prettier/recommended", // Enables eslint-plugin-prettier and eslint-config-prettier - ensure this is always last in the extends array
]; // Always spread at end of extends due to plugin:prettier/recommended

const baseRules = {
    "no-underscore-dangle": "off",
    "no-param-reassign": "off",
    "max-classes-per-file": "off", // We can judge whether there are too many classes in one file during code review
    "eslint-comments/no-unused-disable": "error", // Turn on optional rule to report eslint-disable comments having no effect
};

const typeScriptParser = {
    parser: "@typescript-eslint/parser",
    parserOptions: {
        tsconfigRootDir: __dirname,
        project: "./packages/**/tsconfig.json",
    },
};

const baseTypeScriptExtends = [
    "airbnb-typescript/base",
    "plugin:@typescript-eslint/recommended",
    "plugin:@typescript-eslint/recommended-requiring-type-checking",
    "prettier/@typescript-eslint", // Disables ESLint rules from @typescript-eslint/eslint-plugin that conflict with Prettier
    ...baseExtends,
];

const baseTypeScriptRules = {
    ...baseRules,
    "no-unused-vars": "off", // Must be disabled to allow @typescript-eslint/no-unused-vars to work
    "@typescript-eslint/naming-convention": "warn",
    "@typescript-eslint/no-explicit-any": "off",
    "@typescript-eslint/no-use-before-define": "warn",
    "@typescript-eslint/ban-ts-comment": "warn", // TODO Refactor needed so this can be changed to "error"
    "@typescript-eslint/explicit-module-boundary-types": "off",
    "@typescript-eslint/no-unused-vars": ["error"], // Additional rule enabled because we don't want unused variables hanging about!
    /* start of @typescript-eslint/recommended-requiring-type-checking rules */
    "@typescript-eslint/no-unsafe-assignment": "off", // Approximately 1100 instances
    "@typescript-eslint/no-unsafe-member-access": "off", // Approximately 700 instances
    "@typescript-eslint/no-unsafe-call": "off", // Approximately 500 instances
    "@typescript-eslint/restrict-template-expressions": "off", // Approximately 350 instances
    "@typescript-eslint/no-unsafe-return": "off", // Approximately 70 instances
    "@typescript-eslint/unbound-method": "off", // Apollo createTestClient unhappy with this switched on
    /* end of @typescript-eslint/recommended-requiring-type-checking rules */
};

module.exports = {
    root: true,
    extends: ["airbnb/base", ...baseExtends],
    env: {
        node: true,
    },
    rules: baseRules,
    overrides: [
        {
            files: ["**/*.ts"],
            ...typeScriptParser,
            plugins: ["@typescript-eslint"],
            extends: baseTypeScriptExtends,
            rules: baseTypeScriptRules,
        },
        // More leniant ESLint configuration for test files
        {
            files: ["**/*.test.ts"],
            ...typeScriptParser,
            plugins: ["@typescript-eslint"],
            extends: baseTypeScriptExtends,
            rules: { "no-console": "off", ...baseTypeScriptRules, "@typescript-eslint/ban-ts-comment": "off" },
        },
    ],
};
