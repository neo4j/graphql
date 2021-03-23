/*

    ESLint configuration for @neo4j/graphql monorepo

    Comments in this file encouraged to justify the reason for or benefits of having rules configured

    eslint-disable/eslint-disable-line/eslint-disable-next-line preferred to ignore necessary violations, to prevent inadvertently allowing genuine violations through

*/

const baseExtends = [
    "plugin:eslint-comments/recommended",
    "plugin:jest/recommended",
    "plugin:jest/style",
    "plugin:import/errors",
    "plugin:import/warnings",
    "plugin:prettier/recommended", // Enables eslint-plugin-prettier and eslint-config-prettier - ensure this is always last in the extends array
]; // Always spread at end of extends due to plugin:prettier/recommended

const baseRules = {
    "no-underscore-dangle": "warn", // TODO Refactor instances of _varName to remove dangling underscore, and delete this line (also fixes @typescript-eslint/naming-convention)
    "no-param-reassign": "warn", // Dangerous to have this off (out-of-scope side effects are bad), but there are some valid reasons for violations (Array.reduce(), setting GraphQL context, etc.), so use comments to disable ESLint for these
    "max-classes-per-file": "off", // Stylistic decision - we can judge whether there are too many classes in one file during code review
    "eslint-comments/no-unused-disable": "error", // Turn on optional rule to report eslint-disable comments having no effect
};

const typeScriptParser = {
    parser: "@typescript-eslint/parser",
    parserOptions: {
        tsconfigRootDir: __dirname,
        project: "./**/tsconfig.json",
    },
};

const baseTypeScriptExtends = [
    "airbnb-typescript/base",
    "plugin:@typescript-eslint/recommended",
    "plugin:@typescript-eslint/recommended-requiring-type-checking",
    "plugin:import/typescript",
    "prettier/@typescript-eslint", // Disables ESLint rules from @typescript-eslint/eslint-plugin that conflict with Prettier
    ...baseExtends,
];

const baseTypeScriptRules = {
    ...baseRules,
    "no-unused-vars": "off", // Must be disabled to allow @typescript-eslint/no-unused-vars to work
    "@typescript-eslint/naming-convention": "warn", // TODO Rename instances of _varName, and delete this line (also fixes no-underscore-dangle)
    "@typescript-eslint/no-explicit-any": "off", // Long term goal should be to have this rule on
    "@typescript-eslint/no-use-before-define": "warn", // Unavoidable in some places, but a refactor should potentially happen and this rule switched on
    "@typescript-eslint/explicit-module-boundary-types": "off", // TODO We should really define what our functions return
    "@typescript-eslint/no-unused-vars": ["error"], // Additional rule enabled because we don't want unused variables hanging about!
    "prettier/prettier": [
        "error",
        {
            endOfLine: "auto",
        },
    ], // Support all operating system line endings
    /*
    start of @typescript-eslint/recommended-requiring-type-checking rules
    TODO Over the long term, reduce our usage of `any` and switch these rules on
    */
    "@typescript-eslint/no-unsafe-assignment": "off", // Approximately 1100 instances
    "@typescript-eslint/no-unsafe-member-access": "off", // Approximately 700 instances
    "@typescript-eslint/no-unsafe-call": "off", // Approximately 500 instances
    "@typescript-eslint/restrict-template-expressions": "off", // TODO Make sure variables are properly cast when using in template expressions (approximately 350 instances)
    "@typescript-eslint/no-unsafe-return": "off", // Approximately 70 instances
    "@typescript-eslint/unbound-method": "off", // TODO Find out why apollo-server-testing is unhappy with this switched on
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
            rules: {
                ...baseTypeScriptRules,
                "@typescript-eslint/ban-ts-comment": ["warn", { "ts-ignore": "allow-with-description" }], // TODO Refactor and set severity to "error" - If @ts-ignore is genuinely required it justify with a reason: "@ts-ignore: Required for a reason"
            },
        },
        {
            files: ["examples/neo-push/client/**/*.tsx"],
            extends: ["airbnb-typescript"],
            rules: {
                "import/prefer-default-export": "off",
                "@typescript-eslint/no-unnecessary-type-assertion": ["off"],
            },
        },
        {
            files: ["examples/neo-push/server/**/*.ts"],
            extends: baseTypeScriptExtends,
            rules: {
                ...baseTypeScriptRules,
                "@typescript-eslint/no-floating-promises": ["off"],
                "import/prefer-default-export": "off",
                "import/no-extraneous-dependencies": "off",
                "@typescript-eslint/no-unnecessary-type-assertion": ["off"],
                "@typescript-eslint/no-use-before-define": ["off"],
            },
        },
        // More lenient ESLint configuration for test files
        {
            files: ["**/*.test.ts"],
            ...typeScriptParser,
            plugins: ["@typescript-eslint"],
            extends: baseTypeScriptExtends,
            rules: { "no-console": "off", ...baseTypeScriptRules, "@typescript-eslint/ban-ts-comment": "off" },
        },
    ],
};
