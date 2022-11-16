# @neo4j/graphql

## 3.12.1

### Patch Changes

-   [#2370](https://github.com/neo4j/graphql/pull/2370) [`d71ddb54d`](https://github.com/neo4j/graphql/commit/d71ddb54d811e280357bd37270b9f5cae0c600aa) Thanks [@angrykoala](https://github.com/angrykoala)! - Speeds up schema generation in getSchema

-   [#2338](https://github.com/neo4j/graphql/pull/2338) [`35bbf3197`](https://github.com/neo4j/graphql/commit/35bbf3197ecd3ad576567189242036ac3ee07b57) Thanks [@darrellwarde](https://github.com/darrellwarde)! - Alias subquery return in UNWIND CREATE

-   [#2407](https://github.com/neo4j/graphql/pull/2407) [`f2a56c738`](https://github.com/neo4j/graphql/commit/f2a56c73854c60144ec2809b855cd52eb1288a43) Thanks [@MacondoExpress](https://github.com/MacondoExpress)! - Included enum in OnCreateInput types

-   [#2390](https://github.com/neo4j/graphql/pull/2390) [`d04699b50`](https://github.com/neo4j/graphql/commit/d04699b50f0dd50984ab6688743f4fe027d797a0) Thanks [@darrellwarde](https://github.com/darrellwarde)! - Allow SortDirection to be used in input type definitions

-   [#2339](https://github.com/neo4j/graphql/pull/2339) [`27dd34de7`](https://github.com/neo4j/graphql/commit/27dd34de7815824afa490667ce2484f017c823a3) Thanks [@Liam-Doodson](https://github.com/Liam-Doodson)! - Added deprecation warnings to old full-text inputs.

-   [#2360](https://github.com/neo4j/graphql/pull/2360) [`f2799750a`](https://github.com/neo4j/graphql/commit/f2799750a0a1aeaecaf9ead5295483e5205ada62) Thanks [@Liam-Doodson](https://github.com/Liam-Doodson)! - Fix deprecation directives carried on to generated fields and inputs

-   [#2371](https://github.com/neo4j/graphql/pull/2371) [`9d0859b59`](https://github.com/neo4j/graphql/commit/9d0859b596be29d0e64f6531e2bf0c17325b9a34) Thanks [@darrellwarde](https://github.com/darrellwarde)! - Remove redundant adding of resolvers to schema to improve performance

-   Updated dependencies [[`94b6cea4f`](https://github.com/neo4j/graphql/commit/94b6cea4f26b90523fed59d0b22cbac25461a71c)]:
    -   @neo4j/cypher-builder@0.1.4

## 3.12.0

### Minor Changes

-   [#2286](https://github.com/neo4j/graphql/pull/2286) [`8642d3d67`](https://github.com/neo4j/graphql/commit/8642d3d67882cda2a0e212bdcf4b56376d419509) Thanks [@Liam-Doodson](https://github.com/Liam-Doodson)! - Created a new top-level query for full-text indexes. Added the full-text score to the results of this new query and made it possible to filter, sort and paginate the results. Deprecated existing full-text queries.

-   [#2115](https://github.com/neo4j/graphql/pull/2115) [`3b06cafbc`](https://github.com/neo4j/graphql/commit/3b06cafbc9f8ac6bfe43997bdd8e9db784b3907b) Thanks [@MacondoExpress](https://github.com/MacondoExpress)! - Optimized batch creation, when possible, to improve performance when a large numbers of nodes are created in single mutation

### Patch Changes

-   [#2281](https://github.com/neo4j/graphql/pull/2281) [`0faef6f33`](https://github.com/neo4j/graphql/commit/0faef6f3330d70126817f6496556f5ad85611ad9) Thanks [@angrykoala](https://github.com/angrykoala)! - Add reconnect option in AMQP subscriptions plugin

-   Updated dependencies [[`7aff0cf19`](https://github.com/neo4j/graphql/commit/7aff0cf194010c8268024917abec931d9ba2c359)]:
    -   @neo4j/cypher-builder@0.1.3

## 3.11.1

### Patch Changes

-   [#2304](https://github.com/neo4j/graphql/pull/2304) [`2c6d986a1`](https://github.com/neo4j/graphql/commit/2c6d986a19061fd8bc7739a2dd4737e7828e20d0) Thanks [@angrykoala](https://github.com/angrykoala)! - Use @neo4j/cypher-builder for cypher generation

-   Updated dependencies [[`42771f950`](https://github.com/neo4j/graphql/commit/42771f950badfc33e8babf07f85931ebd6018749)]:
    -   @neo4j/cypher-builder@0.1.2

## 3.11.0

### Minor Changes

-   [#2220](https://github.com/neo4j/graphql/pull/2220) [`44fc500eb`](https://github.com/neo4j/graphql/commit/44fc500ebbaff3f8cdfcc676bd2ef8cad2fd58ec) Thanks [@Liam-Doodson](https://github.com/Liam-Doodson)! - Added the `@plural` directive and depreacted the `plural` argument of the `@node` directive.

-   [#2225](https://github.com/neo4j/graphql/pull/2225) [`b37376e38`](https://github.com/neo4j/graphql/commit/b37376e38e13ab2ed6f0e0eeb99f2d9f17161fd7) Thanks [@Liam-Doodson](https://github.com/Liam-Doodson)! - Added the `@customResolver` directive and deprecated the `@computed` directive.

-   [#2232](https://github.com/neo4j/graphql/pull/2232) [`94512c90e`](https://github.com/neo4j/graphql/commit/94512c90e5e37601a4d260f1153ac043639ceb6f) Thanks [@Liam-Doodson](https://github.com/Liam-Doodson)! - Added checks for custom resolvers for fields with the `@customResolver` directive.

-   [#2214](https://github.com/neo4j/graphql/pull/2214) [`4ee4d40ad`](https://github.com/neo4j/graphql/commit/4ee4d40ad5aca514ddc08091b2501bfa699294e9) Thanks [@Liam-Doodson](https://github.com/Liam-Doodson)! - Added the `@populatedBy` directive to replace the `@callback` directive and deprecated the `@callback` directive.

### Patch Changes

-   [#2268](https://github.com/neo4j/graphql/pull/2268) [`8eff620b9`](https://github.com/neo4j/graphql/commit/8eff620b93d86d544d4594b69c5058a9092347c0) Thanks [@angrykoala](https://github.com/angrykoala)! - Fix invalid nested results on sorted connections without edges #2262

-   [#2200](https://github.com/neo4j/graphql/pull/2200) [`c769933cb`](https://github.com/neo4j/graphql/commit/c769933cba76d16c4f14b2c18aaf5c47415b05d9) Thanks [@a-alle](https://github.com/a-alle)! - Throw an error when the same db property is being modified at once

-   [#2260](https://github.com/neo4j/graphql/pull/2260) [`5ce80724f`](https://github.com/neo4j/graphql/commit/5ce80724f4d45a38e5d4b5d0d369384a4599d51f) Thanks [@angrykoala](https://github.com/angrykoala)! - Fix invalid Cypher on nested update operations with interfaces

-   [#2252](https://github.com/neo4j/graphql/pull/2252) [`2c8f3ec37`](https://github.com/neo4j/graphql/commit/2c8f3ec37ce57f281972ddc107a9490392c482df) Thanks [@angrykoala](https://github.com/angrykoala)! - Fix nested update with subscriptions invalid Cypher

-   [#2274](https://github.com/neo4j/graphql/pull/2274) [`74e6fee11`](https://github.com/neo4j/graphql/commit/74e6fee119c8f0c7d30384422e722754411135b9) Thanks [@angrykoala](https://github.com/angrykoala)! - Fix ordering with nested interface fields #2267

-   [#2266](https://github.com/neo4j/graphql/pull/2266) [`e7bcf4f0b`](https://github.com/neo4j/graphql/commit/e7bcf4f0b69a75c10e0ee0a604fd35cab09fcfaf) Thanks [@angrykoala](https://github.com/angrykoala)! - Fix error of queries with mixed nested fields and cypher elements #2261

## 3.10.1

### Patch Changes

-   [#2207](https://github.com/neo4j/graphql/pull/2207) [`23467c469`](https://github.com/neo4j/graphql/commit/23467c4699287c9d33c0a1004db83ddb9e7e606a) Thanks [@angrykoala](https://github.com/angrykoala)! - Use lastBookmark instead of lastBookmarks to keep compatibility of neo4j-driver 4 in tests

## 3.10.0

### Minor Changes

-   [#2175](https://github.com/neo4j/graphql/pull/2175) [`7b8a73cbd`](https://github.com/neo4j/graphql/commit/7b8a73cbd3e6accaaa7d64daa35f25941a7022c1) Thanks [@Liam-Doodson](https://github.com/Liam-Doodson)! - Added extra where fields for custom scalars. For lists of custom scalars \_NOT, \_INCLUDES and \_NOT_INCLUDES are now supported. For a single value custom scalars \_NOT, \_IN and \_NOT_IN are now supported.

### Patch Changes

-   [#2183](https://github.com/neo4j/graphql/pull/2183) [`64b3d0777`](https://github.com/neo4j/graphql/commit/64b3d07776685400313603f57e274ad8e821968b) Thanks [@darrellwarde](https://github.com/darrellwarde)! - Fix invalid auth clauses for operations other than CONNECT or CREATE in `connectOrCreate`

-   [#2190](https://github.com/neo4j/graphql/pull/2190) [`cad28dd1f`](https://github.com/neo4j/graphql/commit/cad28dd1f2f92fccf713beee600d2234c7c9709b) Thanks [@angrykoala](https://github.com/angrykoala)! - Fix union types on custom cypher directives

-   [#2190](https://github.com/neo4j/graphql/pull/2190) [`cad28dd1f`](https://github.com/neo4j/graphql/commit/cad28dd1f2f92fccf713beee600d2234c7c9709b) Thanks [@angrykoala](https://github.com/angrykoala)! - Fix invalid WHERE clause after WITH in a CALL subquery

-   [#2180](https://github.com/neo4j/graphql/pull/2180) [`5a748dc32`](https://github.com/neo4j/graphql/commit/5a748dc326ff063a8d8db6c281d681a68b679ade) Thanks [@a-alle](https://github.com/a-alle)! - Fix sort priority order between edge and node sort fields in the same query

-   [#2196](https://github.com/neo4j/graphql/pull/2196) [`c4ced43c0`](https://github.com/neo4j/graphql/commit/c4ced43c01cdd0d86d60a68906c3e79d847c5394) Thanks [@angrykoala](https://github.com/angrykoala)! - Fix #2189: `@cypher` directive forcefuly omits empty fields

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
