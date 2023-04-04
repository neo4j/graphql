# @neo4j/cypher-builder

## 0.3.0

### Minor Changes

-   [#3025](https://github.com/neo4j/graphql/pull/3025) [`507f9f7ff`](https://github.com/neo4j/graphql/commit/507f9f7ff5a57ff42f6554b21c2eff0cf37c10ba) Thanks [@angrykoala](https://github.com/angrykoala)! - CallProcedure clause deprecated and improvements on Procedures API

### Patch Changes

-   [#3012](https://github.com/neo4j/graphql/pull/3012) [`cdbf0c1fe`](https://github.com/neo4j/graphql/commit/cdbf0c1fed34e5c39c8697410e13b338498f7520) Thanks [@angrykoala](https://github.com/angrykoala)! - Add support for USE in CypherBuilder

-   [#2984](https://github.com/neo4j/graphql/pull/2984) [`084e0e036`](https://github.com/neo4j/graphql/commit/084e0e036ea05091db9082cae227b55a55157109) Thanks [@angrykoala](https://github.com/angrykoala)! - Support for path variables over patterns

-   [#3008](https://github.com/neo4j/graphql/pull/3008) [`c4b9f120a`](https://github.com/neo4j/graphql/commit/c4b9f120ac2e22a6c9c1a34c920cb1ddf88fa45d) Thanks [@angrykoala](https://github.com/angrykoala)! - Adds support for DISTINCT in aggregation functions

## 0.2.1

### Patch Changes

-   [#2868](https://github.com/neo4j/graphql/pull/2868) [`c436ab040`](https://github.com/neo4j/graphql/commit/c436ab0403a45395594728e6fc192034712f45af) Thanks [@angrykoala](https://github.com/angrykoala)! - Add timezone parameter to temporal functions

-   [#2884](https://github.com/neo4j/graphql/pull/2884) [`1a2101c33`](https://github.com/neo4j/graphql/commit/1a2101c33d00a738be26c57fa378d4a9e3bede41) Thanks [@darrellwarde](https://github.com/darrellwarde)! - Add `id()` and `elementId()` functions

## 0.2.0

### Minor Changes

-   [#2855](https://github.com/neo4j/graphql/pull/2855) [`d4455881c`](https://github.com/neo4j/graphql/commit/d4455881c83f9ec597e657d92b9c9c126721541b) Thanks [@angrykoala](https://github.com/angrykoala)! - Support for patterns with multiple relationships and variable-length patterns

### Patch Changes

-   [#2827](https://github.com/neo4j/graphql/pull/2827) [`81df28ed9`](https://github.com/neo4j/graphql/commit/81df28ed9238c1b4692aabe8e1de438ba01ae914) Thanks [@angrykoala](https://github.com/angrykoala)! - Add support for square brackets syntax on variable properties

-   [#2862](https://github.com/neo4j/graphql/pull/2862) [`4fdb5135f`](https://github.com/neo4j/graphql/commit/4fdb5135fa3bdb84b87893d14afe263ad5ed020f) Thanks [@angrykoala](https://github.com/angrykoala)! - Add XOR operation

## 0.1.10

### Patch Changes

-   [#2827](https://github.com/neo4j/graphql/pull/2827) [`81df28ed9`](https://github.com/neo4j/graphql/commit/81df28ed9238c1b4692aabe8e1de438ba01ae914) Thanks [@angrykoala](https://github.com/angrykoala)! - Add support for square brackets syntax on varaible properties

## 0.1.9

### Patch Changes

-   [#2678](https://github.com/neo4j/graphql/pull/2678) [`ddf51ccfe`](https://github.com/neo4j/graphql/commit/ddf51ccfeec896b64ee943e910e59ac4e2f62869) Thanks [@angrykoala](https://github.com/angrykoala)! - Fix variable name generation when reusing named params

## 0.1.8

### Patch Changes

-   [#2545](https://github.com/neo4j/graphql/pull/2545) [`2d2cb2e42`](https://github.com/neo4j/graphql/commit/2d2cb2e42dc0d495b944fa5a49abed8e4c0892e5) Thanks [@angrykoala](https://github.com/angrykoala)! - Support for UNWIND statement after CALL { ... }

## 0.1.7

### Patch Changes

-   [#2530](https://github.com/neo4j/graphql/pull/2530) [`c8c2d2d4d`](https://github.com/neo4j/graphql/commit/c8c2d2d4d4897adfd1afcd666bf9f46263dfab1f) Thanks [@MacondoExpress](https://github.com/MacondoExpress)! - Introduce ListIndex and add support to the square bracket notation.

## 0.1.6

### Patch Changes

-   [#2406](https://github.com/neo4j/graphql/pull/2406) [`150b64c04`](https://github.com/neo4j/graphql/commit/150b64c046dd511d29436b33d67770aed6217c8f) Thanks [@MacondoExpress](https://github.com/MacondoExpress)! - Apoc.util.validate is now invocable from CallProcedure

## 0.1.5

### Patch Changes

-   [#2427](https://github.com/neo4j/graphql/pull/2427) [`e23691152`](https://github.com/neo4j/graphql/commit/e23691152db927d03891c592a716ca41e58d5f47) Thanks [@angrykoala](https://github.com/angrykoala)! - Add string functions and expose Function class for arbitrary functions

-   [#2429](https://github.com/neo4j/graphql/pull/2429) [`4c79ec3cf`](https://github.com/neo4j/graphql/commit/4c79ec3cf29ea7f0cd0e5fc18f98e65c221af8e5) Thanks [@angrykoala](https://github.com/angrykoala)! - Add reduce function

## 0.1.4

### Patch Changes

-   [#2345](https://github.com/neo4j/graphql/pull/2345) [`94b6cea4f`](https://github.com/neo4j/graphql/commit/94b6cea4f26b90523fed59d0b22cbac25461a71c) Thanks [@angrykoala](https://github.com/angrykoala)! - Remove dependencies on nodejs utils

## 0.1.3

### Patch Changes

-   [#2115](https://github.com/neo4j/graphql/pull/2115) [`7aff0cf19`](https://github.com/neo4j/graphql/commit/7aff0cf194010c8268024917abec931d9ba2c359) Thanks [@MacondoExpress](https://github.com/MacondoExpress)! - Included List, date, localtime, localdatetime, time, randomUUID.
    It's possible now to set edge properties from the Merge clause.

## 0.1.2

### Patch Changes

-   [#2301](https://github.com/neo4j/graphql/pull/2301) [`42771f950`](https://github.com/neo4j/graphql/commit/42771f950badfc33e8babf07f85931ebd6018749) Thanks [@angrykoala](https://github.com/angrykoala)! - Fix indentation on apoc.fulltext

## 0.1.0

### Minor Changes

-   [#2247](https://github.com/neo4j/graphql/pull/2247) [`f37a58d5b`](https://github.com/neo4j/graphql/commit/f37a58d5b475dd3a12d36c7cb3205b0f60430f99) Thanks [@angrykoala](https://github.com/angrykoala)! - Cypher Builder package initial release
