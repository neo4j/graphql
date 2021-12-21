# Developing

## Prerequisites

### Node.js

[`nvm`](https://github.com/nvm-sh/nvm) is recommended for managing your Node.js
installation. We provide a `.nvmrc` file so when you have `nvm` install simply run
`nvm use` to switch to our currently recommended version of Node.js.

If you want to manually install Node.js, we recommend the current LTS version.

### Yarn

Once you have Node.js installed, you should globally install Yarn by running the
following:

```bash
npm install -g yarn
```

## Cloning the code

If you just want to snoop around, clone our repository using:

```bash
https://github.com/neo4j/graphql.git
```

If you want to make a contribution, fork our repository and perform a clone,
preferably over SSH:

```bash
git@github.com:USERNAME/graphql.git
```

You will then need to add our repository as an upstream:

```bash
git remote add upstream git@github.com:neo4j/graphql.git
```

You can then fetch and merge from the upstream to keep in sync.

## Getting started

After cloning the repository, simply run the following from the root to get up
and running:

```bash
yarn install
```

## Code editor

[Visual Studio Code](https://code.visualstudio.com/) comes highly recommended
for working in this repository, and we additionally recommend the following extensions:

* [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint)
* [Jest](https://marketplace.visualstudio.com/items?itemName=Orta.vscode-jest)
* [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)

The Jest extension should automatically detect the tests for this repository and
watch them in the Status Bar.

## Testing

### Testing locally

In order to run all of the tests, you will need to have a local instance of Neo4j
running! We highly recommend [Neo4j Desktop](https://neo4j.com/download/) to
easily get up and running with a local Neo4j instance.

1. Create and start a new DBMS with a database named neo4j (default).
2. Install APOC plugin for that DB.
3. Create appropriate user by running the following command in the DB:

    ```cypher
    CREATE USER admin
    SET PASSWORD "password"
    SET PASSWORD CHANGE NOT REQUIRED
    SET STATUS ACTIVE
    ```

4. Grant roles to admin user:

    ```cypher
    GRANT ROLE admin to admin
    ```

5. Run tests with `yarn test`.

Tests are run using Jest, which has been configured to allow for execution of
test suites at any level in the project.

You can execute tests with a different database, user and password with the
following command:

```bash
NEO_URL=neo4j://localhost:7687 NEO_USER=admin NEO_PASSWORD=password yarn test
```

The above command can additionally be run from `packages/graphql`, `packages/ogm`,
or any directory where there is a `jest.config.js` file!

Additionally, for projects which have the appropriate Yarn scripts setup, you can
run individual test suites. For instance, to run the TCK test suite of `@neo4j/graphql`,
run the following from `packages/graphql`:

```bash
yarn test:tck
```

### Testing using docker

```bash
npm run test-docker
```

## Linting/formatting

We use ESLint for linting and Prettier for code formatting. Contributions must
adhere to our linting and formatting rules.

## Adding a new project to the monorepo

For the sake of completeness, add an entry for the new project into the following
files in the root of the repository:

* `tsconfig.json` (`references` entry)
* `jest.config.base.js` (`moduleNameMapper` entry)

### Dependencies within the monorepo

Adding dependencies within the monorepo is a little bit tricky because of the
fact that we need to use uncompiled TypeScript code.

This section will contain a couple of example use cases, one for production
dependencies and one for test dependencies. They will use an example project
with name "project" in `packages/project`, and the dependency in question will
be `@neo4j/graphql`.

#### Production dependencies

First things first, install the dependency as you normally would:

```bash
yarn add @neo4j/graphql
```

Now, inside `packages/project/src/tsconfig.json`, this will need to look something
like:

```json
{
    "extends": "../../../tsconfig.base.json",
    "compilerOptions": {
        "baseUrl": "./",
        "outDir": "../dist",
        "paths": {
            "@neo4j/graphql": ["../../graphql/src"]
        }
    },
    "references": [{ "path": "../../graphql/src/tsconfig.json" }]
}
```

The real key entries here are:

* `baseUrl` - for all of the relative references in this file, this will tell
`tsc` where to start from
* `paths` - this will translate `import` statements in code to the relative dependency
* `references` - gives TypeScript "permission" to accesss the projects at these paths

Finally, it is highly likely that Jest will also need access to this internal
dependency, so `packages/project/jest.config.js` will need to look like:

```js
const globalConf = require("../../jest.config.base");

module.exports = {
    ...globalConf,
    displayName: "@neo4j/graphql-project",
    roots: ["<rootDir>/packages/project/src", "<rootDir>/packages/project/tests"],
    coverageDirectory: "<rootDir>/packages/project/coverage/",
    globals: {
        "ts-jest": {
            tsconfig: "<rootDir>/packages/project/src/tsconfig.json",
        },
    },
};
```

The magic sauce here is `globals/ts-jest/tsconfig`, which tells Jest which
TypeScript configuration to use.

#### Test dependencies

Let's say you just need an internal dependency for testing purposes. You would
install this as a dev dependency:

```bash
yarn add --dev @neo4j/graphql
```

You then need to follow the steps above, but using `packages/project/tests/tsconfig.json`
instead of the production `tsconfig.json` file.
