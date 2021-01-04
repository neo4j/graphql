# Contributing

We are pleased you want to contribute to `@neo4j/graphql` please find this as a document as a guide to developing in this library. If your stuck or think you haven't covered anything submit an issue.

## Getting Started

### Forking

First make a fork of the library. Once done clone your fork locally;

```
$ git clone https://github.com/MY_NAME/graphql.git
```

### Node

Please use the LTS version of Node; `14.15.3` as of writing.

### Installing

The library is part of a monorepo, at the root, run;

```
$ npm ci
```

> Lerna bootstrap will install all deps

### Linting

This library uses `eslint` with AirBnb style. Please use either use a IDE or format your code before submitting a PR. The recommend setup would be VSCode and Prettier.

### Typescript

The library uses typescript, although in a loose way, please use typings where appropriate while maintaining readability. Its fine to use `any` and `// @ts-ignore` although you could be questioned on it in a PR.

## Testing

### Unit

```
$ npm test:unit
```

### Integration

You need a neo4j instance Download and install [Neo4j Desktop](https://neo4j.com/developer/neo4j-desktop/), create a database & a user;

```cypher
CREATE USER admin
SET PASSWORD 'password' CHANGE NOT REQUIRED
SET STATUS ACTIVE
```

Then make your user an admin;

```cypher
GRANT ROLE admin TO admin
```

#### Specifying Neo4j

```

$ cross-env NEO_USER=admin NEO_PASSWORD=password NEO_URL=neo4j://localhost:7687/neo4j npm run test:int

```

### TCK

```

$ npm test:tck

```

### Package tests

To make sure the build packages expose the endpoint we expected it to, we run a few tests
on the production package.

```
$ npm run test:package-tests
```

This script will create a npm package, move it into `packages/package-tests` (so it doesn't have
the devDependencies from `@neo4j/graphql` in scope), unpack it and run tests on it in different environments and setups.  
It should cleanup after itself.

NOTE: These tests do **not** run when `lerna run test` is executed, because these are not
tests that need's to be run in development. They should run on PR:s and before releases though.

### Running a single test

Each test file contains one top-level describe;

```js
describe("myFile", () => {});
```

Each describe contains a `test` case;

```js
describe("myFile", () => {
    test("should predict BTC price", () => {
        expect(predict()).toEqual(100000000000);
    });
});
```

To run all the tests in the describe call;

```
$ npm run test -- -t "myFile"
```

To run only the prediction test call;

```
$ npm run test -- -t "myFile should predict BTC price"
```

## Pull Request

Please make a PR into mater branch of `neo4j/graphql`.
