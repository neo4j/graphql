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

-   [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint)
-   [Jest](https://marketplace.visualstudio.com/items?itemName=Orta.vscode-jest)
-   [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)

The Jest extension should automatically detect the tests for this repository and
watch them in the Status Bar.

## Testing

### Testing locally

In order to run all of the tests, you will need to have a local instance of Neo4j
running! We highly recommend [Neo4j Desktop](https://neo4j.com/download/) to
easily get up and running with a local Neo4j instance.

1. Create and start a new DBMS with a database named neo4j (default).
2. Install APOC plugin for that DB.
3. Run tests with `yarn test`.

**This might cause you errors with running the tests!**

We used to require an `admin` user to be created and further assigned permissions.
We have since settled for the default `neo4j` user, which already has the required permissions.

Tests are run using Jest, which has been configured to allow for execution of
test suites at any level in the project.

You can execute tests with a different database, user and password with the
following command:

```bash
NEO_URL=neo4j://localhost:7687 NEO_USER=neo4j NEO_PASSWORD=password yarn test
```

The above command can additionally be run from `packages/graphql`, `packages/ogm`,
or any directory where there is a `jest.config.js` file!

Alternatively, you can put these environment variables in a `.env` file in the
root of the repo which will automatically get picked up:

```env
NEO_URL=neo4j://localhost:7687
NEO_USER=neo4j
NEO_PASSWORD=password
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

### Performance

`packages/graphql` has several performance benchmarks built in. To run the benchmarks:

1. Go to `packages/graphql`
2. Run `yarn performance` (by default, Database Query Performance test will be run)

#### Database Query Performance

The Database query benchmarks will query translate several GraphQL queries and run the generated Cypher against a test dataset in Neo4j, measuring time and dbHits.

These will be run by default when executing `yarn performance`.

All `.graphql` files in `tests/performance/graphql` are part of the performance suite. To skip or run a test, append `_skip` or `_only` to the query, e.g.:

```graphql
query SimpleUnionQuery_only {
    users {
        name
        liked {
            ... on Person {
                name
            }
            ... on Movie {
                title
            }
        }
    }
}
```

**Saving metrics**
With the option `-u` a file `performance.json` will be generated, that can be used to compare metrics between runs. This is only available for database query benchmark.

**Running Cypher queries**

The performance tests can also run raw Cypher, to enable it, run `yarn performance --cypher`. Cypher queries must be located at `tests/performance/databaseQuery/cypher`. This allows for comparison between GraphQL and an alternative Cypher query.

**Generating markdown**

With the option `--markdown` the output will be formatted in markdown instead of the CLI. This is only available for database query benchmark.

#### Schema Generation

This benchmark runs the schema generation for a large GraphQL Schema and outputs the time that took to generate it. No database needed.

To execute this, run `yarn performance --schema`.

**Subgraph Schema**
Alternatively, the schema can be run ready for subgraph by executing `yarn performance --subgraph-schema`.

#### Translation

This benchmark will measure the time it takes to translate a certain GraphQL query (without hitting the database). All of the queries in the `graphql` folder will be used, along with the queries located in `translation/graphql` `_skip` and `_only` can be used to limit how many queries are run.

This can be run with `yarn performance --translation`

By default, each query will be translated 100 times, and the total time will be shown. With the option `--single` each query will only be run once. Note that this option makes the tests faster and logging easier but will yield less accurate results.

## Linting/formatting

We use ESLint for linting and Prettier for code formatting. Contributions must
adhere to our linting and formatting rules.

## Adding a new project to the monorepo

For the sake of completeness, add an entry for the new project into the following
files in the root of the repository:

-   `tsconfig.json` (`references` entry)
-   `jest.config.base.js` (`moduleNameMapper` entry)

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

-   `baseUrl` - for all of the relative references in this file, this will tell
    `tsc` where to start from
-   `paths` - this will translate `import` statements in code to the relative dependency
-   `references` - gives TypeScript "permission" to accesss the projects at these paths

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
