const commaDangle = {
    arrays: "always-multiline",
    objects: "always-multiline",
    imports: "always-multiline",
    exports: "always-multiline",
    functions: "never",
};

module.exports = {
    extends: ["eslint:recommended", "plugin:eslint-comments/recommended", "plugin:import/recommended", "prettier"],
    root: true,
    env: {
        node: true,
        es2021: true,
    },
    rules: {
        "comma-dangle": ["error", commaDangle],
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
                "comma-dangle": "off",
                "@typescript-eslint/comma-dangle": [
                    "error",
                    {
                        ...commaDangle,
                        enums: "always-multiline",
                        generics: "always-multiline",
                        tuples: "never", // Removed due to conflict with prettier
                    },
                ],
                "@typescript-eslint/ban-ts-comment": ["error", { "ts-ignore": "allow-with-description" }],
                "@typescript-eslint/restrict-template-expressions": "off",
                "@typescript-eslint/no-explicit-any": "off",
                // The below are a project for when we pursue complete type safety
                "@typescript-eslint/no-unsafe-argument": "off",
                "@typescript-eslint/no-unsafe-assignment": "off",
                "@typescript-eslint/no-unsafe-call": "off",
                "@typescript-eslint/no-unsafe-member-access": "off",
                "@typescript-eslint/no-unsafe-return": "off",
                "@typescript-eslint/consistent-type-imports": [
                    "error",
                    {
                        prefer: "type-imports",
                    },
                ],
                "@typescript-eslint/no-unused-vars": ["error", { "ignoreRestSiblings": true }],
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
                "jest/expect-expect": ["warn", { assertFunctionNames: ["expect", "expectTypeOf"] }],
            },
        },
        {
            files: ["**/*.tsx"],
            extends: ["plugin:react/recommended", "plugin:react/jsx-runtime", "plugin:jsx-a11y/recommended"],
            plugins: ["simple-import-sort"],
            settings: {
                react: {
                    version: "detect",
                },
            },
            rules: {
                "simple-import-sort/imports": [
                    "error",
                    {
                        groups: [
                            // Matches any import statement that are 'react'
                            ["^react$"],

                            // Matches any import statement that starts with '@' followed by any word character
                            ["^@?\\w"],

                            // Matches any import statement that starts with a dot, but not when it is followed by a forward slash (i.e., not a relative import), and not when it is followed by nothing (i.e., not an absolute import). Also matches import statements that start with two dots, followed by either nothing or a forward slash (i.e., a relative parent import).
                            ["^\\.(?!/?$)", "^\\.\\./?$"],

                            // Side effect imports.
                            ["^\\u0000"],
                        ],
                    },
                ],
            },
        },
    ],
};
