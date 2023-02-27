# @neo4j/graphql-plugin-auth

## 2.1.0

### Minor Changes

-   [#2359](https://github.com/neo4j/graphql/pull/2359) [`3fd44b3ef`](https://github.com/neo4j/graphql/commit/3fd44b3ef08d6eebec3cb1dd51111af8bf4e9fb2) Thanks [@farhadnowzari](https://github.com/farhadnowzari)! - - The `JwksEndpoint` in `Neo4jGraphQLAuthJWKSPlugin` now will accept a function as well which returns a computed endpoint.
    -   The `Secret` in `Neo4jGraphQLAuthJWTPlugin` now will accept a function as well which returns a computed secret.

## 2.0.0

### Major Changes

-   [#2710](https://github.com/neo4j/graphql/pull/2710) [`b081bec45`](https://github.com/neo4j/graphql/commit/b081bec4543abc3c66adf5588933632588cb0ce2) Thanks [@darrellwarde](https://github.com/darrellwarde)! - #2622 bumped the internal version of `jsonwebtoken`, which could cause some breaking changes in the authorization plugin.

## 1.1.1

### Patch Changes

-   [#2515](https://github.com/neo4j/graphql/pull/2515) [`1bec3f95d`](https://github.com/neo4j/graphql/commit/1bec3f95d0f469c2a4e879b1904a4d1a4938207e) Thanks [@darrellwarde](https://github.com/darrellwarde)! - Add `bindPredicate` which allows the predicate used to evaluate `bind` rules to be changed

## 1.1.0

### Minor Changes

-   [#1925](https://github.com/neo4j/graphql/pull/1925) [`1c589e246`](https://github.com/neo4j/graphql/commit/1c589e246f0ce9ffe82c5e7612deb4e7bac7c6e1) Thanks [@tbwiss](https://github.com/tbwiss)! - feat: Adding the functionality to enable global authentication via a setting in the Auth plugin
