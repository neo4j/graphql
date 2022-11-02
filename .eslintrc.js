module.exports = {
    extends: ["eslint:recommended", "plugin:eslint-comments/recommended", "plugin:import/recommended", "prettier"],
    root: true,
    env: {
        node: true,
        es2021: true,
    },
    rules: {
        "eslint-comments/no-unused-disable": "error",
        // Expensive rules disabled below
        "import/default": "off",
        "import/namespace": "off",
        "import/no-named-as-default": "off",
        "import/no-named-as-default-member": "off",
    },
    overrides: [
        {
            files: ["**/*.ts", "**/*.tsx"],
            extends: [
                "plugin:@typescript-eslint/recommended",
                "plugin:@typescript-eslint/recommended-requiring-type-checking",
                "plugin:import/typescript",
            ],
            parser: "@typescript-eslint/parser",
            parserOptions: {
                tsconfigRootDir: __dirname,
                project: "./**/tsconfig.json",
            },
            rules: {
                "@typescript-eslint/ban-ts-comment": ["error", { "ts-ignore": "allow-with-description" }],
                "@typescript-eslint/restrict-template-expressions": "off",
                "@typescript-eslint/no-explicit-any": "off",
                // The below are a project for when we pursue complete type safety
                "@typescript-eslint/no-unsafe-argument": "off",
                "@typescript-eslint/no-unsafe-assignment": "off",
                "@typescript-eslint/no-unsafe-call": "off",
                "@typescript-eslint/no-unsafe-member-access": "off",
                "@typescript-eslint/no-unsafe-return": "off",
            },
            settings: {
                "import/resolver": {
                    typescript: {
                        project: "./**/tsconfig.json",
                    },
                },
            },
        },
        {
            files: ["jest.test-setup.js", "**/*.test.ts"],
            extends: ["plugin:jest/recommended", "plugin:jest/style"],
            rules: {
                "@typescript-eslint/no-unsafe-member-access": "off",
                "@typescript-eslint/ban-ts-comment": "off",
                "@typescript-eslint/no-unsafe-assignment": "off",
                "@typescript-eslint/no-explicit-any": "off",
                "jest/expect-expect": [ "warn", {"assertFunctionNames": [ "expect", "expectTypeOf" ]}],
            },
        },
        {
            files: ["**/*.tsx"],
            extends: ["plugin:react/recommended", "plugin:react/jsx-runtime", "plugin:jsx-a11y/recommended"],
            settings: {
                react: {
                    version: "detect",
                },
            },
        },
        {
            files: ["packages/graphql/src/translate/cypher-builder/**/*.ts"],
            rules: {
                "@typescript-eslint/no-empty-interface": "off",
            },
        },
    ],
};
