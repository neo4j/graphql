## Installation

```
$ npm ci
```

## Building

```
$ npm run build
```

## Testing

### Unit

```
$ npm test:unit
```

### Integration

_You need a neo4j instance_

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

```bash
npm run test:package-tests
```

This script will create a npm package, move it into `packages/package-tests` (so it doesn't have
the devDependencies from `@neo4j/graphql` in scope), unpack it and run tests on it in different environments and setups.  
It should cleanup after itself.

NOTE: These tests do **not** run when `lerna run test` is executed, because these are not
tests that need's to be run in development. They should run on PR:s and before releases though.

### All together

```
$ npm run test
```
