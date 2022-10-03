# @neo4j/graphql

## 3.9.0

### Minor Changes

-   [#2099](https://github.com/neo4j/graphql/pull/2099) [`0c89c88ae`](https://github.com/neo4j/graphql/commit/0c89c88ae25bb6c06edac4adff43b47802f45ea1) Thanks [@a-alle](https://github.com/a-alle)! - Allows combining filters with AND/OR when subscribing to events.

-   [#2025](https://github.com/neo4j/graphql/pull/2025) [`fb1e2c93f`](https://github.com/neo4j/graphql/commit/fb1e2c93f41adeaa61cc458f20a5812472ed3e2c) Thanks [@a-alle](https://github.com/a-alle)! - Add support for @exclude directive on subscription operations

### Patch Changes

-   [#2105](https://github.com/neo4j/graphql/pull/2105) [`28742a5bd`](https://github.com/neo4j/graphql/commit/28742a5bd77b21497300248d18ff23206e1ec66f) Thanks [@a-alle](https://github.com/a-alle)! - Fix on `@cypher` directive fields in connections

## 3.8.0

### Minor Changes

-   [#2081](https://github.com/neo4j/graphql/pull/2081) [`e978b185f`](https://github.com/neo4j/graphql/commit/e978b185f1d0fe4ec7bd75ecbaa03a5216105a14) Thanks [@darrellwarde](https://github.com/darrellwarde)! - Allow `@fulltext` directive to specify `ID` fields

-   [#1972](https://github.com/neo4j/graphql/pull/1972) [`a965bd861`](https://github.com/neo4j/graphql/commit/a965bd861bef0fab93480705ac4f011f1f6c534f) Thanks [@a-alle](https://github.com/a-alle)! - Add more filtering options on subscriptions

-   [#1822](https://github.com/neo4j/graphql/pull/1822) [`1d90a5252`](https://github.com/neo4j/graphql/commit/1d90a5252abf724fc91b92fe3a86ee69c0ab26bb) Thanks [@MacondoExpress](https://github.com/MacondoExpress)! - Adds database version detection so that Cypher can be generated in a dynamic manner. Uses this new logic to switch between `point.distance()` and `distance()` as needed. This PR also switches over to use the Cypher index management API.

### Patch Changes

-   [#1986](https://github.com/neo4j/graphql/pull/1986) [`f958503e0`](https://github.com/neo4j/graphql/commit/f958503e059fcfabc46628fd651914e08d29b998) Thanks [@tbwiss](https://github.com/tbwiss)! - fix: Sum aggregate on where unexpected behaviour (#1933)

-   [#2053](https://github.com/neo4j/graphql/pull/2053) [`2abb6036f`](https://github.com/neo4j/graphql/commit/2abb6036f267ba0c1310f36e3a7882948800ae05) Thanks [@angrykoala](https://github.com/angrykoala)! - Remove apoc.cypher.runFirstColumnSingle from connections projections

-   [#2023](https://github.com/neo4j/graphql/pull/2023) [`a037e34a9`](https://github.com/neo4j/graphql/commit/a037e34a9bb1f8eff07992e0d08b9c0fbf5f5a11) Thanks [@litewarp](https://github.com/litewarp)! - fix: nested relation error with interface query

-   [#2009](https://github.com/neo4j/graphql/pull/2009) [`8260fb845`](https://github.com/neo4j/graphql/commit/8260fb845aced51dbf90425870b766210c96a22c) Thanks [@angrykoala](https://github.com/angrykoala)! - Fix nested interface projections

-   [#2065](https://github.com/neo4j/graphql/pull/2065) [`99a7f707a`](https://github.com/neo4j/graphql/commit/99a7f707ad4afd2ef1613e8218de713836d165f3) Thanks [@darrellwarde](https://github.com/darrellwarde)! - fix: multiple nodes created if following connection of multiple interface relationships

-   [#2014](https://github.com/neo4j/graphql/pull/2014) [`66c040179`](https://github.com/neo4j/graphql/commit/66c0401791e9fc0182a2e5c271bff11bd05f5fef) Thanks [@mjfwebb](https://github.com/mjfwebb)! - refactor: fix linting errors and add types

-   [#2002](https://github.com/neo4j/graphql/pull/2002) [`1ceb09860`](https://github.com/neo4j/graphql/commit/1ceb09860e256ea5f7bebe4797c31045d3ca9ece) Thanks [@tbwiss](https://github.com/tbwiss)! - fix: Remove "Math.floor(Math.random() \* Math.random())" from integration tests

-   [#2062](https://github.com/neo4j/graphql/pull/2062) [`972a06c83`](https://github.com/neo4j/graphql/commit/972a06c83db82bbef49c56f861d07ff688b99cb5) Thanks [@darrellwarde](https://github.com/darrellwarde)! - fix: there will no longer be a Cypher syntax error when selecting interface relationship fields following the creation of multiple nodes

## 3.7.0

### Minor Changes

-   [#1925](https://github.com/neo4j/graphql/pull/1925) [`1c589e246`](https://github.com/neo4j/graphql/commit/1c589e246f0ce9ffe82c5e7612deb4e7bac7c6e1) Thanks [@tbwiss](https://github.com/tbwiss)! - feat: Adding the functionality to enable global authentication via a setting in the Auth plugin

### Patch Changes

-   [#1918](https://github.com/neo4j/graphql/pull/1918) [`957da9430`](https://github.com/neo4j/graphql/commit/957da943008508b43e996efea0c7fa0fe7c08495) Thanks [@angrykoala](https://github.com/angrykoala)! - Refactor Cypher projections on relationships to subqueries

*   [#1968](https://github.com/neo4j/graphql/pull/1968) [`4e6a38799`](https://github.com/neo4j/graphql/commit/4e6a38799a470bc9846b3800e3abbdd508a88e38) Thanks [@angrykoala](https://github.com/angrykoala)! - Unpin peer dependencies to support a wider range of versions

-   [#1954](https://github.com/neo4j/graphql/pull/1954) [`31c287458`](https://github.com/neo4j/graphql/commit/31c2874588842501636fd754fe18bbc648e4e849) Thanks [@angrykoala](https://github.com/angrykoala)! - Performance improvement on \_SINGLE operations

*   [#1939](https://github.com/neo4j/graphql/pull/1939) [`37a77f97c`](https://github.com/neo4j/graphql/commit/37a77f97cab35edf2ab0a09cb49800564ac99e6f) Thanks [@angrykoala](https://github.com/angrykoala)! - Performance improvement in nested relationship operations \_SOME, \_ALL and \_NONE

-   [#1934](https://github.com/neo4j/graphql/pull/1934) [`8b6d0990b`](https://github.com/neo4j/graphql/commit/8b6d0990b04a985e06d9b9f880ddd86b75cd00d5) Thanks [@angrykoala](https://github.com/angrykoala)! - Remove apoc.coll.sortMulti

*   [#1955](https://github.com/neo4j/graphql/pull/1955) [`5955a6a36`](https://github.com/neo4j/graphql/commit/5955a6a363b0490916ca2765e457b01be751ad20) Thanks [@angrykoala](https://github.com/angrykoala)! - Fix label injection through unicode

## 3.6.3

### Patch Changes

-   [#1842](https://github.com/neo4j/graphql/pull/1842) [`037856af`](https://github.com/neo4j/graphql/commit/037856afc74e9739707cb5a92cb830edc24a43b1) Thanks [@MacondoExpress](https://github.com/MacondoExpress)! - Fix bug where callback fields were not included in the onCreate input type.

*   [#1919](https://github.com/neo4j/graphql/pull/1919) [`7e90ecfe`](https://github.com/neo4j/graphql/commit/7e90ecfed5a3cc61dda8d54d525c190842f0d1ef) Thanks [@tbwiss](https://github.com/tbwiss)! - fix: Support for Neo4j GraphQL Toolbox in Safari web browser

-   [#1926](https://github.com/neo4j/graphql/pull/1926) [`7affa891`](https://github.com/neo4j/graphql/commit/7affa8912e16bf3ebf27bd5460eb5c671f9b672a) Thanks [@angrykoala](https://github.com/angrykoala)! - Remove apoc.cypher.runFirstColumnSingle from point values projection

*   [#1882](https://github.com/neo4j/graphql/pull/1882) [`07109478`](https://github.com/neo4j/graphql/commit/07109478b0dbd7ca4cf99f31e720f09ea8ad77c2) Thanks [@tbwiss](https://github.com/tbwiss)! - fix: Pass the cypherParams from the top-level context to the translate functions.

-   [#1837](https://github.com/neo4j/graphql/pull/1837) [`07d2b61e`](https://github.com/neo4j/graphql/commit/07d2b61e35820def7c399b110a7bc99217f76e60) Thanks [@angrykoala](https://github.com/angrykoala)! - Fix nested filters on aggregations

*   [#1854](https://github.com/neo4j/graphql/pull/1854) [`d7870c31`](https://github.com/neo4j/graphql/commit/d7870c31faaa1e211236fac4e50714937f07ce22) Thanks [@darrellwarde](https://github.com/darrellwarde)! - Remove instances of `apoc.meta.type`, to reduce our Apoc footprint in the GraphQL Library.

## 3.6.2

### Patch Changes

-   [#1849](https://github.com/neo4j/graphql/pull/1849) [`68e44f53`](https://github.com/neo4j/graphql/commit/68e44f53672740780cd51d7985f15c85fd7def54) Thanks [@tbwiss](https://github.com/tbwiss)! - Fix: Cypher generation syntax error
    Generated cypher statement when executed produces a syntax error, requires white spaces between AND and variable name.

## 3.6.1

### Patch Changes

-   [#1796](https://github.com/neo4j/graphql/pull/1796) [`3c2d0658`](https://github.com/neo4j/graphql/commit/3c2d065889159dd4b5c37c24de58cd1b34869790) Thanks [@darrellwarde](https://github.com/darrellwarde)! - fix: move `ORDER BY`, `SKIP` and `LIMIT` to as early as possible in a Cypher query. This results in significant reduction in projecting related nodes which will be made redundant by a late `SKIP` and `LIMIT`.

*   [#1810](https://github.com/neo4j/graphql/pull/1810) [`fad52b51`](https://github.com/neo4j/graphql/commit/fad52b513d7835b0a01856c2882ab536df205252) Thanks [@angrykoala](https://github.com/angrykoala)! - Remove apoc.runFirstColumn from count projection to avoid database contention

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
