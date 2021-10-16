# Developing

## Prerequisites

### Node.js

Node.js version 14.16.0 is required at the time of writing. [`nvm`](https://github.com/nvm-sh/nvm) is recommended for managing your Node.js installation, and we provide a `.nvmrc` file to aid you in installing and using the correct version of Node.js.

### Yarn

Once you have Node.js installed, you should globally install Yarn by running the following:

```bash
npm install -g yarn
```

## Cloning the code

If you just want to snoop around, clone our repository using:

```bash
https://github.com/neo4j/graphql.git
```

If you want to make a contribution, fork our repository and perform a clone, preferably over SSH:

```bash
git@github.com:USERNAME/graphql.git
```

You will then need to add our repository as an upstream:

```bash
git add remote upstream git@github.com/neo4j/graphql.git
```

You can then fetch and merge from the upstream to keep in sync.

## Getting started

After cloning the repository, simply run the following from the root to get up and running:

```bash
yarn install
```

## Code editor

[Visual Studio Code](https://code.visualstudio.com/) comes highly recommended for working in this repository, and we additionally recommend the following extensions:

- [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint)
- [Jest](https://marketplace.visualstudio.com/items?itemName=Orta.vscode-jest)
- [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)

The Jest extension should automatically detect the tests for this repository and watch them in the Status Bar.

## Testing

In order to run all of the tests, you will need to have a local instance of Neo4j running! We highly recommend [Neo4j Desktop](https://neo4j.com/download/) to easily get up and running with a local Neo4j instance. For quicker setup, you can use [Docker and Docker-compose](https://docs.docker.com/get-docker/)

### Neo4j Database Setup Option 1: Neo4j Desktop

1. Install [Neo4j Desktop](https://neo4j.com/download/)

2. Create and start a new DBMS with a database named neo4j (default).

3. Install APOC plugin for that DB.

4. Create appropriate user by running the following command in the DB:

   ```cypher
   CREATE USER admin
   SET PASSWORD "password"
   SET PASSWORD CHANGE NOT REQUIRED
   SET STATUS ACTIVE
   ```

5. Grant roles to admin user:

   ```cypher
   GRANT ROLE admin to admin
   ```

### Neo4j Database Setup Option 1: Docker & Docker Compose

1. Install [Docker and Docker-compose](https://docs.docker.com/get-docker/)

2. Run `docker-compose up` in the root directory. Wait for `Remote interface available at http://localhost:7474/`

3. Run tests with `NEO_URL=bolt://localhost:7687 NEO_USER=neo4j NEO_PASSWORD=INSECURE yarn test`

### Running Tests with Jest

1. Run tests with `yarn test`.

Tests are run using Jest, which has been configured to allow for execution of test suites at any level in the project.

You can execute tests with a different database, user and password with the following command:

```bash
NEO_URL=neo4j://localhost:7687 NEO_USER=admin NEO_PASSWORD=password yarn test
```

The above command can additionally be run from `packages/graphql`, `packages/ogm`, or any directory where there is a `jest.config.js` file!

Additionally, for projects which have the appropriate Yarn scripts setup, you can run individual test suites. For instance, to run the TCK test suite of `@neo4j/graphql`, run the following from `packages/graphql`:

```bash
yarn test:tck
```

## Linting/formatting

We use ESLint for linting and Prettier for code formatting. Contributions must adhere to our linting and formatting rules.
