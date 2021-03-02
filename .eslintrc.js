module.exports = {
    root: true,
    plugins: ["import", "prettier"],
    extends: ["airbnb/base", "prettier"],
    env: {
        node: true,
        jest: true,
    },
    rules: {
        "no-underscore-dangle": "off",
        "no-param-reassign": "off",
        "prettier/prettier": [
            "error",
            {
                endOfLine: "auto",
            },
        ],
        "import/extensions": [
            "error",
            "ignorePackages",
            {
                ts: "never",
            },
        ],
        "import/prefer-default-export": [0],
        "prefer-destructuring": "off",
    },
    overrides: [
        {
            files: ["**/*.ts"],
            parser: "@typescript-eslint/parser",
            parserOptions: {
                tsconfigRootDir: __dirname,
                project: "./packages/**/tsconfig.json",
            },
            plugins: ["import", "prettier", "@typescript-eslint"],
            extends: [
                "airbnb-typescript/base",
                "plugin:@typescript-eslint/recommended",
                "plugin:@typescript-eslint/recommended-requiring-type-checking",
                "prettier",
                "prettier/@typescript-eslint",
            ],
            rules: {
                "no-underscore-dangle": "off",
                "@typescript-eslint/naming-convention": "off",
                "no-param-reassign": "off",
                "@typescript-eslint/no-explicit-any": "off",
                "@typescript-eslint/no-use-before-define": "off",
                "@typescript-eslint/ban-ts-comment": "off",
                "@typescript-eslint/explicit-module-boundary-types": "off",
                "@typescript-eslint/no-unused-vars": [0],
                "prettier/prettier": [
                    "error",
                    {
                        endOfLine: "auto",
                    },
                ],
                "import/extensions": [
                    "error",
                    "ignorePackages",
                    {
                        ts: "never",
                    },
                ],
                "import/prefer-default-export": [0],
                "prefer-destructuring": "off",
                // Below to silence @typescript-eslint/recommended-requiring-type-checking
                // Approximately 1100 instances
                "@typescript-eslint/no-unsafe-assignment": "off",
                // Approximately 700 instances
                "@typescript-eslint/no-unsafe-member-access": "off",
                // Approximately 500 instances
                "@typescript-eslint/no-unsafe-call": "off",
                // Approximately 350 instances
                "@typescript-eslint/restrict-template-expressions": "off",
                // Approximately 70 instances
                "@typescript-eslint/no-unsafe-return": "off",
                // Below to be refactored in next commit
                "@typescript-eslint/no-floating-promises": "warn",
                "@typescript-eslint/unbound-method": "warn",
                "@typescript-eslint/restrict-plus-operands": "warn",
                "@typescript-eslint/require-await": "warn",
                "@typescript-eslint/await-thenable": "warn",
                "@typescript-eslint/prefer-regexp-exec": "warn",
            },
            settings: {
                "import/resolver": {
                    node: {
                        extensions: [".ts"],
                    },
                },
                "import/extensions": [".ts"],
            },
        },
    ],
};
