# Package tests

To make sure the build packages expose the endpoint we expected it to, we run a few tests
on the production package.

These tests needs to be setup before they're run, so you run them from the `packages/graphql` dir.

```bash
cd packages/graphql
npm run test:builds
```

This script will create a npm package, move it into `packages/package-tests` (so it doesn't have
the devDependencies from `@neo4j/graphql` in scope), unpack it and run tests on it in different environments and setups.  
It should cleanup after itself.

NOTE: These tests do **not** run when `lerna run test` is executed, because these are not
tests that needds to be run in development. They should run on PR:s and before releases though.
