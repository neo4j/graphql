# @neo4j/graphql

## 3.6.0

### Minor Changes

-   [#1619](https://github.com/neo4j/graphql/pull/1619) [`0a49f56d`](https://github.com/neo4j/graphql/commit/0a49f56dbd45eb3ca69ceafce4ed308cdc1d6e90) Thanks [@mjfwebb](https://github.com/mjfwebb)! - Feat: Array methods pop and push

*   [#1773](https://github.com/neo4j/graphql/pull/1773) [`381c4061`](https://github.com/neo4j/graphql/commit/381c40610766f9eb6c938ddba424e44e3382f103) Thanks [@MacondoExpress](https://github.com/MacondoExpress)! - Comparators `LT`, `LTE`, `GT`, and `GTE` now are included for string fields.
    Add `features` option to `Neo4jGraphQLConfig`, which allows to enable, disable or configure specific features.

### Patch Changes

-   [#1778](https://github.com/neo4j/graphql/pull/1778) [`4c8098f4`](https://github.com/neo4j/graphql/commit/4c8098f428937b7bd6bf3d29abb778618c7b030c) Thanks [@darrellwarde](https://github.com/darrellwarde)! - fixed: Aggregation column contains implicit grouping expressions

*   [#1781](https://github.com/neo4j/graphql/pull/1781) [`36ebee06`](https://github.com/neo4j/graphql/commit/36ebee06352f5edbbd3748f818b8c0a7c5262681) Thanks [@darrellwarde](https://github.com/darrellwarde)! - fix: always specify a default database to avoid round-trip requests for routing table

-   [#1757](https://github.com/neo4j/graphql/pull/1757) [`ba713faf`](https://github.com/neo4j/graphql/commit/ba713faf7da05c6f9031c83542dbc51bc1a0239e) Thanks [@angrykoala](https://github.com/angrykoala)! - Fix connection projection for nodes with zero relationships

*   [#1738](https://github.com/neo4j/graphql/pull/1738) [`801cdaea`](https://github.com/neo4j/graphql/commit/801cdaea608e83fa3ba9fffb56b4f93db88d149a) Thanks [@litewarp](https://github.com/litewarp)! - fixed: cannot query Cypher fields on root connections when sort is not provided as an argument

-   [#1747](https://github.com/neo4j/graphql/pull/1747) [`21a0c58c`](https://github.com/neo4j/graphql/commit/21a0c58c85c8368c70c6a83a428f0c20231557b4) Thanks [@tbwiss](https://github.com/tbwiss)! - fix: Invalid Cypher generated for connection predicates

*   [#1770](https://github.com/neo4j/graphql/pull/1770) [`4d62eea7`](https://github.com/neo4j/graphql/commit/4d62eea78fe4a2d72805697a0adcb0b21625e87e) Thanks [@angrykoala](https://github.com/angrykoala)! - Fix nested connection filters using SINGLE and SOME
    Fix implicit and parameters missing in connection where

-   [#1780](https://github.com/neo4j/graphql/pull/1780) [`28ffcf88`](https://github.com/neo4j/graphql/commit/28ffcf88d0b5026eb2f3cce756b762fc9d025811) Thanks [@darrellwarde](https://github.com/darrellwarde)! - fixed: an EXISTS clause is used in a RETURN clause where it is not valid

*   [#1723](https://github.com/neo4j/graphql/pull/1723) [`0f52cf7e`](https://github.com/neo4j/graphql/commit/0f52cf7e360da1c9e68a8d63c81f1c35a66679f4) Thanks [@tbwiss](https://github.com/tbwiss)! - Fix: Simple connection query with `totalCount` fails.

-   [#1789](https://github.com/neo4j/graphql/pull/1789) [`52f755b0`](https://github.com/neo4j/graphql/commit/52f755b0a5ecda6f8356a61e83591c7c00b1e30e) Thanks [@darrellwarde](https://github.com/darrellwarde)! - fix: structure of CASE statements not in line with best practice

*   [#1743](https://github.com/neo4j/graphql/pull/1743) [`1c7987b5`](https://github.com/neo4j/graphql/commit/1c7987b51b10fed565d92e9d74256f986800c2cf) Thanks [@darrellwarde](https://github.com/darrellwarde)! - fixed: redundant check against non-existent parameter when querying interface connection using `_on`

-   [#1724](https://github.com/neo4j/graphql/pull/1724) [`de4756ca`](https://github.com/neo4j/graphql/commit/de4756caa7b5d6baad4ea549e7a7652dabfa89fc) Thanks [@tbwiss](https://github.com/tbwiss)! - Fix: Filtering using connection fields could fail

## 3.5.1

### Patch Changes

-   30af948c: Update Cypher execution functionality so that transaction functions are used when executing using either a driver or a session.
