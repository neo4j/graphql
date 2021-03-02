module.exports = {
    root: true,
    plugins: ["prettier"],
    extends: [
        "airbnb/base",
        "plugin:eslint-comments/recommended",
        "plugin:jest/recommended",
        "plugin:jest/style",
        "plugin:import/errors",
        "plugin:import/warnings",
        "plugin:prettier/recommended",
    ],
    env: {
        node: true,
    },
    rules: {
        "no-underscore-dangle": "off",
        "no-param-reassign": "off",
        "max-classes-per-file": "off", // We can judge whether there are too many classes in one file during code review
        "eslint-comments/no-unused-disable": "error", // Turn on optional rule to report eslint-disable comments having no effect
    },
    overrides: [
        {
            files: ["**/*.ts"],
            parser: "@typescript-eslint/parser",
            parserOptions: {
                tsconfigRootDir: __dirname,
                project: "./packages/**/tsconfig.json",
            },
            plugins: ["@typescript-eslint"],
            extends: [
                "airbnb-typescript/base",
                "plugin:@typescript-eslint/recommended",
                "plugin:@typescript-eslint/recommended-requiring-type-checking",
                "plugin:eslint-comments/recommended",
                "plugin:jest/recommended",
                "plugin:jest/style",
                "plugin:import/errors",
                "plugin:import/warnings",
                "plugin:import/typescript",
                "prettier/@typescript-eslint", // Disables ESLint rules from @typescript-eslint/eslint-plugin that conflict with Prettier
                "plugin:prettier/recommended", // Enables eslint-plugin-prettier and eslint-config-prettier - ensure this is always last in the extends array
            ],
            rules: {
                "no-underscore-dangle": "off",
                "@typescript-eslint/naming-convention": "warn",
                "no-param-reassign": "off",
                "@typescript-eslint/no-explicit-any": "off",
                "@typescript-eslint/no-use-before-define": "warn",
                "@typescript-eslint/ban-ts-comment": "warn",
                "@typescript-eslint/explicit-module-boundary-types": "off",
                "@typescript-eslint/no-unused-vars": [0],
                // @typescript-eslint/recommended-requiring-type-checking rules which require large refactor
                // START BLOCK
                "@typescript-eslint/no-unsafe-assignment": "off", // Approximately 1100 instances
                "@typescript-eslint/no-unsafe-member-access": "off", // Approximately 700 instances
                "@typescript-eslint/no-unsafe-call": "off", // Approximately 500 instances
                "@typescript-eslint/restrict-template-expressions": "off", // Approximately 350 instances
                "@typescript-eslint/no-unsafe-return": "off", // Approximately 70 instances
                "@typescript-eslint/unbound-method": "off", // Apollo createTestClient unhappy with this switched on
                // END BLOCK
                "eslint-comments/no-unused-disable": "error",
                "max-classes-per-file": "off",
            },
        },
    ],
};
