# @neo4j/graphql

## 7.4.1

### Patch Changes

- [#6903](https://github.com/neo4j/graphql/pull/6903) [`9fb31f6`](https://github.com/neo4j/graphql/commit/9fb31f69143c1ba73c053564b803721b6eac1234) Thanks [@angrykoala](https://github.com/angrykoala)! - Add support for `@cypher` directive in relationship properties

    ```graphql
    type ActedIn @relationshipProperties {
        screenTimeHours: Float
            @cypher(
                statement: """
                RETURN this.screenTimeMinutes / 60 AS c
                """
                columnName: "c"
            )
        screenTimeMinutes: Int
    }
    ```

## 7.4.0

### Minor Changes

- [#6899](https://github.com/neo4j/graphql/pull/6899) [`f359c4d`](https://github.com/neo4j/graphql/commit/f359c4d7ac87983d51485b60b7970dd11be3207b) Thanks [@angrykoala](https://github.com/angrykoala)! - Add populatedByOperation field in context passed to populatedBy callbacks

### Patch Changes

- [#6920](https://github.com/neo4j/graphql/pull/6920) Thanks [@a-alle](https://github.com/a-alle)! - Fix logical filters in connection queries for aggregations

## 7.3.3

### Patch Changes

- [#6880](https://github.com/neo4j/graphql/pull/6880) [`6e0bd78`](https://github.com/neo4j/graphql/commit/6e0bd78ee9bfe2b6f56036f11e41e889fe33818b) Thanks [@angrykoala](https://github.com/angrykoala)! - Fix `@cypher` directive top level queries targetting an interface or union

## 7.3.2

### Patch Changes

- [#6830](https://github.com/neo4j/graphql/pull/6830) [`c3ec362`](https://github.com/neo4j/graphql/commit/c3ec362b290621e513018527f03643c4a4b9c160) Thanks [@angrykoala](https://github.com/angrykoala)! - Fix duplicate relationships on nested connect from union types

- [#6842](https://github.com/neo4j/graphql/pull/6842) [`7455804`](https://github.com/neo4j/graphql/commit/74558044a554350f67c244d6155e2b3248809ed3) Thanks [@angrykoala](https://github.com/angrykoala)! - Update peer depdency of neo4j-driver to cover version 5 and 6

## 7.3.1

### Patch Changes

- [#6811](https://github.com/neo4j/graphql/pull/6811) [`f821f53`](https://github.com/neo4j/graphql/commit/f821f533ba040c66ed0c58225742e3de2107a167) Thanks [@mjfwebb](https://github.com/mjfwebb)! - Add case insensitive support to Cypher filter

- [`4e90418`](https://github.com/neo4j/graphql/commit/4e90418e85977f28763198f41dd14f4d8593e878) Thanks [@angrykoala](https://github.com/angrykoala)! - Fix incorrect Cypher in authorization for create operations

- [#6779](https://github.com/neo4j/graphql/pull/6779) [`bdbb211`](https://github.com/neo4j/graphql/commit/bdbb211ca327b8405801dd483ad986b4d47d42c9) Thanks [@angrykoala](https://github.com/angrykoala)! - Duration parser changed to support ISO strings ending in T, for example: "P-238DT"

## 7.3.0

### Minor Changes

- [#6740](https://github.com/neo4j/graphql/pull/6740) [`5cdb2eb`](https://github.com/neo4j/graphql/commit/5cdb2eb6de4799a48feb26bd11f1bce171996dbf) Thanks [@luffy1727](https://github.com/luffy1727)! - Add the ability to specify transaction configuration. e.g. timeout

    ```js
    const transactionConfig = {
        timeout: 60 * 1000,
        metadata: {
            "my-very-own-metadata": "is very good!",
        },
    };

    const neoSchema = new Neo4jGraphQL({ typeDefs, driver });

    const server = new ApolloServer({
        schema: await neoSchema.getSchema(),
    });

    await startStandaloneServer(server, {
        context: async ({ req }) => ({ req, transaction: transactionConfig }),
    });
    ```

## 7.2.13

### Patch Changes

- [#6696](https://github.com/neo4j/graphql/pull/6696) [`858a98f`](https://github.com/neo4j/graphql/commit/858a98f93668599578c41acd542ca033c101f0dc) Thanks [@a-alle](https://github.com/a-alle)! - Fix update rules incorrectly applied on relationship creation and deletion

## 7.2.12

### Patch Changes

- [`e1e4dac`](https://github.com/neo4j/graphql/commit/e1e4dacd875be149b1d60d07a6dab6f9d0acd5a5) Thanks [@mjfwebb](https://github.com/mjfwebb)! - Fix a case where we were using .flatMap on an Iterable which works in node 22 but not in node 20. We currently support node 20.

- [#6679](https://github.com/neo4j/graphql/pull/6679) [`8fc6629`](https://github.com/neo4j/graphql/commit/8fc6629e37c31cfd05291415d807d338757576a0) Thanks [@angrykoala](https://github.com/angrykoala)! - Adds numeric and id resolvers to default fields, fixing nested int fields in `@cypher` fields

- [#6647](https://github.com/neo4j/graphql/pull/6647) [`c931a40`](https://github.com/neo4j/graphql/commit/c931a40143bf2f56764e23cfbdca891b1ccfeb2f) Thanks [@mjfwebb](https://github.com/mjfwebb)! - Fixes the case where Connection queries with `@limit` in the type would generate unnecessary cypher with extra node/edge projection.

- [`45ee01f`](https://github.com/neo4j/graphql/commit/45ee01f0863879f64dc166457e698fe8770d4a78) Thanks [@mjfwebb](https://github.com/mjfwebb)! - Fixed a case where selecting pageInfo on a connection would only return totalCount. It now correctly returns the full pageInfo object.

- [#6651](https://github.com/neo4j/graphql/pull/6651) [`005d83a`](https://github.com/neo4j/graphql/commit/005d83aa0cc6f47dbf37c883b92214276d5238c7) Thanks [@mjfwebb](https://github.com/mjfwebb)! - Update error messages where wording was grammatically incorrect

## 7.2.11

### Patch Changes

- [#6622](https://github.com/neo4j/graphql/pull/6622) [`3df1946`](https://github.com/neo4j/graphql/commit/3df1946b245d449beef535f25e8a887487e528e4) Thanks [@angrykoala](https://github.com/angrykoala)! - Fix incorrect Cypher with authorization filters combined with authorization directive in a create operation

## 7.2.10

### Patch Changes

- [#6594](https://github.com/neo4j/graphql/pull/6594) [`3825c8d`](https://github.com/neo4j/graphql/commit/3825c8dd5eeb3a5f1c7555c8894a64018252fb3f) Thanks [@angrykoala](https://github.com/angrykoala)! - Fix arguments on populatedBy callbacks

## 7.2.9

### Patch Changes

- [#6589](https://github.com/neo4j/graphql/pull/6589) [`8e25ca9`](https://github.com/neo4j/graphql/commit/8e25ca900b32355648879cbbc991b96ed2a8dac2) Thanks [@angrykoala](https://github.com/angrykoala)! - Fix regression on `@populatedBy` where nested create operations don't trigger callbacks

## 7.2.8

### Patch Changes

- [#6573](https://github.com/neo4j/graphql/pull/6573) [`33f906d`](https://github.com/neo4j/graphql/commit/33f906d1e6b99c86b449c17c9069670c0ff8e2b2) Thanks [@angrykoala](https://github.com/angrykoala)! - Fix populatedBy directive used in connect operations

## 7.2.7

### Patch Changes

- [#6555](https://github.com/neo4j/graphql/pull/6555) [`95fe716`](https://github.com/neo4j/graphql/commit/95fe716c982a936aec379f1b2a937e84a74c2219) Thanks [@angrykoala](https://github.com/angrykoala)! - Optimize connection queries without `totalCount` or `pageInfo` such as:

    ```graphql
    query {
        moviesConnection(first: 20, sort: [{ title: ASC }]) {
            edges {
                node {
                    title
                }
            }
        }
    }
    ```

    Will no longer calculate `totalCount` in the generated Cypher

- [#6554](https://github.com/neo4j/graphql/pull/6554) [`d3b7b59`](https://github.com/neo4j/graphql/commit/d3b7b599a31ffa0ceeacb86ab34a6a2a1967d256) Thanks [@angrykoala](https://github.com/angrykoala)! - Improved performance for Connection queries for cases when only `totalCount` is requested.

    ```graphql
    query {
        moviesConnection(where: { title: { eq: "Forrest Gump" } }) {
            totalCount
        }
    }
    ```

## 7.2.6

### Patch Changes

- [#6488](https://github.com/neo4j/graphql/pull/6488) [`0ba23dd`](https://github.com/neo4j/graphql/commit/0ba23dd997366d7569a4493452ad69018827ad39) Thanks [@angrykoala](https://github.com/angrykoala)! - Fix format of Time and spatial input types

## 7.2.5

### Patch Changes

- [#6511](https://github.com/neo4j/graphql/pull/6511) [`b880bb4`](https://github.com/neo4j/graphql/commit/b880bb4a68d2aa2185bd17e93ac30d72e5a13607) Thanks [@Liam-Doodson](https://github.com/Liam-Doodson)! - Removed graphql query from driver transaction metadata

## 7.2.4

### Patch Changes

- [#6506](https://github.com/neo4j/graphql/pull/6506) [`becd7af`](https://github.com/neo4j/graphql/commit/becd7af21db21d7f257e9d83692624a34867f72b) Thanks [@angrykoala](https://github.com/angrykoala)! - Fix `@cypher` directive filters when using interfaces

## 7.2.3

### Patch Changes

- [#6457](https://github.com/neo4j/graphql/pull/6457) [`cdb24c4`](https://github.com/neo4j/graphql/commit/cdb24c4dc7c6c798be7b5ec5b4353f82b0c81d7b) Thanks [@angrykoala](https://github.com/angrykoala)! - Fix Cypher error on nested update operations with authorization

## 7.2.2

### Patch Changes

- [#6446](https://github.com/neo4j/graphql/pull/6446) [`5ed0ac9`](https://github.com/neo4j/graphql/commit/5ed0ac90eb1b5aed73a3bae49600c775c7006c2b) Thanks [@MacondoExpress](https://github.com/MacondoExpress)! - Fixed mutation input type generation for enum and custom scalar list operations. The `push`, `pop`, and `set` operations in list mutation inputs for enums and custom scalars are now correctly marked as optional instead of required.

## 7.2.1

### Patch Changes

- [#6389](https://github.com/neo4j/graphql/pull/6389) [`5d74c3e`](https://github.com/neo4j/graphql/commit/5d74c3e0f5890d4cf02e68db5c73c72a0eb3e6c1) Thanks [@MacondoExpress](https://github.com/MacondoExpress)! - The Authorization validation has moved to use the procedure `apoc.util.validate` outside filtering to avoid flakiness caused by the order of evaluation in Cypher.

## 7.2.0

### Minor Changes

- [#6250](https://github.com/neo4j/graphql/pull/6250) [`1abc5bc`](https://github.com/neo4j/graphql/commit/1abc5bc962a6d0ff0726293bbc4c71128985fe4c) Thanks [@angrykoala](https://github.com/angrykoala)! - Add support for case insensitive string filters. These can be enabled with the option `CASE_INSENSITIVE` in features:

    ```javascript
    const neoSchema = new Neo4jGraphQL({
        features: {
            filters: {
                String: {
                    CASE_INSENSITIVE: true,
                },
            },
        },
    });
    ```

    This enables the field `caseInsensitive` on string filters:

    ```graphql
    query {
        movies(where: { title: { caseInsensitive: { eq: "the matrix" } } }) {
            title
        }
    }
    ```

    This generates the following Cypher:

    ```cypher
    MATCH (this:Movie)
    WHERE toLower(this.title) = toLower($param0)
    RETURN this { .title } AS this
    ```

### Patch Changes

- [#6354](https://github.com/neo4j/graphql/pull/6354) [`76c6445`](https://github.com/neo4j/graphql/commit/76c6445be4ce1afa5ae3d3606247d28f4f02e256) Thanks [@angrykoala](https://github.com/angrykoala)! - Handle the following errors in CDC queries for subscription by resetting the cursor:
    - 52N27
    - 52N28
    - 52N30

- [#6354](https://github.com/neo4j/graphql/pull/6354) [`532e0d8`](https://github.com/neo4j/graphql/commit/532e0d81143e197d184c9e5ee241ae2cb4c4b880) Thanks [@angrykoala](https://github.com/angrykoala)! - Update CDC changeID if no events are returned to prevent a stale cursor

## 7.1.3

### Patch Changes

- [#6332](https://github.com/neo4j/graphql/pull/6332) [`b6ebd3a`](https://github.com/neo4j/graphql/commit/b6ebd3a022d536805cff3120068f249b16384dbb) Thanks [@angrykoala](https://github.com/angrykoala)! - Handles more errors for stale CDC cursors on subscriptions

## 7.1.2

### Patch Changes

- [#6321](https://github.com/neo4j/graphql/pull/6321) [`c6f3832`](https://github.com/neo4j/graphql/commit/c6f38323cfede60b91e0a122efe48ab0f0013507) Thanks [@angrykoala](https://github.com/angrykoala)! - Fix option "disableRelationshipTypeEscaping" not being applied on some mutations

## 7.1.1

### Patch Changes

- [#6243](https://github.com/neo4j/graphql/pull/6243) [`8d4c5c6`](https://github.com/neo4j/graphql/commit/8d4c5c6d32cb4741dd5480c3122eaec409c6b47c) Thanks [@angrykoala](https://github.com/angrykoala)! - Handles Neo4j error "52N29" on CDC polling by refreshing the cursor. This error could be triggered in some cases by an outdated cursor.

## 7.1.0

### Minor Changes

- [#6199](https://github.com/neo4j/graphql/pull/6199) [`4404026`](https://github.com/neo4j/graphql/commit/4404026b88929cefbd92aef5fc05e333e11469d1) Thanks [@angrykoala](https://github.com/angrykoala)! - Add support for `@cypher` directive of fields targeting types that do not use the `@node` directive. For example:

    ```graphql
    type Movie @node {
        title: String
        id: String!
        link: Link!
            @cypher(
                statement: """
                MATCH(l:${Link})
                WHERE l.movieId=this.id
                RETURN l {.name, .url} as link
                """
                columnName: "link"
            )
    }

    type Link {
        movieId: String!
        url: String!
        name: String!
    }
    ```

### Patch Changes

- [#6223](https://github.com/neo4j/graphql/pull/6223) [`de2dcea`](https://github.com/neo4j/graphql/commit/de2dceaae81d736c21b76a24f8e25b592edfb802) Thanks [@angrykoala](https://github.com/angrykoala)! - Fix bug with `@populatedBy`. Callback wouldn't be triggered by nested create operations for relationship fields.

- [#6236](https://github.com/neo4j/graphql/pull/6236) [`1866286`](https://github.com/neo4j/graphql/commit/18662864afb0fb1e7858f02896e47a46c49447dc) Thanks [@angrykoala](https://github.com/angrykoala)! - Fix bug with some filters not properly working on subscriptions.

## 7.0.0

### Major Changes

- [#6153](https://github.com/neo4j/graphql/pull/6153) [`0779691`](https://github.com/neo4j/graphql/commit/0779691eb9eeb0b36df260d7366eabe20fb6ca37) Thanks [@angrykoala](https://github.com/angrykoala)! - Fails schema validation if a field with `@relationship` targets a type without `@node`.

    For example, the following schema will fail:

    ```graphql
    type Movie @node {
        someActors: [Actor!]! @relationship(type: "ACTED_IN", direction: OUT)
    }

    type Actor {
        name: String
    }
    ```

- [#5899](https://github.com/neo4j/graphql/pull/5899) [`7335d8f`](https://github.com/neo4j/graphql/commit/7335d8f416bbfa08feab0fe4983f89590f984e1c) Thanks [@darrellwarde](https://github.com/darrellwarde)! - Nested mutation operations now follow the relationship direction behaviour as defined in `queryDirection`

- [#6048](https://github.com/neo4j/graphql/pull/6048) [`c667618`](https://github.com/neo4j/graphql/commit/c667618ed90a0f645b8550711a7fad276ec57d01) Thanks [@darrellwarde](https://github.com/darrellwarde)! - Subscriptions are now an opt-in feature which can be enabled by using the `@subscription` directive on either schema or type.

    For example, to enable subscriptions for the whole schema (equivalent to before this breaking change):

    ```graphql
    type Movie @node {
        title: String!
    }

    extend schema @subscription
    ```

    To enable subscriptions just for the `Movie` type:

    ```graphql
    type Movie @node @subscription {
        title: String!
    }
    ```

- [#5997](https://github.com/neo4j/graphql/pull/5997) [`a716ef8`](https://github.com/neo4j/graphql/commit/a716ef8ec858aa8c6b51c285b3e2d899254c83fe) Thanks [@angrykoala](https://github.com/angrykoala)! - Remove `publish` method from `Neo4jGraphQLSubscriptionsEngine` interface as it is no longer used with CDC-based subscriptions. Implementing this method on custom engines will no longer have an effect, and it is no longer possible to call `publish` directly on `Neo4jGraphQLSubscriptionsCDCEngine`

- [#5872](https://github.com/neo4j/graphql/pull/5872) [`925ad8d`](https://github.com/neo4j/graphql/commit/925ad8dedc307200d1c3fd813e531325940d8f8f) Thanks [@angrykoala](https://github.com/angrykoala)! - Remove `@private` directive. This directive was intended to be used with the library `@neo4j/graphql-ogm` which is no longer supported.

- [#5895](https://github.com/neo4j/graphql/pull/5895) [`6afcadd`](https://github.com/neo4j/graphql/commit/6afcaddbfc62549c6c610a2199513bf4c719486c) Thanks [@angrykoala](https://github.com/angrykoala)! - Fails schema generation if there are conflicting plural names in types. For example, the following schema will fail, due to ambiguous `Techs` plural

    ```graphql
    type Tech @node(plural: "Techs") {
        name: String
    }

    type Techs {
        value: String
    }
    ```

- [#5927](https://github.com/neo4j/graphql/pull/5927) [`530d8cd`](https://github.com/neo4j/graphql/commit/530d8cddf91f031b849bbab6a668277b2c5986bf) Thanks [@MacondoExpress](https://github.com/MacondoExpress)! - The `typename_IN` filter has been renamed to `typename`.

- [#6077](https://github.com/neo4j/graphql/pull/6077) [`4cf7c07`](https://github.com/neo4j/graphql/commit/4cf7c07166e7193bb985223ba0191a2f97a57454) Thanks [@darrellwarde](https://github.com/darrellwarde)! - Values specified within the `@coalesce` directive are now also returned when selecting those fields, and not just when those fields are used in a filter.

- [#5755](https://github.com/neo4j/graphql/pull/5755) [`9c75f92`](https://github.com/neo4j/graphql/commit/9c75f925884de42f64e1b5c3086cc87c114727bd) Thanks [@angrykoala](https://github.com/angrykoala)! - Remove support for `connectOrCreate` operations

- [#6158](https://github.com/neo4j/graphql/pull/6158) [`19dc0dd`](https://github.com/neo4j/graphql/commit/19dc0dd7e92daad354fcc3effcc6909df3a891c6) Thanks [@angrykoala](https://github.com/angrykoala)! - Remove option `CONNECT_OR_CREATE` from argument `nestedOperations` from `@relationship` directives as it is no longer relevant after `connectOrCreate` have been removed

- [#5898](https://github.com/neo4j/graphql/pull/5898) [`a912404`](https://github.com/neo4j/graphql/commit/a91240457f8ccf51d3f6b11ecedf1101678306cd) Thanks [@MacondoExpress](https://github.com/MacondoExpress)! - Aggregations are no longer generated for `ID` fields.

- [#5936](https://github.com/neo4j/graphql/pull/5936) [`d48ea32`](https://github.com/neo4j/graphql/commit/d48ea327db022774c73a8adfada1a8d498590c2d) Thanks [@mjfwebb](https://github.com/mjfwebb)! - Changes the result projection where there are multiple relationships between two nodes.

    In the case of using the connection API then multiple relationships will still be represented, as there is the ability to select the relationship properties. In the non-connection API case, the duplicate results will only return distinct results.

- [#6109](https://github.com/neo4j/graphql/pull/6109) [`6801d70`](https://github.com/neo4j/graphql/commit/6801d7003f6f8f0f8bfd3ae9431ba081799dfcb5) Thanks [@darrellwarde](https://github.com/darrellwarde)! - The `where` field for nested update operations has been moved within the `update` input field.
  The `where` in its previous location was a no-op for all nested operations apart from `update`.

    For example, the following syntax would filter the `Post` nodes to update in Version 6:

    ```graphql
    mutation {
        updateUsers(
            where: { name: { eq: "Darrell" } }
            update: {
                posts: {
                    where: { node: { title: { eq: "Version 7 Release Notes" } } }
                    update: { node: { title: { set: "Version 7 Release Announcement" } } }
                }
            }
        )
    }
    ```

    In Version 7, this `where` has been moved inside the `update` operation:

    ```graphql
    mutation {
        updateUsers(
            where: { name: { eq: "Darrell" } }
            update: {
                posts: {
                    update: {
                        where: { node: { title: { eq: "Version 7 Release Notes" } } }
                        node: { title: { set: "Version 7 Release Announcement" } }
                    }
                }
            }
        )
    }
    ```

- [#6124](https://github.com/neo4j/graphql/pull/6124) [`d9cfd69`](https://github.com/neo4j/graphql/commit/d9cfd69f7e7daa8b7ad23a1046fee734aa038199) Thanks [@angrykoala](https://github.com/angrykoala)! - Fixed incorrect behavior of `single` and `some` filters on relationships to unions.

    Given the following union and relationship:

    ```graphql
    union Production = Movie | Series
    ```

    and a relationship to this union:

    ```graphql
    type Actor @node {
        name: String!
        actedIn: [Production!]! @relationship(type: "ACTED_IN", direction: OUT)
    }
    ```

    These queries previously returned incorrect results:

    ```graphql
    query {
        actors(
            where: {
                actedIn: { single: { Movie: { title_CONTAINS: "The Office" }, Series: { title_ENDS_WITH: "Office" } } }
            }
        ) {
            name
        }
    }
    ```

    ```graphql
    query {
        actors(
            where: {
                actedIn: { some: { Movie: { title_CONTAINS: "The Office" }, Series: { title_ENDS_WITH: "Office" } } }
            }
        ) {
            name
        }
    }
    ```

    Previously, conditions inside single and some were evaluated separately for each concrete type in the union, requiring all to match. This was incorrect.

    New behavior:
    - `single`: Now correctly returns actors with exactly one related node across the whole union, rather than per type.
    - `some`: Now correctly returns actors with at least one matching related node of any type in the union.

    This fix also applies to the deprecated filters `actedIn_SINGLE` and `actedIn_SOME`.

- [#5931](https://github.com/neo4j/graphql/pull/5931) [`5ce7d1d`](https://github.com/neo4j/graphql/commit/5ce7d1dff5287aa9d24beaf3992f1f66c7b62d94) Thanks [@darrellwarde](https://github.com/darrellwarde)! - `DateTime` and `Time` values are now converted from strings into temporal types in the generated Cypher instead of in server code using the driver. This could result in different values when the database is in a different timezone to the GraphQL server.

- [#5778](https://github.com/neo4j/graphql/pull/5778) [`56022ba`](https://github.com/neo4j/graphql/commit/56022ba38d8beb6cb5d7bbfb5e856fd57d9660c5) Thanks [@darrellwarde](https://github.com/darrellwarde)! - The deprecated `directed` argument has been removed, and `queryDirection` now only accepts two possible values - `DIRECTED` (default) and `UNDIRECTED`.

    Additionally, the `directedArgument` setting of `excludeDeprecatedFields` has been removed as these deprecated fields have been removed.

- [#5976](https://github.com/neo4j/graphql/pull/5976) [`7ddde75`](https://github.com/neo4j/graphql/commit/7ddde75d9828c737e3849c49b6b91f4b2b9b8044) Thanks [@angrykoala](https://github.com/angrykoala)! - Sets addVersionPrefix to true by default, this will prepend the Cypher version to all queries by default, ensuring that the correct Cypher version is used in Neo4j:

    ```cypher
    CYPHER 5
    MATCH(this:Movie)
    ```

    This may be incompatible with older versions of Neo4j and can be disabled by setting `cypherQueryOption.addVersionPrefix` in the context to false:

    ```js
    {
        cypherQueryOptions: {
            addVersionPrefix: true,
        },
    }
    ```

    For example, for an apollo server:

    ```js
    await startStandaloneServer(server, {
        context: async ({ req }) => ({
            req,
            cypherQueryOptions: {
                addVersionPrefix: false,
            },
        }),
        listen: { port: 4000 },
    });
    ```

- [#5819](https://github.com/neo4j/graphql/pull/5819) [`ac1fa62`](https://github.com/neo4j/graphql/commit/ac1fa629f1eb8b248116bd9dedaabc02117fdbee) Thanks [@angrykoala](https://github.com/angrykoala)! - Single element relationships have been removed in favor of list relationships:

    Before

    ```graphql
    type Movie {
        director: Person @relationship(type: "DIRECTED", direction: "IN")
    }
    ```

    After

    ```graphql
    type Movie {
        director: [Person!]! @relationship(type: "DIRECTED", direction: "IN")
    }
    ```

    This requires updating filters, clients and auth rules to use the list filter operations.

    Single element relationships cannot be reliably enforced, leading to a data inconsistent with the schema. If the GraphQL model requires 1-1 relationships (such as in federations) these can now be achieved with the `@cypher` directive instead:

    ```graphql
    type Movie {
        director: Person
            @cypher(
                statement: """
                MATCH(this)-[:ACTED_IN]->(p:Person)
                RETURN p
                """
                columnName: "p"
            )
    }
    ```

- [#5762](https://github.com/neo4j/graphql/pull/5762) [`87e416b`](https://github.com/neo4j/graphql/commit/87e416b2547b75824d9782fd5da90c003437e7c0) Thanks [@darrellwarde](https://github.com/darrellwarde)! - There have been major changes to the way that full-text search operates.

    The directive now requires the specification of an index name, query name, and indexed fields.

    ```graphql
    input FulltextInput {
        indexName: String!
        queryName: String!
        fields: [String]!
    }

    """
    Informs @neo4j/graphql that there should be a fulltext index in the database, allows users to search by the index in the generated schema.
    """
    directive @fulltext(indexes: [FulltextInput]!) on OBJECT
    ```

    Here is an example of how this might be used:

    ```graphql
    type Movie @node @fulltext(indexName: "movieTitleIndex", queryName: "moviesByTitle", fields: ["title"]) {
        title: String!
    }
    ```

    Full-text search was previously available in two different locations.

    The following form has now been completely removed:

    ```graphql
    # Removed
    {
        movies(fulltext: { movieTitleIndex: { phrase: "The Matrix" } }) {
            title
        }
    }
    ```

    The following form as a root-level query has been changed:

    ```graphql
    # Old query
    query {
        moviesByTitle(phrase: "The Matrix") {
            score
            movies {
                title
            }
        }
    }

    # New query
    query {
        moviesByTitle(phrase: "The Matrix") {
            edges {
                score
                node {
                    title
                }
            }
        }
    }
    ```

    The new form is as a Relay connection, which allows for pagination using cursors and access to the `pageInfo` field.

- [#6125](https://github.com/neo4j/graphql/pull/6125) [`c51c9c0`](https://github.com/neo4j/graphql/commit/c51c9c06e381f69432d1685badf0ebba093e6280) Thanks [@angrykoala](https://github.com/angrykoala)! - Does not generate queries for interfaces without an implementing type with the `@node` directive.

    For example. The following type definitions:

    ```graphql
    interface Production {
        title: String!
    }

    type Movie @node {
        title: String!
    }

    type NotANode implements Production {
        title: String!
    }
    ```

    Will no longer generate the queries and types related to the interface `Production`:

    ```graphql
    type Query {
        productions(limit: Int, offset: Int, sort: [ProductionSort!], where: ProductionWhere): [Production!]!
        productionsConnection(
            after: String
            first: Int
            sort: [ProductionSort!]
            where: ProductionWhere
        ): ProductionsConnection!
    }
    ```

- [#5820](https://github.com/neo4j/graphql/pull/5820) [`d8d59f8`](https://github.com/neo4j/graphql/commit/d8d59f80480017d27b49b062321a9a15b6494a96) Thanks [@MacondoExpress](https://github.com/MacondoExpress)! - Change the way how `@node` behaves, `@node` is now required, and GraphQL Object types without the directive `@node` will no longer considered as a Neo4j Nodes representation.
  Queries and Mutations will be generated only for types with the `@node` directive.

- [#6027](https://github.com/neo4j/graphql/pull/6027) [`fd7d373`](https://github.com/neo4j/graphql/commit/fd7d373013f3c7b159af6e05a23945ec43937efa) Thanks [@angrykoala](https://github.com/angrykoala)! - Remove deprecated fields `*aggregate` in favor of the `aggregate` field in connections. Remove option `deprecatedAggregateOperations` from the `excludeDeprecatedFields` setting.

- [#5801](https://github.com/neo4j/graphql/pull/5801) [`95ce8bb`](https://github.com/neo4j/graphql/commit/95ce8bb884bddaf20d751f2448b5504a7b94d081) Thanks [@darrellwarde](https://github.com/darrellwarde)! - Implicit filtering fields have been removed, please use the explicit versions:

    ```graphql
    # Old syntax
    {
        movies(where: { title: "The Matrix" }) {
            title
        }
    }

    # New syntax
    {
        movies(where: { title_EQ: "The Matrix" }) {
            title
        }
    }
    ```

    The `implicitEqualFilters` option of `excludeDeprecatedFields` has been removed.

- [#5755](https://github.com/neo4j/graphql/pull/5755) [`9c75f92`](https://github.com/neo4j/graphql/commit/9c75f925884de42f64e1b5c3086cc87c114727bd) Thanks [@angrykoala](https://github.com/angrykoala)! - Remove support for `@unique` directive

- [#5768](https://github.com/neo4j/graphql/pull/5768) [`e338590`](https://github.com/neo4j/graphql/commit/e338590d25216cced8252cfe3d0789d97952c20d) Thanks [@angrykoala](https://github.com/angrykoala)! - Remove `overwrite` field in connect operations

- [#5777](https://github.com/neo4j/graphql/pull/5777) [`0ecfd71`](https://github.com/neo4j/graphql/commit/0ecfd71a1431c5f98fde30319eefd5b018a06701) Thanks [@darrellwarde](https://github.com/darrellwarde)! - The deprecated `options` argument has been removed.

    Consider the following type definitions:

    ```graphql
    type Movie {
        title: String!
    }
    ```

    The migration is as below:

    ```graphql
    # Old syntax
    {
        movies(options: { first: 10, offset: 10, sort: [{ title: ASC }] }) {
            title
        }
    }

    # New syntax
    {
        movies(first: 10, offset: 10, sort: [{ title: ASC }]) {
            title
        }
    }
    ```

    The `deprecatedOptionsArgument` of `excludeDeprecatedFields` has been removed as it is now a no-op.

- [#5802](https://github.com/neo4j/graphql/pull/5802) [`99cb9aa`](https://github.com/neo4j/graphql/commit/99cb9aa866eed04224d790bfccab9c3d3add78b7) Thanks [@darrellwarde](https://github.com/darrellwarde)! - Implicit set operations have been removed. For example:

    ```graphql
    # Old syntax
    mutation {
        updateMovies(where: { title_EQ: "Matrix" }, update: { title: "The Matrix" }) {
            movies {
                title
            }
        }
    }

    # New syntax
    mutation {
        updateMovies(where: { title_EQ: "Matrix" }, update: { title_SET: "The Matrix" }) {
            movies {
                title
            }
        }
    }
    ```

    The `implicitSet` argument of `excludeDeprecatedFields` has been removed.

- [#5837](https://github.com/neo4j/graphql/pull/5837) [`721691a`](https://github.com/neo4j/graphql/commit/721691a84eaa34996c0c97edb7ede1ae4775dd2f) Thanks [@MacondoExpress](https://github.com/MacondoExpress)! - Added a validation rule to avoid defining fields as lists of nullable elements, as Neo4j does not support this.

- [#5933](https://github.com/neo4j/graphql/pull/5933) [`8bdcf6b`](https://github.com/neo4j/graphql/commit/8bdcf6b36fba1442f75fe8401cf170ed17339cdb) Thanks [@mjfwebb](https://github.com/mjfwebb)! - When performing a `connect` operation, new relationships are always created.

- [#6152](https://github.com/neo4j/graphql/pull/6152) [`3e642d9`](https://github.com/neo4j/graphql/commit/3e642d9ea7dd0b661132d006f678575a9b11f5b2) Thanks [@darrellwarde](https://github.com/darrellwarde)! - The `@query` directive used on the schema will now also apply to the generation of queries for interface and union types.

    The following type definitions will not produce query fields for the `Production` or `Media` types.

    ```graphql
    interface Production {
        title: String!
    }

    type Movie implements Production @node {
        title: String!
    }

    type Series implements Production @node {
        title: String!
    }

    union Media = Movie | Series

    extend schema @query(read: false, aggregate: false)
    ```

- [#6159](https://github.com/neo4j/graphql/pull/6159) [`2adfdec`](https://github.com/neo4j/graphql/commit/2adfdec38f6d371988eaf9573e49220a5a444e6f) Thanks [@angrykoala](https://github.com/angrykoala)! - Fails schema validation if an interface is implemented by a type with `@node` but not all implemented types use `@node`. For example, the following is invalid:

    ```graphql
    interface Person {
        name: String
    }

    type Director implements Person {
        name: String
    }

    type Actor implements Person @node {
        name: String
    }
    ```

- [#6165](https://github.com/neo4j/graphql/pull/6165) [`992c53a`](https://github.com/neo4j/graphql/commit/992c53a38a7731c2f51a1365825b63e3b3bbb2b1) Thanks [@angrykoala](https://github.com/angrykoala)! - Fails schema validation if an union is composed of a type with `@node` but not all other types. For example, the following is invalid:

    ```graphql
    union Person = Director | Actor

    type Director {
        name: String
    }

    type Actor @node {
        name: String
    }
    ```

### Minor Changes

- [#6024](https://github.com/neo4j/graphql/pull/6024) [`2318336`](https://github.com/neo4j/graphql/commit/2318336606c668778090edd4ebf56178264f41ca) Thanks [@MacondoExpress](https://github.com/MacondoExpress)! - Aggregations filters are moved to the connection input field.

    **Current aggregation filters:**

    ```graphql
    {
        posts(where: { likesConnection: { aggregate: { node: { someInt: { average: { eq: 10 } } } } } }) {
            content
        }
    }
    ```

    **Deprecated aggregation filters:**

    ```graphql
    {
        posts(where: { likesAggregate: { node: { someInt: { average: { eq: 10 } } } } }) {
            content
        }
    }
    ```

- [#5868](https://github.com/neo4j/graphql/pull/5868) [`46ab2fa`](https://github.com/neo4j/graphql/commit/46ab2fa03b31610a26fa559189fd3af22ab7438e) Thanks [@angrykoala](https://github.com/angrykoala)! - Add suport for generic update operators:

    ```graphql
    mutation {
        updateMovies(update: { name: { set: "The Matrix" } }) {
            movies {
                id
                name
            }
        }
    }
    ```

- [#6024](https://github.com/neo4j/graphql/pull/6024) [`2318336`](https://github.com/neo4j/graphql/commit/2318336606c668778090edd4ebf56178264f41ca) Thanks [@MacondoExpress](https://github.com/MacondoExpress)! - The aggregation filter `count` now supports both, nodes and relationships.

    **Count filter on nodes:**

    ```graphql
    {
        posts(where: { likesConnection: { aggregate: { count: { nodes: { eq: 2 } } } } }) {
            title
            likes {
                name
            }
        }
    }
    ```

    **Count filter on edges:**

    ```graphql
    {
        posts(where: { likesConnection: { aggregate: { count: { edges: { eq: 2 } } } } }) {
            title
            likes {
                name
            }
        }
    }
    ```

- [#6178](https://github.com/neo4j/graphql/pull/6178) [`7aa1b95`](https://github.com/neo4j/graphql/commit/7aa1b95eb52b5fb5ed2259669b09fa8e8e840f3e) Thanks [@darrellwarde](https://github.com/darrellwarde)! - The Neo4j GraphQL Library is now bundled as a dual package containing both CommonJS and ESM builds. This is a changelog entry for #6177.

- [#5873](https://github.com/neo4j/graphql/pull/5873) [`17911fc`](https://github.com/neo4j/graphql/commit/17911fc197105f5fafc06ce851669af6fc07b18a) Thanks [@MacondoExpress](https://github.com/MacondoExpress)! - Introduce a new style for filtering relationships and connections.
  The quantifiers `SOME` | `NONE` | `SINGLE` | `ALL` are now available as a nested input object.

    **Relationship**

    ```graphql
    {
        movies(where: { genres: { some: { name: { equals: "some genre" } } } }) {
            actorCount
        }
    }
    ```

    **Connection**

    ```graphql
    {
        movies(where: { genresConnection: { some: { node: { name: { equals: "some genre" } } } } }) {
            actorCount
        }
    }
    ```

### Patch Changes

- [#6180](https://github.com/neo4j/graphql/pull/6180) [`eae9bb4`](https://github.com/neo4j/graphql/commit/eae9bb427bb41f8436951400b36aa4f30a8e2b9c) Thanks [@angrykoala](https://github.com/angrykoala)! - Revert dual package bundling. Publishing only cjs package

- [#5871](https://github.com/neo4j/graphql/pull/5871) [`722c650`](https://github.com/neo4j/graphql/commit/722c6507977072122041e985b94a84a707179f39) Thanks [@angrykoala](https://github.com/angrykoala)! - Deprecate individual mutations in favor of generic mutations
    - `_SET`
    - `_POP`
    - `_PUSH`
    - `_INCREMENT`
    - `_ADD`
    - `_DECREMENT`
    - `_SUBTRACT`
    - `_MULTIPLY`
    - `_DIVIDE`

- [#6024](https://github.com/neo4j/graphql/pull/6024) [`667e75c`](https://github.com/neo4j/graphql/commit/667e75c3219886fc24de472dc3edbf3d0bce913b) Thanks [@MacondoExpress](https://github.com/MacondoExpress)! - Following the changes of moving aggregations inside the connection fields,
  the previous aggregations filters outside the connection filters are now deprecated.

    The flag `aggregationFiltersOutsideConnection` has been added to the excludeDeprecatedFields setting.

    ```ts
    const neoSchema = new Neo4jGraphQL({
        typeDefs,
        features: { excludeDeprecatedFields: { aggregationFiltersOutsideConnection: true } },
    });
    ```

- [#5882](https://github.com/neo4j/graphql/pull/5882) [`7254acf`](https://github.com/neo4j/graphql/commit/7254acf1b7bb83a35cea580143a6012355bc02d8) Thanks [@angrykoala](https://github.com/angrykoala)! - Deprecates old aggregation filters for relationships in favor of more generic filters:

    Before:

    ```js
    query Movies {
      movies(
        where: { actorsAggregate: { node: { lastRating_AVERAGE_GT: 6 } } }
      ) {
        title
      }
    }
    ```

    Now:

    ```js
    query Movies {
      movies(
        where: {
          actorsAggregate: { node: { lastRating: { average: { gt: 6 } } } }
        }
      ) {
        title
      }
    }
    ```

- [#6154](https://github.com/neo4j/graphql/pull/6154) [`5fedc91`](https://github.com/neo4j/graphql/commit/5fedc9115b2b8e68e26b478c9571d7cadfbe9cdd) Thanks [@MacondoExpress](https://github.com/MacondoExpress)! - Fixed a bug that allowed the `queryName` and `fields` arguments of the `@fulltext` directive to be undefined.

- [#5897](https://github.com/neo4j/graphql/pull/5897) [`4f3b068`](https://github.com/neo4j/graphql/commit/4f3b068cfe4123109bb8a27bacef775fb897a87e) Thanks [@MacondoExpress](https://github.com/MacondoExpress)! - Deprecate relationship filtering using the non-generic version such as `actors_SOME: { title_EQ: "The Matrix" }` in favor of the generic input `actors: { some: { title: { eq: "The Matrix" } } }`.
  The setting `excludeDeprecatedFields` now contains the option `relationshipFilters` to remove these deprecated filters.

- [#5897](https://github.com/neo4j/graphql/pull/5897) [`917482b`](https://github.com/neo4j/graphql/commit/917482b675ec3de7dc06ca110e2fccf93024115f) Thanks [@MacondoExpress](https://github.com/MacondoExpress)! - Deprecate attribute filtering using the non-generic version such as `title_EQ: "The Matrix"` in favor of the generic input `title: { eq: "The Matrix" }`.
  The setting `excludeDeprecatedFields` now contains the option `attributeFilters` to remove these deprecated filters.

- [#5879](https://github.com/neo4j/graphql/pull/5879) [`5c7ba22`](https://github.com/neo4j/graphql/commit/5c7ba22afc8fc0df86a148f31ce61691586f8cf3) Thanks [@angrykoala](https://github.com/angrykoala)! - Add generic filters for aggregations:

    ```graphql
    {
        posts(where: { likesAggregate: { node: { rating: { average: { eq: 3.2 } } } } }) {
            title
        }
    }
    ```

- [#6099](https://github.com/neo4j/graphql/pull/6099) [`d502b93`](https://github.com/neo4j/graphql/commit/d502b93f94bb7426cd32f64909e522f7cbc47699) Thanks [@mjfwebb](https://github.com/mjfwebb)! - Typescript version has been updated to 5.8.2 slightly changing the emitted code. This change is not expected to have any impact on the generated code or the runtime behavior of the library.

- [#5882](https://github.com/neo4j/graphql/pull/5882) [`7254acf`](https://github.com/neo4j/graphql/commit/7254acf1b7bb83a35cea580143a6012355bc02d8) Thanks [@angrykoala](https://github.com/angrykoala)! - Introduce the flag "aggregationFilters" to remove deprecated aggregation filters:

    ```js
    const neoSchema = new Neo4jGraphQL({
        typeDefs,
        features: { excludeDeprecatedFields: { aggregationFilters: true } },
    });
    ```

- [#6000](https://github.com/neo4j/graphql/pull/6000) [`271a0a3`](https://github.com/neo4j/graphql/commit/271a0a306bf33959382255eac47749c6de46798d) Thanks [@MacondoExpress](https://github.com/MacondoExpress)! - Add `addVersionPrefix` to `cypherQueryOptions` in context to add a Cypher version with `CYPHER` before each query:

    ```js
    {
        cypherQueryOptions: {
            addVersionPrefix: true,
        },
    }
    ```

    This prepends all Cypher queries with a `CYPHER [version]` statement:

    ```cypher
    CYPHER 5
    MATCH (this:Movie)
    WHERE this.title = $param0
    RETURN this { .title } AS this
    ```

- [#6007](https://github.com/neo4j/graphql/pull/6007) [`48aec51`](https://github.com/neo4j/graphql/commit/48aec512b4707d9b9aa74f05d382eb6980e08971) Thanks [@darrellwarde](https://github.com/darrellwarde)! - Allow `app` to be overwritten in transaction metadata

## 7.0.0-alpha.7

### Patch Changes

- [#6180](https://github.com/neo4j/graphql/pull/6180) [`eae9bb4`](https://github.com/neo4j/graphql/commit/eae9bb427bb41f8436951400b36aa4f30a8e2b9c) Thanks [@angrykoala](https://github.com/angrykoala)! - Revert dual package bundling. Publishing only cjs package

## 7.0.0-alpha.6

### Major Changes

- [#6153](https://github.com/neo4j/graphql/pull/6153) [`0779691`](https://github.com/neo4j/graphql/commit/0779691eb9eeb0b36df260d7366eabe20fb6ca37) Thanks [@angrykoala](https://github.com/angrykoala)! - Fails schema validation if a field with `@relationship` targets a type without `@node`.

    For example, the following schema will fail:

    ```graphql
    type Movie @node {
        someActors: [Actor!]! @relationship(type: "ACTED_IN", direction: OUT)
    }

    type Actor {
        name: String
    }
    ```

- [#6158](https://github.com/neo4j/graphql/pull/6158) [`19dc0dd`](https://github.com/neo4j/graphql/commit/19dc0dd7e92daad354fcc3effcc6909df3a891c6) Thanks [@angrykoala](https://github.com/angrykoala)! - Remove option `CONNECT_OR_CREATE` from argument `nestedOperations` from `@relationship` directives as it is no longer relevant after `connectOrCreate` have been removed

- [#6109](https://github.com/neo4j/graphql/pull/6109) [`6801d70`](https://github.com/neo4j/graphql/commit/6801d7003f6f8f0f8bfd3ae9431ba081799dfcb5) Thanks [@darrellwarde](https://github.com/darrellwarde)! - The `where` field for nested update operations has been moved within the `update` input field.
  The `where` in its previous location was a no-op for all nested operations apart from `update`.

    For example, the following syntax would filter the `Post` nodes to update in Version 6:

    ```graphql
    mutation {
        updateUsers(
            where: { name: { eq: "Darrell" } }
            update: {
                posts: {
                    where: { node: { title: { eq: "Version 7 Release Notes" } } }
                    update: { node: { title: { set: "Version 7 Release Announcement" } } }
                }
            }
        )
    }
    ```

    In Version 7, this `where` has been moved inside the `update` operation:

    ```graphql
    mutation {
        updateUsers(
            where: { name: { eq: "Darrell" } }
            update: {
                posts: {
                    update: {
                        where: { node: { title: { eq: "Version 7 Release Notes" } } }
                        node: { title: { set: "Version 7 Release Announcement" } }
                    }
                }
            }
        )
    }
    ```

- [#6124](https://github.com/neo4j/graphql/pull/6124) [`d9cfd69`](https://github.com/neo4j/graphql/commit/d9cfd69f7e7daa8b7ad23a1046fee734aa038199) Thanks [@angrykoala](https://github.com/angrykoala)! - Fixed incorrect behavior of `single` and `some` filters on relationships to unions.

    Given the following union and relationship:

    ```graphql
    union Production = Movie | Series
    ```

    and a relationship to this union:

    ```graphql
    type Actor @node {
        name: String!
        actedIn: [Production!]! @relationship(type: "ACTED_IN", direction: OUT)
    }
    ```

    These queries previously returned incorrect results:

    ```graphql
    query {
        actors(
            where: {
                actedIn: { single: { Movie: { title_CONTAINS: "The Office" }, Series: { title_ENDS_WITH: "Office" } } }
            }
        ) {
            name
        }
    }
    ```

    ```graphql
    query {
        actors(
            where: {
                actedIn: { some: { Movie: { title_CONTAINS: "The Office" }, Series: { title_ENDS_WITH: "Office" } } }
            }
        ) {
            name
        }
    }
    ```

    Previously, conditions inside single and some were evaluated separately for each concrete type in the union, requiring all to match. This was incorrect.

    New behavior:
    - `single`: Now correctly returns actors with exactly one related node across the whole union, rather than per type.
    - `some`: Now correctly returns actors with at least one matching related node of any type in the union.

    This fix also applies to the deprecated filters `actedIn_SINGLE` and `actedIn_SOME`.

- [#6125](https://github.com/neo4j/graphql/pull/6125) [`c51c9c0`](https://github.com/neo4j/graphql/commit/c51c9c06e381f69432d1685badf0ebba093e6280) Thanks [@angrykoala](https://github.com/angrykoala)! - Does not generate queries for interfaces without an implementing type with the `@node` directive.

    For example. The following type definitions:

    ```graphql
    interface Production {
        title: String!
    }

    type Movie @node {
        title: String!
    }

    type NotANode implements Production {
        title: String!
    }
    ```

    Will no longer generate the queries and types related to the interface `Production`:

    ```graphql
    type Query {
        productions(limit: Int, offset: Int, sort: [ProductionSort!], where: ProductionWhere): [Production!]!
        productionsConnection(
            after: String
            first: Int
            sort: [ProductionSort!]
            where: ProductionWhere
        ): ProductionsConnection!
    }
    ```

- [#6152](https://github.com/neo4j/graphql/pull/6152) [`3e642d9`](https://github.com/neo4j/graphql/commit/3e642d9ea7dd0b661132d006f678575a9b11f5b2) Thanks [@darrellwarde](https://github.com/darrellwarde)! - The `@query` directive used on the schema will now also apply to the generation of queries for interface and union types.

    The following type definitions will not produce query fields for the `Production` or `Media` types.

    ```graphql
    interface Production {
        title: String!
    }

    type Movie implements Production @node {
        title: String!
    }

    type Series implements Production @node {
        title: String!
    }

    union Media = Movie | Series

    extend schema @query(read: false, aggregate: false)
    ```

- [#6159](https://github.com/neo4j/graphql/pull/6159) [`2adfdec`](https://github.com/neo4j/graphql/commit/2adfdec38f6d371988eaf9573e49220a5a444e6f) Thanks [@angrykoala](https://github.com/angrykoala)! - Fails schema validation if an interface is implemented by a type with `@node` but not all implemented types use `@node`. For example, the following is invalid:

    ```graphql
    interface Person {
        name: String
    }

    type Director implements Person {
        name: String
    }

    type Actor implements Person @node {
        name: String
    }
    ```

- [#6165](https://github.com/neo4j/graphql/pull/6165) [`992c53a`](https://github.com/neo4j/graphql/commit/992c53a38a7731c2f51a1365825b63e3b3bbb2b1) Thanks [@angrykoala](https://github.com/angrykoala)! - Fails schema validation if an union is composed of a type with `@node` but not all other types. For example, the following is invalid:

    ```graphql
    union Person = Director | Actor

    type Director {
        name: String
    }

    type Actor @node {
        name: String
    }
    ```

### Minor Changes

- [#6178](https://github.com/neo4j/graphql/pull/6178) [`7aa1b95`](https://github.com/neo4j/graphql/commit/7aa1b95eb52b5fb5ed2259669b09fa8e8e840f3e) Thanks [@darrellwarde](https://github.com/darrellwarde)! - The Neo4j GraphQL Library is now bundled as a dual package containing both CommonJS and ESM builds. This is a changelog entry for #6177.

### Patch Changes

- [#6154](https://github.com/neo4j/graphql/pull/6154) [`5fedc91`](https://github.com/neo4j/graphql/commit/5fedc9115b2b8e68e26b478c9571d7cadfbe9cdd) Thanks [@MacondoExpress](https://github.com/MacondoExpress)! - Fixed a bug that allowed the `queryName` and `fields` arguments of the `@fulltext` directive to be undefined.

## 7.0.0-alpha.5

### Patch Changes

- [#6099](https://github.com/neo4j/graphql/pull/6099) [`d502b93`](https://github.com/neo4j/graphql/commit/d502b93f94bb7426cd32f64909e522f7cbc47699) Thanks [@mjfwebb](https://github.com/mjfwebb)! - Typescript version has been updated to 5.8.2 slightly changing the emitted code. This change is not expected to have any impact on the generated code or the runtime behavior of the library.

## 7.0.0-alpha.4

### Major Changes

- [#6048](https://github.com/neo4j/graphql/pull/6048) [`c667618`](https://github.com/neo4j/graphql/commit/c667618ed90a0f645b8550711a7fad276ec57d01) Thanks [@darrellwarde](https://github.com/darrellwarde)! - Subscriptions are now an opt-in feature which can be enabled by using the `@subscription` directive on either schema or type.

    For example, to enable subscriptions for the whole schema (equivalent to before this breaking change):

    ```graphql
    type Movie @node {
        title: String!
    }

    extend schema @subscription
    ```

    To enable subscriptions just for the `Movie` type:

    ```graphql
    type Movie @node @subscription {
        title: String!
    }
    ```

- [#6077](https://github.com/neo4j/graphql/pull/6077) [`4cf7c07`](https://github.com/neo4j/graphql/commit/4cf7c07166e7193bb985223ba0191a2f97a57454) Thanks [@darrellwarde](https://github.com/darrellwarde)! - Values specified within the `@coalesce` directive are now also returned when selecting those fields, and not just when those fields are used in a filter.

- [#6027](https://github.com/neo4j/graphql/pull/6027) [`fd7d373`](https://github.com/neo4j/graphql/commit/fd7d373013f3c7b159af6e05a23945ec43937efa) Thanks [@angrykoala](https://github.com/angrykoala)! - Remove deprecated fields `*aggregate` in favor of the `aggregate` field in connections. Remove option `deprecatedAggregateOperations` from the `excludeDeprecatedFields` setting.

### Minor Changes

- [#6024](https://github.com/neo4j/graphql/pull/6024) [`2318336`](https://github.com/neo4j/graphql/commit/2318336606c668778090edd4ebf56178264f41ca) Thanks [@MacondoExpress](https://github.com/MacondoExpress)! - Aggregations filters are moved to the connection input field.

    **Current aggregation filters:**

    ```graphql
    {
        posts(where: { likesConnection: { aggregate: { node: { someInt: { average: { eq: 10 } } } } } }) {
            content
        }
    }
    ```

    **Deprecated aggregation filters:**

    ```graphql
    {
        posts(where: { likesAggregate: { node: { someInt: { average: { eq: 10 } } } } }) {
            content
        }
    }
    ```

- [#6024](https://github.com/neo4j/graphql/pull/6024) [`2318336`](https://github.com/neo4j/graphql/commit/2318336606c668778090edd4ebf56178264f41ca) Thanks [@MacondoExpress](https://github.com/MacondoExpress)! - The aggregation filter `count` now supports both, nodes and relationships.

    **Count filter on nodes:**

    ```graphql
    {
        posts(where: { likesConnection: { aggregate: { count: { nodes: { eq: 2 } } } } }) {
            title
            likes {
                name
            }
        }
    }
    ```

    **Count filter on edges:**

    ```graphql
    {
        posts(where: { likesConnection: { aggregate: { count: { edges: { eq: 2 } } } } }) {
            title
            likes {
                name
            }
        }
    }
    ```

### Patch Changes

- [#6024](https://github.com/neo4j/graphql/pull/6024) [`667e75c`](https://github.com/neo4j/graphql/commit/667e75c3219886fc24de472dc3edbf3d0bce913b) Thanks [@MacondoExpress](https://github.com/MacondoExpress)! - Following the changes of moving aggregations inside the connection fields,
  the previous aggregations filters outside the connection filters are now deprecated.

    The flag `aggregationFiltersOutsideConnection` has been added to the excludeDeprecatedFields setting.

    ```ts
    const neoSchema = new Neo4jGraphQL({
        typeDefs,
        features: { excludeDeprecatedFields: { aggregationFiltersOutsideConnection: true } },
    });
    ```

- [#6000](https://github.com/neo4j/graphql/pull/6000) [`271a0a3`](https://github.com/neo4j/graphql/commit/271a0a306bf33959382255eac47749c6de46798d) Thanks [@MacondoExpress](https://github.com/MacondoExpress)! - Add `addVersionPrefix` to `cypherQueryOptions` in context to add a Cypher version with `CYPHER` before each query:

    ```js
    {
        cypherQueryOptions: {
            addVersionPrefix: true,
        },
    }
    ```

    This prepends all Cypher queries with a `CYPHER [version]` statement:

    ```cypher
    CYPHER 5
    MATCH (this:Movie)
    WHERE this.title = $param0
    RETURN this { .title } AS this
    ```

## 7.0.0-alpha.3

### Major Changes

- [#5997](https://github.com/neo4j/graphql/pull/5997) [`a716ef8`](https://github.com/neo4j/graphql/commit/a716ef8ec858aa8c6b51c285b3e2d899254c83fe) Thanks [@angrykoala](https://github.com/angrykoala)! - Remove `publish` method from `Neo4jGraphQLSubscriptionsEngine` interface as it is no longer used with CDC-based subscriptions. Implementing this method on custom engines will no longer have an effect, and it is no longer possible to call `publish` directly on `Neo4jGraphQLSubscriptionsCDCEngine`

- [#5976](https://github.com/neo4j/graphql/pull/5976) [`7ddde75`](https://github.com/neo4j/graphql/commit/7ddde75d9828c737e3849c49b6b91f4b2b9b8044) Thanks [@angrykoala](https://github.com/angrykoala)! - Sets addVersionPrefix to true by default, this will prepend the Cypher version to all queries by default, ensuring that the correct Cypher version is used in Neo4j:

    ```cypher
    CYPHER 5
    MATCH(this:Movie)
    ```

    This may be incompatible with older versions of Neo4j and can be disabled by setting `cypherQueryOption.addVersionPrefix` in the context to false:

    ```js
    {
        cypherQueryOptions: {
            addVersionPrefix: true,
        },
    }
    ```

    For example, for an apollo server:

    ```js
    await startStandaloneServer(server, {
        context: async ({ req }) => ({
            req,
            cypherQueryOptions: {
                addVersionPrefix: false,
            },
        }),
        listen: { port: 4000 },
    });
    ```

### Patch Changes

- [#6007](https://github.com/neo4j/graphql/pull/6007) [`48aec51`](https://github.com/neo4j/graphql/commit/48aec512b4707d9b9aa74f05d382eb6980e08971) Thanks [@darrellwarde](https://github.com/darrellwarde)! - Allow `app` to be overwritten in transaction metadata

## 7.0.0-alpha.2

### Major Changes

- [#5936](https://github.com/neo4j/graphql/pull/5936) [`d48ea32`](https://github.com/neo4j/graphql/commit/d48ea327db022774c73a8adfada1a8d498590c2d) Thanks [@mjfwebb](https://github.com/mjfwebb)! - Changes the result projection where there are multiple relationships between two nodes.

    In the case of using the connection API then multiple relationships will still be represented, as there is the ability to select the relationship properties. In the non-connection API case, the duplicate results will only return distinct results.

- [#5931](https://github.com/neo4j/graphql/pull/5931) [`5ce7d1d`](https://github.com/neo4j/graphql/commit/5ce7d1dff5287aa9d24beaf3992f1f66c7b62d94) Thanks [@darrellwarde](https://github.com/darrellwarde)! - `DateTime` and `Time` values are now converted from strings into temporal types in the generated Cypher instead of in server code using the driver. This could result in different values when the database is in a different timezone to the GraphQL server.

- [#5933](https://github.com/neo4j/graphql/pull/5933) [`8bdcf6b`](https://github.com/neo4j/graphql/commit/8bdcf6b36fba1442f75fe8401cf170ed17339cdb) Thanks [@mjfwebb](https://github.com/mjfwebb)! - When performing a `connect` operation, new relationships are always created.

## 7.0.0-alpha.1

### Major Changes

- [#5927](https://github.com/neo4j/graphql/pull/5927) [`530d8cd`](https://github.com/neo4j/graphql/commit/530d8cddf91f031b849bbab6a668277b2c5986bf) Thanks [@MacondoExpress](https://github.com/MacondoExpress)! - The `typename_IN` filter has been renamed to `typename`.

- [#5898](https://github.com/neo4j/graphql/pull/5898) [`a912404`](https://github.com/neo4j/graphql/commit/a91240457f8ccf51d3f6b11ecedf1101678306cd) Thanks [@MacondoExpress](https://github.com/MacondoExpress)! - Aggregations are no longer generated for `ID` fields.

### Minor Changes

- [#5868](https://github.com/neo4j/graphql/pull/5868) [`46ab2fa`](https://github.com/neo4j/graphql/commit/46ab2fa03b31610a26fa559189fd3af22ab7438e) Thanks [@angrykoala](https://github.com/angrykoala)! - Add suport for generic update operators:

    ```graphql
    mutation {
        updateMovies(update: { name: { set: "The Matrix" } }) {
            movies {
                id
    ```

## 7.0.0-alpha.0

### Major Changes

- [#5899](https://github.com/neo4j/graphql/pull/5899) [`7335d8f`](https://github.com/neo4j/graphql/commit/7335d8f416bbfa08feab0fe4983f89590f984e1c) Thanks [@darrellwarde](https://github.com/darrellwarde)! - Nested mutation operations now follow the relationship direction behaviour as defined in `queryDirection`

- [#5872](https://github.com/neo4j/graphql/pull/5872) [`925ad8d`](https://github.com/neo4j/graphql/commit/925ad8dedc307200d1c3fd813e531325940d8f8f) Thanks [@angrykoala](https://github.com/angrykoala)! - Remove `@private` directive. This directive was intended to be used with the library `@neo4j/graphql-ogm` which is no longer supported.

- [#5895](https://github.com/neo4j/graphql/pull/5895) [`6afcadd`](https://github.com/neo4j/graphql/commit/6afcaddbfc62549c6c610a2199513bf4c719486c) Thanks [@angrykoala](https://github.com/angrykoala)! - Fails schema generation if there are conflicting plural names in types. For example, the following schema will fail, due to ambiguous `Techs` plural

    ```graphql
    type Tech @node(plural: "Techs") {
        name: String
    }

    type Techs {
        value: String
    }
    ```

- [#5755](https://github.com/neo4j/graphql/pull/5755) [`9c75f92`](https://github.com/neo4j/graphql/commit/9c75f925884de42f64e1b5c3086cc87c114727bd) Thanks [@angrykoala](https://github.com/angrykoala)! - Remove support for `connectOrCreate` operations

- [#5778](https://github.com/neo4j/graphql/pull/5778) [`56022ba`](https://github.com/neo4j/graphql/commit/56022ba38d8beb6cb5d7bbfb5e856fd57d9660c5) Thanks [@darrellwarde](https://github.com/darrellwarde)! - The deprecated `directed` argument has been removed, and `queryDirection` now only accepts two possible values - `DIRECTED` (default) and `UNDIRECTED`.

    Additionally, the `directedArgument` setting of `excludeDeprecatedFields` has been removed as these deprecated fields have been removed.

- [#5819](https://github.com/neo4j/graphql/pull/5819) [`ac1fa62`](https://github.com/neo4j/graphql/commit/ac1fa629f1eb8b248116bd9dedaabc02117fdbee) Thanks [@angrykoala](https://github.com/angrykoala)! - Single element relationships have been removed in favor of list relationships:

    Before

    ```graphql
    type Movie {
        director: Person @relationship(type: "DIRECTED", direction: "IN")
    }
    ```

    After

    ```graphql
    type Movie {
        director: [Person!]! @relationship(type: "DIRECTED", direction: "IN")
    }
    ```

    This requires updating filters, clients and auth rules to use the list filter operations.

    Single element relationships cannot be reliably enforced, leading to a data inconsistent with the schema. If the GraphQL model requires 1-1 relationships (such as in federations) these can now be achieved with the `@cypher` directive instead:

    ```graphql
    type Movie {
        director: Person
            @cypher(
                statement: """
                MATCH(this)-[:ACTED_IN]->(p:Person)
                RETURN p
                """
                columnName: "p"
            )
    }
    ```

- [#5762](https://github.com/neo4j/graphql/pull/5762) [`87e416b`](https://github.com/neo4j/graphql/commit/87e416b2547b75824d9782fd5da90c003437e7c0) Thanks [@darrellwarde](https://github.com/darrellwarde)! - There have been major changes to the way that full-text search operates.

    The directive now requires the specification of an index name, query name, and indexed fields.

    ```graphql
    input FulltextInput {
        indexName: String!
        queryName: String!
        fields: [String]!
    }

    """
    Informs @neo4j/graphql that there should be a fulltext index in the database, allows users to search by the index in the generated schema.
    """
    directive @fulltext(indexes: [FulltextInput]!) on OBJECT
    ```

    Here is an example of how this might be used:

    ```graphql
    type Movie @node @fulltext(indexName: "movieTitleIndex", queryName: "moviesByTitle", fields: ["title"]) {
        title: String!
    }
    ```

    Full-text search was previously available in two different locations.

    The following form has now been completely removed:

    ```graphql
    # Removed
    {
        movies(fulltext: { movieTitleIndex: { phrase: "The Matrix" } }) {
            title
        }
    }
    ```

    The following form as a root-level query has been changed:

    ```graphql
    # Old query
    query {
        moviesByTitle(phrase: "The Matrix") {
            score
            movies {
                title
            }
        }
    }

    # New query
    query {
        moviesByTitle(phrase: "The Matrix") {
            edges {
                score
                node {
                    title
                }
            }
        }
    }
    ```

    The new form is as a Relay connection, which allows for pagination using cursors and access to the `pageInfo` field.

- [#5820](https://github.com/neo4j/graphql/pull/5820) [`d8d59f8`](https://github.com/neo4j/graphql/commit/d8d59f80480017d27b49b062321a9a15b6494a96) Thanks [@MacondoExpress](https://github.com/MacondoExpress)! - Change the way how `@node` behaves, `@node` is now required, and GraphQL Object types without the directive `@node` will no longer considered as a Neo4j Nodes representation.
  Queries and Mutations will be generated only for types with the `@node` directive.

- [#5801](https://github.com/neo4j/graphql/pull/5801) [`95ce8bb`](https://github.com/neo4j/graphql/commit/95ce8bb884bddaf20d751f2448b5504a7b94d081) Thanks [@darrellwarde](https://github.com/darrellwarde)! - Implicit filtering fields have been removed, please use the explicit versions:

    ```graphql
    # Old syntax
    {
        movies(where: { title: "The Matrix" }) {
            title
        }
    }

    # New syntax
    {
        movies(where: { title_EQ: "The Matrix" }) {
            title
        }
    }
    ```

    The `implicitEqualFilters` option of `excludeDeprecatedFields` has been removed.

- [#5755](https://github.com/neo4j/graphql/pull/5755) [`9c75f92`](https://github.com/neo4j/graphql/commit/9c75f925884de42f64e1b5c3086cc87c114727bd) Thanks [@angrykoala](https://github.com/angrykoala)! - Remove support for `@unique` directive

- [#5768](https://github.com/neo4j/graphql/pull/5768) [`e338590`](https://github.com/neo4j/graphql/commit/e338590d25216cced8252cfe3d0789d97952c20d) Thanks [@angrykoala](https://github.com/angrykoala)! - Remove `overwrite` field in connect operations

- [#5777](https://github.com/neo4j/graphql/pull/5777) [`0ecfd71`](https://github.com/neo4j/graphql/commit/0ecfd71a1431c5f98fde30319eefd5b018a06701) Thanks [@darrellwarde](https://github.com/darrellwarde)! - The deprecated `options` argument has been removed.

    Consider the following type definitions:

    ```graphql
    type Movie {
        title: String!
    }
    ```

    The migration is as below:

    ```graphql
    # Old syntax
    {
        movies(options: { first: 10, offset: 10, sort: [{ title: ASC }] }) {
            title
        }
    }

    # New syntax
    {
        movies(first: 10, offset: 10, sort: [{ title: ASC }]) {
            title
        }
    }
    ```

    The `deprecatedOptionsArgument` of `excludeDeprecatedFields` has been removed as it is now a no-op.

- [#5802](https://github.com/neo4j/graphql/pull/5802) [`99cb9aa`](https://github.com/neo4j/graphql/commit/99cb9aa866eed04224d790bfccab9c3d3add78b7) Thanks [@darrellwarde](https://github.com/darrellwarde)! - Implicit set operations have been removed. For example:

    ```graphql
    # Old syntax
    mutation {
        updateMovies(where: { title_EQ: "Matrix" }, update: { title: "The Matrix" }) {
            movies {
                title
            }
        }
    }

    # New syntax
    mutation {
        updateMovies(where: { title_EQ: "Matrix" }, update: { title_SET: "The Matrix" }) {
            movies {
                title
            }
        }
    }
    ```

    The `implicitSet` argument of `excludeDeprecatedFields` has been removed.

- [#5789](https://github.com/neo4j/graphql/pull/5789) [`1a07d40`](https://github.com/neo4j/graphql/commit/1a07d40888e89c5cd9a40edc16f1742e27bff687) Thanks [@darrellwarde](https://github.com/darrellwarde)! - The Neo4j GraphQL Library and Introspector now required Node.js 22 or greater.

### Patch Changes

- [#5837](https://github.com/neo4j/graphql/pull/5837) [`721691a`](https://github.com/neo4j/graphql/commit/721691a84eaa34996c0c97edb7ede1ae4775dd2f) Thanks [@MacondoExpress](https://github.com/MacondoExpress)! - Added a validation rule to avoid defining fields as lists of nullable elements, as Neo4j does not support this.
  Will normally generate the following Cypher for the relationship:

    ```cypher
    MATCH (this:Movie)-[this0:`ACTED IN`]->(this1:Actor)
    ```

    The label `ACTED IN` is escaped by placing it inside backticks (`\``), as some characters in it are susceptible of code injection.

    If the option `disableRelationshipTypeEscaping` is set in `Neo4jGraphQL`, this safety mechanism will be disabled:

    ```js
    new Neo4jGraphQL({
        typeDefs,
        features: {
            unsafeEscapeOptions: {
                disableRelationshipTypeEscaping: true,
            },
        },
    });
    ```

    Generating the following (incorrect) Cypher instead:

    ```cypher
    MATCH (this:Movie)-[this0:ACTED IN]->(this1:Actor)
    ```

    This can be useful in very custom scenarios where the Cypher needs to be tweaked or if the labels and types have already been escaped.

    > Warning: This is a safety mechanism to avoid Cypher injection. Changing these options may lead to code injection and an unsafe server.

- [#6042](https://github.com/neo4j/graphql/pull/6042) [`9ff8a10`](https://github.com/neo4j/graphql/commit/9ff8a1010d1e87d494adc3969f0f8110351ee584) Thanks [@MacondoExpress](https://github.com/MacondoExpress)! - Fixed bug that causes connection fields for interfaces to not be able to be filtered using the typename filters.

## 6.6.1

### Patch Changes

- [#6171](https://github.com/neo4j/graphql/pull/6171) [`c75cda3`](https://github.com/neo4j/graphql/commit/c75cda3cfc63b9cd4e3328762d880516b48497ee) Thanks [@angrykoala](https://github.com/angrykoala)! - Cypher optimized for connections only containing aggregate fields. The following query:

    ```graphql
    {
        moviesConnection {
            aggregate {
                count {
                    nodes
                }
            }
        }
    }
    ```

    Will generate the new Cypher:

    ```cypher
    CALL {
        MATCH (this:Movie)
        RETURN { nodes: count(DISTINCT this) } AS var0
    }
    RETURN { aggregate: { count: var0 } } AS this
    ```

    Instead of the less performant previous Cypher:

    ```cypher
    CALL {
        MATCH (this:Movie)
        RETURN { nodes: count(DISTINCT this) } AS var0
    }
    CALL {
        WITH *
        MATCH (this1:Movie)
        WITH collect({ node: this1 }) AS edges
        WITH edges, size(edges) AS totalCount
        CALL {
            WITH edges
            UNWIND edges AS edge
            WITH edge.node AS this1
            RETURN collect({ node: { __id: id(this1), __resolveType: "Movie" } }) AS var2
        }
        RETURN var2, totalCount
    }
    RETURN { edges: var2, totalCount: totalCount, aggregate: { count: var0 } } AS this
    ```

> > > > > > > origin/dev

## 6.6.0

### Minor Changes

- [#6110](https://github.com/neo4j/graphql/pull/6110) [`100a603`](https://github.com/neo4j/graphql/commit/100a6035375c3c0c2d91ebca6d521cdb67784508) Thanks [@darrellwarde](https://github.com/darrellwarde)! - The `where` field for nested update operations has been deprecated to be moved within the `update` input field.
  The `where` in its deprecated location is a no-op for all nested operations apart from `update`.

    For example, the following mutation is using the deprecated syntax:

    ```graphql
    mutation {
        updateUsers(
            where: { name: { eq: "Darrell" } }
            update: {
                posts: {
                    where: { node: { title: { eq: "Version 7 Release Notes" } } }
                    update: { node: { title: { set: "Version 7 Release Announcement" } } }
                }
            }
        )
    }
    ```

    It should be modified to move the `where` inside the `update` operation:

    ```graphql
    mutation {
        updateUsers(
            where: { name: { eq: "Darrell" } }
            update: {
                posts: {
                    update: {
                        where: { node: { title: { eq: "Version 7 Release Notes" } } }
                        node: { title: { set: "Version 7 Release Announcement" } }
                    }
                }
            }
        )
    }
    ```

### Patch Changes

- [#6126](https://github.com/neo4j/graphql/pull/6126) [`7af4bbd`](https://github.com/neo4j/graphql/commit/7af4bbddb399384ef39fe700f8c14620d4210adb) Thanks [@angrykoala](https://github.com/angrykoala)! - Add `overwriteArgument` option to `excludeDeprecatedFields` to remove the argument `overwrite` from connect operations

## 6.5.3

### Patch Changes

- [#6106](https://github.com/neo4j/graphql/pull/6106) [`c3619e8`](https://github.com/neo4j/graphql/commit/c3619e84ab0059dcd047c9e11536fab793f7a075) Thanks [@mjfwebb](https://github.com/mjfwebb)! - Typescript version has been updated to 5.8.2 slightly changing the emitted code. This change is not expected to have any impact on the generated code or the runtime behavior of the library.

## 6.5.2

### Patch Changes

- [#6081](https://github.com/neo4j/graphql/pull/6081) [`90d9b58`](https://github.com/neo4j/graphql/commit/90d9b58aca400b47ffdee237a88204fc3706c1fa) Thanks [@angrykoala](https://github.com/angrykoala)! - Fix missing authentication rules for interfaces in aggregate fields in connections.

## 6.5.1

### Patch Changes

- [#6079](https://github.com/neo4j/graphql/pull/6079) [`7e9a0bd`](https://github.com/neo4j/graphql/commit/7e9a0bdb9ca4eded026e4230794cb6de58949835) Thanks [@angrykoala](https://github.com/angrykoala)! - Fix edge filtering for aggregate fields inside connections.

    Previously, the following query would aggregate all the movies named The Matrix, ignoring the edge filter

    ```graphql
    query {
        actors {
            moviesConnection(where: { edge: { screentime_EQ: 19 }, node: { title_EQ: "The Matrix" } }) {
                aggregate {
                    node {
                        title {
                            longest
                        }
                    }
                }
            }
        }
    }
    ```

## 6.5.0

### Minor Changes

- [#6003](https://github.com/neo4j/graphql/pull/6003) [`2952820`](https://github.com/neo4j/graphql/commit/2952820ff891c3c3405158247d191b7dedba3e9e) Thanks [@angrykoala](https://github.com/angrykoala)! - Add count fields in aggregations with support for nodes and edges count:

    ```graphql
    query {
        moviesConnection {
            aggregate {
                count {
                    nodes
                }
            }
        }
    }
    ```

    ```graphql
    query {
        movies {
            actorsConnection {
                aggregate {
                    count {
                        nodes
                        edges
                    }
                }
            }
        }
    }
    ```

- [#5944](https://github.com/neo4j/graphql/pull/5944) [`a6e9486`](https://github.com/neo4j/graphql/commit/a6e94867da3c7989fb4162bbb738506485859be6) Thanks [@angrykoala](https://github.com/angrykoala)! - Add aggregate field in connection:

    ```graphql
    query {
        moviesConnection {
            aggregate {
                node {
                    count
                    int {
                        longest
                    }
                }
            }
        }
    }
    ```

### Patch Changes

- [#5999](https://github.com/neo4j/graphql/pull/5999) [`47f915e`](https://github.com/neo4j/graphql/commit/47f915e6e2a93c3eba23232adad6fa165b13b8fa) Thanks [@angrykoala](https://github.com/angrykoala)! - Deprecate aggregation fields (e.g `actedInAggregate`) in favor of the field `aggregate` inside the connection (e.g `actedInConnection -> aggregate`)

- [#5944](https://github.com/neo4j/graphql/pull/5944) [`a6e9486`](https://github.com/neo4j/graphql/commit/a6e94867da3c7989fb4162bbb738506485859be6) Thanks [@angrykoala](https://github.com/angrykoala)! - Deprecate old aggregate operations:

    ```graphql
    query {
        moviesAggregate {
            count
            rating {
                min
            }
        }
    }
    ```

    These fields can be completely removed from the schema with the new flag `deprecatedAggregateOperations`:

    ```js
    const neoSchema = new Neo4jGraphQL({
        typeDefs,
        features: { excludeDeprecatedFields: { deprecatedAggregateOperations: true } },
    });
    ```

## 6.4.0

### Minor Changes

- [#6029](https://github.com/neo4j/graphql/pull/6029) [`f792a02`](https://github.com/neo4j/graphql/commit/f792a0259ad489b95e6241c20be6d27525712f3b) Thanks [@darrellwarde](https://github.com/darrellwarde)! - Add a new field directive `@sortable` which can be used to configure whether results can be sorted by field values or not.

### Patch Changes

- [#6046](https://github.com/neo4j/graphql/pull/6046) [`dcf4c76`](https://github.com/neo4j/graphql/commit/dcf4c761b21e8dbce8436e4000eae53f9780923c) Thanks [@angrykoala](https://github.com/angrykoala)! - Add `unsafeEscapeOptions` to `Neo4jGraphQL` features with the following flags:
    - `disableRelationshipTypeEscaping` (default to `false`)
    - `disableNodeLabelEscaping` (defaults to `false`)

    These flags remove the automatic escaping of node labels and relationship types in the generated Cypher.

    For example, given the following schema:

    ```graphql
    type Actor {
        name: String!
    }

    type Movie {
        title: String!
        actors: [Actor!]! @relationship(type: "ACTED IN", direction: OUT)
    }
    ```

    A GraphQL query going through the `actors` relationship:

    ```graphql
    query {
        movies {
            title
            actors {
                name
            }
        }
    }
    ```

- [#5873](https://github.com/neo4j/graphql/pull/5873) [`17911fc`](https://github.com/neo4j/graphql/commit/17911fc197105f5fafc06ce851669af6fc07b18a) Thanks [@MacondoExpress](https://github.com/MacondoExpress)! - Introduce a new style for filtering relationships and connections.
  The quantifiers `SOME` | `NONE` | `SINGLE` | `ALL` are now available as a nested input object.

    **Relationship**

    ```graphql
    {
        movies(where: { genres: { some: { name: { equals: "some genre" } } } }) {
            actorCount
        }
    }
    ```

    **Connection**

    ```graphql
    {
        movies(where: { genresConnection: { some: { node: { name: { equals: "some genre" } } } } }) {
            actorCount
        }
    }
    ```

### Patch Changes

- [#5871](https://github.com/neo4j/graphql/pull/5871) [`722c650`](https://github.com/neo4j/graphql/commit/722c6507977072122041e985b94a84a707179f39) Thanks [@angrykoala](https://github.com/angrykoala)! - Deprecate individual mutations in favor of generic mutations
    - `_SET`
    - `_POP`
    - `_PUSH`
    - `_INCREMENT`
    - `_ADD`
    - `_DECREMENT`
    - `_SUBTRACT`
    - `_MULTIPLY`
    - `_DIVIDE`

- [#5882](https://github.com/neo4j/graphql/pull/5882) [`7254acf`](https://github.com/neo4j/graphql/commit/7254acf1b7bb83a35cea580143a6012355bc02d8) Thanks [@angrykoala](https://github.com/angrykoala)! - Deprecates old aggregation filters for relationships in favor of more generic filters:

    Before:

    ```js
    query Movies {
      movies(
        where: { actorsAggregate: { node: { lastRating_AVERAGE_GT: 6 } } }
      ) {
        title
      }
    }
    ```

    Now:

    ```js
    query Movies {
      movies(
        where: {
          actorsAggregate: { node: { lastRating: { average: { gt: 6 } } } }
        }
      ) {
        title
      }
    }
    ```

- [#5897](https://github.com/neo4j/graphql/pull/5897) [`4f3b068`](https://github.com/neo4j/graphql/commit/4f3b068cfe4123109bb8a27bacef775fb897a87e) Thanks [@MacondoExpress](https://github.com/MacondoExpress)! - Deprecate relationship filtering using the non-generic version such as `actors_SOME: { title_EQ: "The Matrix" }` in favor of the generic input `actors: { some: { title: { eq: "The Matrix" } } }`.
  The setting `excludeDeprecatedFields` now contains the option `relationshipFilters` to remove these deprecated filters.

- [#5897](https://github.com/neo4j/graphql/pull/5897) [`917482b`](https://github.com/neo4j/graphql/commit/917482b675ec3de7dc06ca110e2fccf93024115f) Thanks [@MacondoExpress](https://github.com/MacondoExpress)! - Deprecate attribute filtering using the non-generic version such as `title_EQ: "The Matrix"` in favor of the generic input `title: { eq: "The Matrix" }`.
  The setting `excludeDeprecatedFields` now contains the option `attributeFilters` to remove these deprecated filters.

- [#5879](https://github.com/neo4j/graphql/pull/5879) [`5c7ba22`](https://github.com/neo4j/graphql/commit/5c7ba22afc8fc0df86a148f31ce61691586f8cf3) Thanks [@angrykoala](https://github.com/angrykoala)! - Add generic filters for aggregations:

    ```graphql
    {
        posts(where: { likesAggregate: { node: { rating: { average: { eq: 3.2 } } } } }) {
            title
        }
    }
    ```

- [#5882](https://github.com/neo4j/graphql/pull/5882) [`7254acf`](https://github.com/neo4j/graphql/commit/7254acf1b7bb83a35cea580143a6012355bc02d8) Thanks [@angrykoala](https://github.com/angrykoala)! - Introduce the flag "aggregationFilters" to remove deprecated aggregation filters:

    ```js
    const neoSchema = new Neo4jGraphQL({
        typeDefs,
        features: { excludeDeprecatedFields: { aggregationFilters: true } },
    });
    ```

## 6.3.1

### Patch Changes

- [#5952](https://github.com/neo4j/graphql/pull/5952) [`4e14680`](https://github.com/neo4j/graphql/commit/4e1468076bbd23cdd9156b039de1d03bbc68942c) Thanks [@angrykoala](https://github.com/angrykoala)! - Add `addVersionPrefix` to `cypherQueryOptions` in context to add a Cypher version with `CYPHER` before each query:

    ```js
    {
        cypherQueryOptions: {
            addVersionPrefix: true,
        },
    }
    ```

    This prepends all Cypher queries with a `CYPHER [version]` statement:

    ```cypher
    CYPHER 5
    MATCH (this:Movie)
    WHERE this.title = $param0
    RETURN this { .title } AS this
    ```

## 6.3.0

### Minor Changes

- [#5934](https://github.com/neo4j/graphql/pull/5934) [`c666adc`](https://github.com/neo4j/graphql/commit/c666adcf06e26a93687ee1732e386b84752dc5c7) Thanks [@MacondoExpress](https://github.com/MacondoExpress)! - Introduced the `typename` filter that superseded the `typename_IN` filter.
  As part of the change, the flag `typename_IN` has been added to the `excludeDeprecatedFields` setting.

    ```js
    const neoSchema = new Neo4jGraphQL({
        typeDefs,
        features: { excludeDeprecatedFields: { typename_IN: true } },
    });
    ```

### Patch Changes

- [#5937](https://github.com/neo4j/graphql/pull/5937) [`7f1bc65`](https://github.com/neo4j/graphql/commit/7f1bc6577d7512086658e06481b4f9989381956d) Thanks [@MacondoExpress](https://github.com/MacondoExpress)! - Aggregations on ID fields are now deprecated.
  As part of the change, the flag `idAggregations` has been added to the `excludeDeprecatedFields` setting.

    ```js
    const neoSchema = new Neo4jGraphQL({
        typeDefs,
        features: { excludeDeprecatedFields: { idAggregations: true } },
    });
    ```

- [#5943](https://github.com/neo4j/graphql/pull/5943) [`6153d68`](https://github.com/neo4j/graphql/commit/6153d686471741b9a35710ced8872ca664263dae) Thanks [@darrellwarde](https://github.com/darrellwarde)! - Fix Cypher when filtering by aggregations over different relationship properties types

- [#5953](https://github.com/neo4j/graphql/pull/5953) [`ebbb921`](https://github.com/neo4j/graphql/commit/ebbb92136ef834a8d1b923ed4a4e8c0a11505924) Thanks [@angrykoala](https://github.com/angrykoala)! - Add support for CalVer editions of neo4j

## 6.2.3

### Patch Changes

- [#5904](https://github.com/neo4j/graphql/pull/5904) [`64d4da1`](https://github.com/neo4j/graphql/commit/64d4da1de868f4ab1be60d42940f7e4193099387) Thanks [@a-alle](https://github.com/a-alle)! - Fix error message for wrong `requireAuthentication` argument on `@authorization` directive

- [#5906](https://github.com/neo4j/graphql/pull/5906) [`80df6f3`](https://github.com/neo4j/graphql/commit/80df6f3f8c36d2b8e248c4b5490ae1821844c40f) Thanks [@mjfwebb](https://github.com/mjfwebb)! - Fixed a bug that appears when filtering on interface relationships

## 6.2.2

### Patch Changes

- [#5888](https://github.com/neo4j/graphql/pull/5888) [`3037bb9`](https://github.com/neo4j/graphql/commit/3037bb95fd029cdf74c0aaf5c5f85244da55ed26) Thanks [@darrellwarde](https://github.com/darrellwarde)! - Fix discrepancy of relationship direction when filtering

- [#5869](https://github.com/neo4j/graphql/pull/5869) [`34725f6`](https://github.com/neo4j/graphql/commit/34725f68cd041975ffecc9145139cfc15ba8d83e) Thanks [@angrykoala](https://github.com/angrykoala)! - Deprecates `@private` directive. The private directive was aimed to be used in conjunction with the OGM, which is no longer supported.

- [#5888](https://github.com/neo4j/graphql/pull/5888) [`3037bb9`](https://github.com/neo4j/graphql/commit/3037bb95fd029cdf74c0aaf5c5f85244da55ed26) Thanks [@darrellwarde](https://github.com/darrellwarde)! - Fix incorrect relationship direction when performing a delete operation nested under a delete operation

## 6.2.1

### Patch Changes

- [#5861](https://github.com/neo4j/graphql/pull/5861) [`f2e1575`](https://github.com/neo4j/graphql/commit/f2e15751657725abd9086b1fdce13b360bd72eab) Thanks [@darrellwarde](https://github.com/darrellwarde)! - Fixed bug where fields decorated with `@customResolver` were included in the projection of the generated Cypher query

- [#5865](https://github.com/neo4j/graphql/pull/5865) [`258ff53`](https://github.com/neo4j/graphql/commit/258ff53204746ce04828f6ff5ad6422260a3c895) Thanks [@darrellwarde](https://github.com/darrellwarde)! - `@default` directive fixed to work as expected on fields of temporal type, and `BigInt` fields

## 6.2.0

### Minor Changes

- [#5856](https://github.com/neo4j/graphql/pull/5856) [`49549cd`](https://github.com/neo4j/graphql/commit/49549cd0d7805ae8500f05bdd509941d3e754880) Thanks [@mjfwebb](https://github.com/mjfwebb)! - Add filtering on many to many relationship custom cypher fields

## 6.1.1

### Patch Changes

- [#5835](https://github.com/neo4j/graphql/pull/5835) [`cc1a8dd`](https://github.com/neo4j/graphql/commit/cc1a8ddde06059f1d2aa481e68a433535649f152) Thanks [@angrykoala](https://github.com/angrykoala)! - Add support for filtering GraphQL only events in CDC subscriptions with the option `onlyGraphQLEvents` passed to `Neo4jGraphQLSubscriptionsCDCEngine`

    ```ts
    const engine = new Neo4jGraphQLSubscriptionsCDCEngine({
        driver,
        onlyGraphQLEvents: true,
    });

    const neoSchema = new Neo4jGraphQL({
        typeDefs,
        driver,
        features: {
            subscriptions: engine,
        },
    });
    ```

- [#5834](https://github.com/neo4j/graphql/pull/5834) [`67f915e`](https://github.com/neo4j/graphql/commit/67f915e05c029ce9a595c05cf2f42de232ff2d37) Thanks [@angrykoala](https://github.com/angrykoala)! - CDC subscription optimization. Only node events with labels present in the GraphQL schema will be queried. This will reduce the number of subscription events queried by skipping events to nodes that cannot be subscribed through GraphQL

## 6.1.0

### Minor Changes

- [#5746](https://github.com/neo4j/graphql/pull/5746) [`c581f9e`](https://github.com/neo4j/graphql/commit/c581f9e02b232bf09277ee76aac930eace0877f6) Thanks [@mjfwebb](https://github.com/mjfwebb)! - Add filtering on 1 to 1 relationship custom cypher fields

### Patch Changes

- [#5738](https://github.com/neo4j/graphql/pull/5738) [`c6ea37d`](https://github.com/neo4j/graphql/commit/c6ea37dd0ec8485812906bbb7a3b09ae27a54c2f) Thanks [@angrykoala](https://github.com/angrykoala)! - Add deprecation warning when using `@unique`

- [#5788](https://github.com/neo4j/graphql/pull/5788) [`62a9f61`](https://github.com/neo4j/graphql/commit/62a9f618b7e19813a4c0f162e894aebbe065813a) Thanks [@angrykoala](https://github.com/angrykoala)! - Deprecate single element relationships:

    ```graphql
    type Movie {
        director: Person @relationship(type: "DIRECTED", direction: "IN")
    }
    ```

    In favor of list relationships:

    ```graphql
    type Movie {
        director: [Person!]! @relationship(type: "DIRECTED", direction: "IN")
    }
    ```

    1-1 relationships cannot be reliably enforced, leading to a data inconsistent between the schema and the database. For this reason, these have been removed in favor of the more accurate list relationships.

- [#5771](https://github.com/neo4j/graphql/pull/5771) [`c56f9b0`](https://github.com/neo4j/graphql/commit/c56f9b03b10c833099cf9a876b9a62278c152465) Thanks [@MacondoExpress](https://github.com/MacondoExpress)! - Deprecate implicit `SET`:

    ```graphql
    mutation {
        updateMovies(update: { id: "2" }) {
            movies {
                id
            }
        }
    }
    ```

    in favour of the explicit `_SET` version:

    ```graphql
    mutation {
        updateMovies(update: { id_SET: "2" }) {
            movies {
                id
            }
        }
    }
    ```

- [#5771](https://github.com/neo4j/graphql/pull/5771) [`f624668`](https://github.com/neo4j/graphql/commit/f624668345939c34dc2f4af56315922ec376d585) Thanks [@MacondoExpress](https://github.com/MacondoExpress)! - Added `implicitSet` to the `excludeDeprecatedFields` setting, to disable generation of the deprecated mutation field without the suffix `_SET`.

- [#5758](https://github.com/neo4j/graphql/pull/5758) [`7521476`](https://github.com/neo4j/graphql/commit/752147634df57dcfc167e9b1e13943728b80e6e8) Thanks [@angrykoala](https://github.com/angrykoala)! - Argument `overwrite` in `connect` operations has been deprecated

- [#5748](https://github.com/neo4j/graphql/pull/5748) [`f23bb91`](https://github.com/neo4j/graphql/commit/f23bb91a8afc0ff5d7ca5f0c4d8f867d30127e0b) Thanks [@darrellwarde](https://github.com/darrellwarde)! - The `connectOrCreate` operation has been deprecated and will be removed in the next major version of the Neo4j GraphQL Library. Its implementation has always been more limited than the other operations, so the decision has been taken to remove it for the time being with a view of potentially refocussing on it again in the future.

- [#5764](https://github.com/neo4j/graphql/pull/5764) [`1ec1bd3`](https://github.com/neo4j/graphql/commit/1ec1bd35a375d3f42e394fffe2d74f62bb4c8359) Thanks [@darrellwarde](https://github.com/darrellwarde)! - Fix issues #5759 and #5760 to do with sorting vector search results

## 6.0.0

### Major Changes

- [#5638](https://github.com/neo4j/graphql/pull/5638) [`cab1a8d`](https://github.com/neo4j/graphql/commit/cab1a8db4433f0390fa2508d80efa2c022e90e7a) Thanks [@darrellwarde](https://github.com/darrellwarde)! - The Neo4j GraphQL Library now requires a Neo4j 5.x database.

- [#5639](https://github.com/neo4j/graphql/pull/5639) [`4438b60`](https://github.com/neo4j/graphql/commit/4438b60ab2cad59320f348fa3ac912dd1c75dab4) Thanks [@darrellwarde](https://github.com/darrellwarde)! - Remove aggregation filters which are not actually aggregation filters, which were deprecated in 5.x.

- [#5637](https://github.com/neo4j/graphql/pull/5637) [`8832dd6`](https://github.com/neo4j/graphql/commit/8832dd67cfc30faa920dc17831cb241bca757911) Thanks [@darrellwarde](https://github.com/darrellwarde)! - Remove deprecated relationship filters without suffix. Queries which previously used these should migrate over to `_SOME` filters.

- [#5662](https://github.com/neo4j/graphql/pull/5662) [`98e04db`](https://github.com/neo4j/graphql/commit/98e04db04fec55bbd244bc15c52a04a3f6e43057) Thanks [@angrykoala](https://github.com/angrykoala)! - Remove support for relationship subscriptions:
    - `*RelationshipCreated`
    - `*RelationshipDeleted`

- [#5648](https://github.com/neo4j/graphql/pull/5648) [`c716439`](https://github.com/neo4j/graphql/commit/c716439b69514f4c854c3299add992a2e9dac8c6) Thanks [@darrellwarde](https://github.com/darrellwarde)! - Remove no-op option to remove `stringAggregation` deprecated fields.

- [#5634](https://github.com/neo4j/graphql/pull/5634) [`7e356f1`](https://github.com/neo4j/graphql/commit/7e356f17330d5567e77f182d8186b5bfa7052581) Thanks [@darrellwarde](https://github.com/darrellwarde)! - The deprecated `bookmark` field has been removed due to bookmarks now be handled internally by the database driver.

- [#5703](https://github.com/neo4j/graphql/pull/5703) [`a3bd747`](https://github.com/neo4j/graphql/commit/a3bd747c6292220aa7ef2582307b6e658d1e4fe2) Thanks [@MacondoExpress](https://github.com/MacondoExpress)! - Fixed a bug that caused `@cypher` field to be added as sortable fields in the schema even for not supported cases

- [#5713](https://github.com/neo4j/graphql/pull/5713) [`55c2ed6`](https://github.com/neo4j/graphql/commit/55c2ed685d459da2d4f23718a13e6d0f4b4166f3) Thanks [@MacondoExpress](https://github.com/MacondoExpress)! - Remove `connectComponentsPlanner` argument from the `CypherQueryOptions`

- [#5662](https://github.com/neo4j/graphql/pull/5662) [`98e04db`](https://github.com/neo4j/graphql/commit/98e04db04fec55bbd244bc15c52a04a3f6e43057) Thanks [@angrykoala](https://github.com/angrykoala)! - Removes support for non-cdc subscriptions. This means the only available engine for subscriptions is `Neo4jGraphQLSubscriptionsCDCEngine`:

    ```ts
    new Neo4jGraphQL({
        typeDefs,
        driver,
        features: {
            subscriptions: new Neo4jGraphQLSubscriptionsCDCEngine({
                driver,
            }),
        },
    });
    ```

    The default behaviour of subscriptions has also been updated to use CDC, so now passing `true` will use the CDC engine with the default parameters and driver:

    ```ts
    new Neo4jGraphQL({
        typeDefs,
        driver,
        features: {
            subscriptions: true,
        },
    });
    ```

- [#5624](https://github.com/neo4j/graphql/pull/5624) [`87917e4`](https://github.com/neo4j/graphql/commit/87917e41cf79023ae20323274631df2dc8543da5) Thanks [@MacondoExpress](https://github.com/MacondoExpress)! - Removed deprecated `_NOT` filters, use the Boolean operator `NOT` instead.

    ** deprecated syntax **

    ```graphql
    query {
        movies(where: { title_NOT: "The Matrix" }) {
            title
        }
    }
    ```

    ** recommended syntax **

    ```graphql
    query {
        movies(where: { NOT: { title: "The Matrix" } }) {
            title
        }
    }
    ```

    As part of the change, the option: `negationFilters` was removed from the `excludeDeprecatedFields` settings.

- [#5649](https://github.com/neo4j/graphql/pull/5649) [`8206edd`](https://github.com/neo4j/graphql/commit/8206eddb54597d60012c8e30cc0c033b2714348f) Thanks [@darrellwarde](https://github.com/darrellwarde)! - The deprecated `options` argument of `assertIndexesAndConstraints` has been removed. Database migrations are outside of the scope of the Neo4j GraphQL Library, and all indexes and constraints will have to be managed manually.

- [#5630](https://github.com/neo4j/graphql/pull/5630) [`af866e0`](https://github.com/neo4j/graphql/commit/af866e058d7ba05f50fe0986cbbf63f252439e09) Thanks [@angrykoala](https://github.com/angrykoala)! - Remove deprecated top level arguments for nested operations in mutations:
    - create
    - delete
    - connect
    - disconnect
    - connectOrCreate

    For example, the following is no longer valid:

    _invalid_

    ```graphql
    mutation UpdatePeople {
        updatePeople(create: { movies: { node: { title: "The Good" } } }) {
            people {
                name
            }
        }
    }
    ```

    _valid_

    ```graphql
    mutation UpdatePeople {
        updatePeople(update: { movies: { create: { node: { title: "The Good" } } } }) {
            people {
                name
            }
        }
    }
    ```

- [#5608](https://github.com/neo4j/graphql/pull/5608) [`2174267`](https://github.com/neo4j/graphql/commit/2174267cbe4defb9d08c3da98a54a0ad0033044f) Thanks [@MacondoExpress](https://github.com/MacondoExpress)! - Changed the generated `sort` argument on the top-level Connection field as a list of non-nullable elements in case the target is an Interface.

    From:

    ```graphql
    productionsConnection(after: String, first: Int, sort: [ProductionSort], where: ProductionWhere): ProductionsConnection!
    ```

    To:

    ```graphql
    productionsConnection(after: String, first: Int, sort: [ProductionSort!], where: ProductionWhere): ProductionsConnection!
    ```

- [#5668](https://github.com/neo4j/graphql/pull/5668) [`ffb2ae3`](https://github.com/neo4j/graphql/commit/ffb2ae31cde5e07ff6c09ec1f592512909f69f81) Thanks [@angrykoala](https://github.com/angrykoala)! - Remove exported types for custom subscriptions engine:
    - `Neo4jGraphQLSubscriptionsEngine`
    - `SubscriptionsEvent`

- [#5693](https://github.com/neo4j/graphql/pull/5693) [`8322ec3`](https://github.com/neo4j/graphql/commit/8322ec388f84aaa33cb2dfbee0a7fb26a228aa29) Thanks [@angrykoala](https://github.com/angrykoala)! - Throws an error when the same field is updated multiple times on same update operation.

    For example:

    ```graphql
    mutation {
        updateMovies(update: { tags_POP: 1, tags_PUSH: "d" }) {
            movies {
                title
                tags
            }
        }
    }
    ```

- [#5654](https://github.com/neo4j/graphql/pull/5654) [`3332ac6`](https://github.com/neo4j/graphql/commit/3332ac6f9a9e56827f3065abbe9752cb79d85401) Thanks [@MacondoExpress](https://github.com/MacondoExpress)! - Removed deprecated string aggregation filters as `name_SHORTEST_GT` in favor of the `_LENGTH` version: `name_SHORTEST_LENGTH_GT`.

- [#5638](https://github.com/neo4j/graphql/pull/5638) [`cab1a8d`](https://github.com/neo4j/graphql/commit/cab1a8db4433f0390fa2508d80efa2c022e90e7a) Thanks [@darrellwarde](https://github.com/darrellwarde)! - The Neo4j GraphQL Library now requires Node.js 20 or greater.

- [#5654](https://github.com/neo4j/graphql/pull/5654) [`38be579`](https://github.com/neo4j/graphql/commit/38be5798fabea053887aaf8c366311dd3cf86139) Thanks [@MacondoExpress](https://github.com/MacondoExpress)! - Removed `aggregationFilters` from `excludeDeprecatedFields` settings.

### Minor Changes

- [#5636](https://github.com/neo4j/graphql/pull/5636) [`74e4d30`](https://github.com/neo4j/graphql/commit/74e4d30d1cf6566aff5312de61efc508d9876ea0) Thanks [@MacondoExpress](https://github.com/MacondoExpress)! - Added aggregation filter `count_EQ` filters: `{ count_EQ: 10 }`, this is the replacement for the deprecated version `{ count: 10 }`.

- [#5567](https://github.com/neo4j/graphql/pull/5567) [`233aac6`](https://github.com/neo4j/graphql/commit/233aac676ccbe17da3e66cbc2a81dc250fe452c4) Thanks [@MacondoExpress](https://github.com/MacondoExpress)! - Added scalar `_EQ` filters: `{ title_EQ: "The Matrix" }`, this is an alternative version of the deprecated version `{ title: "The Matrix" }`.

### Patch Changes

- [#5636](https://github.com/neo4j/graphql/pull/5636) [`de984a2`](https://github.com/neo4j/graphql/commit/de984a2ab3a8e3e196d2b6064eec2ad139ec3da2) Thanks [@MacondoExpress](https://github.com/MacondoExpress)! - Deprecated implicit aggregation filter: `count`, `{ count: 10 }` in favor of the explicit version: `{ count_EQ: 10 }`.

- [#5608](https://github.com/neo4j/graphql/pull/5608) [`c64f6b4`](https://github.com/neo4j/graphql/commit/c64f6b4a9e46da8e43388ea4be9a4f54cd50a1ae) Thanks [@MacondoExpress](https://github.com/MacondoExpress)! - Deprecated the `options` argument in favor of the limit`, `offset`, and `sort` arguments.

- [#5694](https://github.com/neo4j/graphql/pull/5694) [`887a098`](https://github.com/neo4j/graphql/commit/887a098f1d7b78ef1e15470a0a13d8ee7f537158) Thanks [@MacondoExpress](https://github.com/MacondoExpress)! - Deprecated `DEFAULT_DIRECTED` / `DEFAULT_UNDIRECTED` `DIRECTED_ONLY` / `UNDIRECTED_ONLY` as `@relationship.queryDirection` argument values. The options that started with the `DEFAULT` are deprecated following the deprecation of the generated `directed` argument. The options with the suffix `_ONLY` have been changed to `DIRECTED` / `UNDIRECTED` as the suffix `_ONLY`.

- [#5567](https://github.com/neo4j/graphql/pull/5567) [`233aac6`](https://github.com/neo4j/graphql/commit/233aac676ccbe17da3e66cbc2a81dc250fe452c4) Thanks [@MacondoExpress](https://github.com/MacondoExpress)! - Deprecated implicit scalar filter as `{ title: "The Matrix" }` in favor of the explicit version: `{ title_EQ: "The Matrix" }`.

- [#5567](https://github.com/neo4j/graphql/pull/5567) [`233aac6`](https://github.com/neo4j/graphql/commit/233aac676ccbe17da3e66cbc2a81dc250fe452c4) Thanks [@MacondoExpress](https://github.com/MacondoExpress)! - Add a warning to instruct users about future requirements for marking Neoj4 nodes with the `@node` directive.

- [#5651](https://github.com/neo4j/graphql/pull/5651) [`45e0233`](https://github.com/neo4j/graphql/commit/45e023377c1d26d2e1a584444d26f403f6496e90) Thanks [@darrellwarde](https://github.com/darrellwarde)! - The `directed` argument has been marked as deprecated.

## 5.9.1

### Patch Changes

- [#5458](https://github.com/neo4j/graphql/pull/5458) [`4104217`](https://github.com/neo4j/graphql/commit/410421763e5aadb86546f72e2181a784e73f02c5) Thanks [@renovate](https://github.com/apps/renovate)! - Added a fix in document validation for type definitions using `@customResolver` and authentication/authorization rules

## 5.9.0

### Minor Changes

- [#5633](https://github.com/neo4j/graphql/pull/5633) [`cfa296b`](https://github.com/neo4j/graphql/commit/cfa296babdee3e8bcdb3f6a4eb2250bedc6debc4) Thanks [@angrykoala](https://github.com/angrykoala)! - Remove connection wrapper on vector queries.

    _Previous:_

    ```graphql
    query MovieVectorQuery($vector: [Float!]!) {
        myVectorQuery(vector: $vector) {
            moviesConnection {
                edges {
                    cursor
                    score
                    node {
                        title
                    }
                }
            }
        }
    }
    ```

    _Now:_

    ```graphql
    query MovieVectorQuery($vector: [Float!]!) {
        myVectorQuery(vector: $vector) {
            edges {
                cursor
                score
                node {
                    title
                }
            }
        }
    }
    ```

    Vector index is now a stable feature.

### Patch Changes

- [#5647](https://github.com/neo4j/graphql/pull/5647) [`9feeda9`](https://github.com/neo4j/graphql/commit/9feeda99961292537096fb30e76871a3d27e1d6d) Thanks [@MacondoExpress](https://github.com/MacondoExpress)! - Fix a bug that causes an invalid Cypher generated for authorization filters in the connectOrCreate operation.

## 5.8.0

### Minor Changes

- [#5619](https://github.com/neo4j/graphql/pull/5619) [`142bc0a`](https://github.com/neo4j/graphql/commit/142bc0af7c36e0190d42710d3d4f0f480602672f) Thanks [@mjfwebb](https://github.com/mjfwebb)! - Add cypher filtering on lists of scalars

### Patch Changes

- [#5632](https://github.com/neo4j/graphql/pull/5632) [`3c69066`](https://github.com/neo4j/graphql/commit/3c690668e6cab959b6af598c29477dd77f8807cc) Thanks [@darrellwarde](https://github.com/darrellwarde)! - The `options` argument of `assertIndexesAndConstraints` has been deprecated and the creation of indexes and constraints will no longer be support in the next major version of the library.

- [#5606](https://github.com/neo4j/graphql/pull/5606) [`e4ac1d8`](https://github.com/neo4j/graphql/commit/e4ac1d86009f520eacce26f83585e3fb57cb01ac) Thanks [@angrykoala](https://github.com/angrykoala)! - Fix delete operations inside updates for unions

- [#5616](https://github.com/neo4j/graphql/pull/5616) [`b7552f8`](https://github.com/neo4j/graphql/commit/b7552f8151d22ae3e4b4e04f4d168128600ebfa8) Thanks [@angrykoala](https://github.com/angrykoala)! - Fix cardinality validation on nested unions

## 5.7.1

### Patch Changes

- [#5600](https://github.com/neo4j/graphql/pull/5600) [`d3f4679`](https://github.com/neo4j/graphql/commit/d3f4679d32d3760284feae2d230e32385c4dbd61) Thanks [@mjfwebb](https://github.com/mjfwebb)! - Fix: disable schema generation for filtering on list cypher fields

## 5.7.0

### Minor Changes

- [#5553](https://github.com/neo4j/graphql/pull/5553) [`3a0a69f`](https://github.com/neo4j/graphql/commit/3a0a69fa47dc5ce4e8c60e35f5213ffde582ead8) Thanks [@mjfwebb](https://github.com/mjfwebb)! - Add filtering on scalar custom cypher fields

### Patch Changes

- [#5583](https://github.com/neo4j/graphql/pull/5583) [`d35b00d`](https://github.com/neo4j/graphql/commit/d35b00d0fa19b5c5a5632a3a2485a3ede6d73e3b) Thanks [@angrykoala](https://github.com/angrykoala)! - Deprecates top level arguments for nested operations on updates in favor of traversing the update argument. The deprecated arguments are:
    - create
    - delete
    - connect
    - disconnect
    - connectOrCreate

    For example, for create:

    _deprecated_

    ```graphql
    mutation UpdatePeople {
        updatePeople(create: { movies: { node: { title: "The Good" } } }) {
            people {
                name
            }
        }
    }
    ```

    _recommended_

    ```graphql
    mutation UpdatePeople {
        updatePeople(update: { movies: { create: { node: { title: "The Good" } } } }) {
            people {
                name
            }
        }
    }
    ```

    These deprecated arguments can be removed from the schema with the flag `nestedUpdateOperationsFields` in `excludeDeprecatedFields`:

    ```js
    const neoSchema = new Neo4jGraphQL({
        typeDefs,
        features: {
            excludeDeprecatedFields: {
                nestedUpdateOperationsFields: true,
            },
        },
    });
    ```

- [#5585](https://github.com/neo4j/graphql/pull/5585) [`21c18ee`](https://github.com/neo4j/graphql/commit/21c18eeef5cff1758daea6f412d6d9b69087d90b) Thanks [@mjfwebb](https://github.com/mjfwebb)! - Fix: standard JWT claim fields can now correctly be used even when a custom JWT payload is not defined.

- [#5590](https://github.com/neo4j/graphql/pull/5590) [`e95db9c`](https://github.com/neo4j/graphql/commit/e95db9ca5ff9c80d151e0c48df07ea5187e22395) Thanks [@angrykoala](https://github.com/angrykoala)! - Fix subscriptions with autogenerated uids #5586

## 5.6.2

### Patch Changes

- [#5524](https://github.com/neo4j/graphql/pull/5524) [`5d0db54`](https://github.com/neo4j/graphql/commit/5d0db540344c48b85156dda9ba7a4c769079ae04) Thanks [@angrykoala](https://github.com/angrykoala)! - Fix authorization filtering in delete operations

- [#5521](https://github.com/neo4j/graphql/pull/5521) [`2e6de36`](https://github.com/neo4j/graphql/commit/2e6de360c03c8eb678024c065a58875884f6a760) Thanks [@darrellwarde](https://github.com/darrellwarde)! - Simplify the projection of spatial properties

## 5.6.1

### Patch Changes

- [#5507](https://github.com/neo4j/graphql/pull/5507) [`461ee3a`](https://github.com/neo4j/graphql/commit/461ee3a0a1a9a79542b955d8e5e02135038a8662) Thanks [@angrykoala](https://github.com/angrykoala)! - Fix generated cypher for disconnect operations with filters #5497

## 5.6.0

## 5.5.6

### Patch Changes

- [#5468](https://github.com/neo4j/graphql/pull/5468) [`24f6d79`](https://github.com/neo4j/graphql/commit/24f6d79750918c69294f2b93b9547508fd04df01) Thanks [@angrykoala](https://github.com/angrykoala)! - Fix unique constraints for BigInt

- [#5470](https://github.com/neo4j/graphql/pull/5470) [`4f05a62`](https://github.com/neo4j/graphql/commit/4f05a629ccc6119522db165aaa07369ecc1ad5c6) Thanks [@angrykoala](https://github.com/angrykoala)! - Fix problem with parameters colliding in the cypher directive

## 5.5.5

### Patch Changes

- [#5446](https://github.com/neo4j/graphql/pull/5446) [`1e4a451`](https://github.com/neo4j/graphql/commit/1e4a45143dc66d9829a36b0430aaffd51a4cde50) Thanks [@darrellwarde](https://github.com/darrellwarde)! - A warning will now be given during validation of type definitions if subscriptions has been enabled, and `@authorization` has been used without `@subscriptionsAuthorization`

## 5.5.4

### Patch Changes

- [#5440](https://github.com/neo4j/graphql/pull/5440) [`cfcc474`](https://github.com/neo4j/graphql/commit/cfcc474ebcc238d1c4bc9e7ac55674975b8aa1c3) Thanks [@darrellwarde](https://github.com/darrellwarde)! - Generate filters for non-list relationship fields if deprecated array filters have been excluded

## 5.5.3

### Patch Changes

- [#5432](https://github.com/neo4j/graphql/pull/5432) [`9866da6`](https://github.com/neo4j/graphql/commit/9866da62ef06d2718dbea12e8d02715c55429d3e) Thanks [@darrellwarde](https://github.com/darrellwarde)! - Fix bug where pre-specified plural names were being pluralized again

## 5.5.2

### Patch Changes

- [#5387](https://github.com/neo4j/graphql/pull/5387) [`a40182d`](https://github.com/neo4j/graphql/commit/a40182df5d94da27e3372d747daff87dfe669ea6) Thanks [@angrykoala](https://github.com/angrykoala)! - Fix connection operations with a fulltext argument

## 5.5.1

## 5.5.0

### Minor Changes

- [#5316](https://github.com/neo4j/graphql/pull/5316) [`a26f32f`](https://github.com/neo4j/graphql/commit/a26f32f9726c5e5befd664a87588a22f8a4a9e3e) Thanks [@mjfwebb](https://github.com/mjfwebb)! - Add `@vector` directive.

    The directive enables two forms of user input, depending on the index configuration: vector input which in GraphQL is a `[Float!]`, and phrase input which is a `String`.

    For example to use the `@vector` directive with a vector index, you would define a type like this:

    ```graphql
    type Movie
        @vector(
            indexes: [
                { indexName: "myVectorIndexName", propertyName: "embedding", queryName: "searchForRelatedMovies" }
            ]
        ) {
        title: String!
    }
    ```

    To configure a provider to use the GenAI plugin and have phrase input, you would define a type like this:

    ```graphql
    type Movie
        @vector(
            indexes: [
                {
                    indexName: "myVectorIndexName"
                    propertyName: "embedding"
                    queryName: "searchForRelatedMovies"
                    provider: OPEN_AI
                }
            ]
        ) {
        title: String!
    }
    ```

    The constructor of the `Neo4jGraphQL` class would need to be updated to include the `OpenAI` provider under the `vector` feature like this:

    ```javascript
    const neoSchema = new Neo4jGraphQL({
        typeDefs,
        driver,
        features: {
            vector: {
                OpenAI: {
                    token: "my-open-ai-token",
                    model: "text-embedding-3-small",
                },
            },
        },
    });
    ```

### Patch Changes

- [#5317](https://github.com/neo4j/graphql/pull/5317) [`f4c41fe`](https://github.com/neo4j/graphql/commit/f4c41fef566c670fe837dddb7d4bae12f87bc001) Thanks [@angrykoala](https://github.com/angrykoala)! - Fix non-array validate argument on authorization directive #4534

## 5.4.5

### Patch Changes

- [#5304](https://github.com/neo4j/graphql/pull/5304) [`92fdf2e`](https://github.com/neo4j/graphql/commit/92fdf2eca41d08b0a81877c7ff6a65c3ef3b7d4f) Thanks [@angrykoala](https://github.com/angrykoala)! - Fix bug on generated Cypher with the @cypher directive and authorization rules #5270

## 5.4.4

### Patch Changes

- [#5257](https://github.com/neo4j/graphql/pull/5257) [`2e3aac9`](https://github.com/neo4j/graphql/commit/2e3aac9765c2e40e7fd0f1f6934bf85737473044) Thanks [@MacondoExpress](https://github.com/MacondoExpress)! - Fix projection of spatial fields with `srid` field

## 5.4.3

### Patch Changes

- [#5228](https://github.com/neo4j/graphql/pull/5228) [`62a052a`](https://github.com/neo4j/graphql/commit/62a052a09804a6c4361b0f0ce0cd0d9ba89b061b) Thanks [@darrellwarde](https://github.com/darrellwarde)! - Add parallel as an option for `runtime` in `CypherQueryOptions`

## 5.4.2

### Patch Changes

- [#5189](https://github.com/neo4j/graphql/pull/5189) [`7046091`](https://github.com/neo4j/graphql/commit/70460916901c08aec69a170467c1a1cb290e9fac) Thanks [@darrellwarde](https://github.com/darrellwarde)! - Remove parameters from transaction metadata

## 5.4.1

### Patch Changes

- [#5147](https://github.com/neo4j/graphql/pull/5147) [`97b86b5`](https://github.com/neo4j/graphql/commit/97b86b55d117d6ef0f7b0ee5b7549193c9e48481) Thanks [@MacondoExpress](https://github.com/MacondoExpress)! - Fix a bug that caused custom Cypher queries to fail when complex authorization rules are applied.

- [#5148](https://github.com/neo4j/graphql/pull/5148) [`1106af4`](https://github.com/neo4j/graphql/commit/1106af4554dedc35badea795725a15c96832bf49) Thanks [@angrykoala](https://github.com/angrykoala)! - Fix schema error when defining matrix values as arguments on custom fields #5142.

    For example:

    ```graphql
    type Query {
        test(fields: [[String!]]!): String!
    }
    ```

## 5.4.0

### Minor Changes

- [#5132](https://github.com/neo4j/graphql/pull/5132) [`899b1b4`](https://github.com/neo4j/graphql/commit/899b1b408f72171f832d0ba161640af0cb228473) Thanks [@darrellwarde](https://github.com/darrellwarde)! - Allows `@populatedBy` to be used on fields of list type

- [#5136](https://github.com/neo4j/graphql/pull/5136) [`8e3ffea`](https://github.com/neo4j/graphql/commit/8e3ffeaf9c80d6a9aa7952bdca5eacaba573d341) Thanks [@darrellwarde](https://github.com/darrellwarde)! - Allows `@populatedBy` to be used on temporal fields

### Patch Changes

- [#5132](https://github.com/neo4j/graphql/pull/5132) [`899b1b4`](https://github.com/neo4j/graphql/commit/899b1b408f72171f832d0ba161640af0cb228473) Thanks [@darrellwarde](https://github.com/darrellwarde)! - Adds schema validation so that `@populatedBy` can only be used on fields of supported types

- [#5132](https://github.com/neo4j/graphql/pull/5132) [`899b1b4`](https://github.com/neo4j/graphql/commit/899b1b408f72171f832d0ba161640af0cb228473) Thanks [@darrellwarde](https://github.com/darrellwarde)! - Fixes bug where non-numeric strings would evaluate to 0 as a `BigInt`

## 5.3.6

### Patch Changes

- [#5103](https://github.com/neo4j/graphql/pull/5103) [`05d83b2`](https://github.com/neo4j/graphql/commit/05d83b25928b7870df89faf43f5861ed453f112e) Thanks [@angrykoala](https://github.com/angrykoala)! - Optimise schema generation for aggregations, reducing schema generation time

- [#5085](https://github.com/neo4j/graphql/pull/5085) [`c82f7b8`](https://github.com/neo4j/graphql/commit/c82f7b8777319e414c86260b196276ffb9f1dae3) Thanks [@angrykoala](https://github.com/angrykoala)! - Validation warning on objects without resolver only appear under env variable `DEBUG=@neo4j/graphql:graphql`

- [#5104](https://github.com/neo4j/graphql/pull/5104) [`bcc3719`](https://github.com/neo4j/graphql/commit/bcc3719352f95722a03e3ff5ee89fdb66d2a6618) Thanks [@angrykoala](https://github.com/angrykoala)! - Add feature option `excludeDeprecatedFields` to reduce the schema size by removing autogenerated fields that have been deprecated:

    Usage:

    ```js
    const neoSchema = new Neo4jGraphQL({
        typeDefs,
        driver,
        features: {
            excludeDeprecatedFields: {
                bookmark: true,
                negationFilters: true,
                arrayFilters: true,
                stringAggregation: true,
                aggregationFilters: true,
            },
        },
    });
    ```

    This flag will remove the fields marked as `@deprecated` that have been autogenerated by the `@neo4j/graphql` library to reduce the schema size and hence server startup time and performance. Note that user-defined deprecated fields are not removed. Some autogenerated fields may still be generated, particularly those that do not affect schema size.

## 5.3.5

### Patch Changes

- [#5072](https://github.com/neo4j/graphql/pull/5072) [`aec402e`](https://github.com/neo4j/graphql/commit/aec402ecd552b3e68b8f73f4d1689dd91f013470) Thanks [@angrykoala](https://github.com/angrykoala)! - Fix authorization with unions

## 5.3.4

### Patch Changes

- [#5039](https://github.com/neo4j/graphql/pull/5039) [`2cff42d`](https://github.com/neo4j/graphql/commit/2cff42d9fbd2b34a6fc0c268944eaaf959afa54e) Thanks [@angrykoala](https://github.com/angrykoala)! - Fix cypher generation on delete operations #5023

- [#5057](https://github.com/neo4j/graphql/pull/5057) [`19d12a3`](https://github.com/neo4j/graphql/commit/19d12a30668b2690fd877590e0f0be4fd070ecec) Thanks [@MacondoExpress](https://github.com/MacondoExpress)! - Fixws a bug where a custom Cypher query with an argument named phrase was interpreted as FullText query.

## 5.3.3

### Patch Changes

- [#4992](https://github.com/neo4j/graphql/pull/4992) [`5dcd0a7`](https://github.com/neo4j/graphql/commit/5dcd0a702bdb52e02d774af91bafb17dfc43ce4e) Thanks [@a-alle](https://github.com/a-alle)! - PopulatedBy fields part of inputs for operations not defined in directive argument

- [#4979](https://github.com/neo4j/graphql/pull/4979) [`b730146`](https://github.com/neo4j/graphql/commit/b730146dba595ea5c3674ab51ec911d42b01ca88) Thanks [@a-alle](https://github.com/a-alle)! - EventPayload type for interface excludes fields that any of its implementations define as custom resolved

- [#5022](https://github.com/neo4j/graphql/pull/5022) [`6b6f636`](https://github.com/neo4j/graphql/commit/6b6f63607345efe0a926d675432a6a6bd7b08d32) Thanks [@angrykoala](https://github.com/angrykoala)! - Fix aggregation filtering with multiple labels #5013

- [#4916](https://github.com/neo4j/graphql/pull/4916) [`cb83cf5`](https://github.com/neo4j/graphql/commit/cb83cf5242b93992a307de9608eab663b7c18b2e) Thanks [@a-alle](https://github.com/a-alle)! - Fix aliased fields case on interface relationship connection filters

## 5.3.2

### Patch Changes

- [#4951](https://github.com/neo4j/graphql/pull/4951) [`1efa353`](https://github.com/neo4j/graphql/commit/1efa353c4a687d65ceb06fb10af8c25a72f34876) Thanks [@darrellwarde](https://github.com/darrellwarde)! - Change order of overrides in context to preserve internal values

## 5.3.1

### Patch Changes

- [#4932](https://github.com/neo4j/graphql/pull/4932) [`cd700d0`](https://github.com/neo4j/graphql/commit/cd700d0888335ba34eaf929ccdba7690b685fd8d) Thanks [@angrykoala](https://github.com/angrykoala)! - Fix `@cypher` parameters "replace" logic when parameters have similar names #4908

## 5.3.0

### Minor Changes

- [#4856](https://github.com/neo4j/graphql/pull/4856) [`1b52f83`](https://github.com/neo4j/graphql/commit/1b52f8372bbaa54048c56badc99420e4ae3f31fd) Thanks [@a-alle](https://github.com/a-alle)! - Add aggregate filter for relationships to interface types

### Patch Changes

- [#4879](https://github.com/neo4j/graphql/pull/4879) [`8eb952c`](https://github.com/neo4j/graphql/commit/8eb952cc63263e57e52d950f7d3badb155c89d17) Thanks [@angrykoala](https://github.com/angrykoala)! - Ignores \_emptyField from input arguments

## 5.2.0

### Minor Changes

- [#4816](https://github.com/neo4j/graphql/pull/4816) [`6b547dd`](https://github.com/neo4j/graphql/commit/6b547ddc78f18606401f4caa9792f7cecab29ddd) Thanks [@a-alle](https://github.com/a-alle)! - Adds support for the `@authentication` directive on custom resolved fields of root types Query and Mutation

- [#4829](https://github.com/neo4j/graphql/pull/4829) [`720a5ee`](https://github.com/neo4j/graphql/commit/720a5ee5dd8bd361a9b2c5ed14ad65cdf29509e6) Thanks [@a-alle](https://github.com/a-alle)! - Add simple relationship filter for relationships to interface types

### Patch Changes

- [#4848](https://github.com/neo4j/graphql/pull/4848) [`86fd1a9`](https://github.com/neo4j/graphql/commit/86fd1a9d8fa55941681540b5a37966661059408e) Thanks [@MacondoExpress](https://github.com/MacondoExpress)! - Fixed a bug that causes relationship direction to be wrongly generated during the resolution of interface relationship fields.

- [#4867](https://github.com/neo4j/graphql/pull/4867) [`d82ee15`](https://github.com/neo4j/graphql/commit/d82ee15f52c39a1fe93d42bbb0ccd59f050581ef) Thanks [@MacondoExpress](https://github.com/MacondoExpress)! - Fixed bug that caused an empty string and false boolean argument being evaluated as `NULL` when passed as an argument of a `@cypher` field.

## 5.1.0

### Minor Changes

- [#4821](https://github.com/neo4j/graphql/pull/4821) [`c198de3`](https://github.com/neo4j/graphql/commit/c198de3cfa0d17e574bb261ccca65de45d350013) Thanks [@angrykoala](https://github.com/angrykoala)! - Support for top-level connection query on interfaces. For example:

    _Typedefs_

    ```graphql
    interface Show {
        title: String!
    }

    type Movie implements Show {
        title: String!
        cost: Float
    }

    type Series implements Show {
        title: String!
        episodes: Int
    }
    ```

    _Query_

    ```graphql
    query {
        showsConnection(where: { title_CONTAINS: "The Matrix" }) {
            edges {
                node {
                    title
                    ... on Movie {
                        cost
                    }
                }
            }
        }
    }
    ```

### Patch Changes

- [#4797](https://github.com/neo4j/graphql/pull/4797) [`19c2a7a`](https://github.com/neo4j/graphql/commit/19c2a7ae9a768751222a99e754130a98a0695512) Thanks [@a-alle](https://github.com/a-alle)! - Fix user defined deprecated directives not propagated on all generated types

- [#4798](https://github.com/neo4j/graphql/pull/4798) [`9a660fa`](https://github.com/neo4j/graphql/commit/9a660fa67b68b325d62efc945b1e91bb353a0637) Thanks [@MacondoExpress](https://github.com/MacondoExpress)! - Fixed bug that caused authorization to not be applied on `@cypher` fields in some situations.

## 5.0.1

### Patch Changes

- [#4762](https://github.com/neo4j/graphql/pull/4762) [`714b4ed`](https://github.com/neo4j/graphql/commit/714b4ed1f9b3d1f23c9d5a32f59fd6ecf217ad50) Thanks [@MacondoExpress](https://github.com/MacondoExpress)! - Fix non-existing relationships for 1 to 1 relationship.

- [#4781](https://github.com/neo4j/graphql/pull/4781) [`752f9fb`](https://github.com/neo4j/graphql/commit/752f9fb2bc0cad63a736e95b3a5d16ad09542bce) Thanks [@angrykoala](https://github.com/angrykoala)! - Fix aggregation filters for connection fields

## 5.0.0

### Major Changes

- [#4675](https://github.com/neo4j/graphql/pull/4675) [`9befbb8`](https://github.com/neo4j/graphql/commit/9befbb81010847054c544231787e8e9565c3bda0) Thanks [@Andy2003](https://github.com/Andy2003)! - change the name of the `*EdgeAggregationWhereInput` so it uses the name of the type defining the edge properties

- [#4623](https://github.com/neo4j/graphql/pull/4623) [`980f078`](https://github.com/neo4j/graphql/commit/980f07830e645af1493698458d1539efc65aa2cf) Thanks [@angrykoala](https://github.com/angrykoala)! - Makes aggregation types nullable, even if the original property is non-nullable.

    This is because, in case of no nodes existing in the database, a null value will be returned by the aggregation

- [#4410](https://github.com/neo4j/graphql/pull/4410) [`a76c9c9`](https://github.com/neo4j/graphql/commit/a76c9c96486d98514903c1d8cffaa17a53c6eb07) Thanks [@angrykoala](https://github.com/angrykoala)! - Change @relationshipProperties to target types instead of interfaces:

    Instead of defining relationship properties in an interface, they must be defined as a type:

    ```graphql
    type Actor {
        name: String!
        actedIn: [Show!]! @relationship(type: "ACTED_IN", direction: OUT, properties: "ActedIn")
    }

    type ActedIn @relationshipProperties {
        screenTime: Int
    }
    ```

- [#4441](https://github.com/neo4j/graphql/pull/4441) [`6653a9e`](https://github.com/neo4j/graphql/commit/6653a9e7850101c75608d341a72ef48818addfcd) Thanks [@a-alle](https://github.com/a-alle)! - Introduce new properties field in connection edges field for relationship properties.

- [#4661](https://github.com/neo4j/graphql/pull/4661) [`99fc744`](https://github.com/neo4j/graphql/commit/99fc74489425748568b97cde32ced8df29a85320) Thanks [@Andy2003](https://github.com/Andy2003)! - The old `*AggregateSelectionNonNullable`-types and `*AggregateSelectionNullable`-types are now merged into `*AggregateSelection`-types`.

### Patch Changes

- [#4644](https://github.com/neo4j/graphql/pull/4644) [`4fc08b6`](https://github.com/neo4j/graphql/commit/4fc08b65a82fdb258e6b6f362f35917a93d375cc) Thanks [@MacondoExpress](https://github.com/MacondoExpress)! - Fix a bug where type-name filters were not applied if used in a connect operation.

- [#4697](https://github.com/neo4j/graphql/pull/4697) [`712d793`](https://github.com/neo4j/graphql/commit/712d793b02e8ddb04643f03233065b2f9ee4c753) Thanks [@MacondoExpress](https://github.com/MacondoExpress)! - Fixed incorrect behavior when using relationship-specific filters as `_SOME`/`_SINGLE`/`_NONE`/`_ALL` when the target of the filter was an interface.

- [#4533](https://github.com/neo4j/graphql/pull/4533) [`3094db4`](https://github.com/neo4j/graphql/commit/3094db4dacd6897f93b3e6aa11bb60adfbd00a90) Thanks [@angrykoala](https://github.com/angrykoala)! - Fix bug sorting by relationship properties on connections to an interface

- [#4521](https://github.com/neo4j/graphql/pull/4521) [`deed2ec`](https://github.com/neo4j/graphql/commit/deed2ec2d5003b80335d36e36396833bf4283a72) Thanks [@angrykoala](https://github.com/angrykoala)! - Fix subscription payload fields for interfaces

## 4.4.6

### Patch Changes

- [#4508](https://github.com/neo4j/graphql/pull/4508) [`fab9ea9`](https://github.com/neo4j/graphql/commit/fab9ea9a092df885bb1a600f1d549d48d4159899) Thanks [@MacondoExpress](https://github.com/MacondoExpress)! - Fix inconsistency described by the issue https://github.com/neo4j/graphql/issues/4536

- [#4509](https://github.com/neo4j/graphql/pull/4509) [`fb62636`](https://github.com/neo4j/graphql/commit/fb626361de99c8f8c882018e82dfe12fe891c9c8) Thanks [@Andy2003](https://github.com/Andy2003)! - Fixes the missing takeover of custom directives for interfaces

- [#4513](https://github.com/neo4j/graphql/pull/4513) [`38b1eae`](https://github.com/neo4j/graphql/commit/38b1eaef357a1ba4dfa31f48832d10af0628b378) Thanks [@Andy2003](https://github.com/Andy2003)! - [Bugfix] Fixed a bug where the sort field for a connection of an interface is not created even though it has sortable fields

- [#4515](https://github.com/neo4j/graphql/pull/4515) [`916c37e`](https://github.com/neo4j/graphql/commit/916c37eac96fda54e7d0c33384c0039fc1f989cd) Thanks [@Andy2003](https://github.com/Andy2003)! - fix: #4514 augment interfaces the same way no matter if they are used as the target of a relationship or not

- [#4621](https://github.com/neo4j/graphql/pull/4621) [`b8a640e`](https://github.com/neo4j/graphql/commit/b8a640e63dd8f1b5b34385a9512aa44fe76eeb95) Thanks [@MacondoExpress](https://github.com/MacondoExpress)! - Fixed a bug, where it was not possible to resolve interface fields for top-level cypher operations.

- [#4744](https://github.com/neo4j/graphql/pull/4744) [`46c38d0`](https://github.com/neo4j/graphql/commit/46c38d0e6c907cca22ff2d872dda75f48804c6a4) Thanks [@mjfwebb](https://github.com/mjfwebb)! - Export the Neo4jGraphQLCallback type

- [#4512](https://github.com/neo4j/graphql/pull/4512) [`92f653f`](https://github.com/neo4j/graphql/commit/92f653f8ce6fb7fcadb5c10ed1f51049d29712bc) Thanks [@Andy2003](https://github.com/Andy2003)! - Harmonize the generation of SubscriptionWhere- & Where- input-types, so they reuse the same logic

- [#4573](https://github.com/neo4j/graphql/pull/4573) [`7e129da`](https://github.com/neo4j/graphql/commit/7e129da51f6d69a054252d6376697d0db6a3163b) Thanks [@Andy2003](https://github.com/Andy2003)! - fix:#2697 fix aggregation filter for duration

## 4.4.5

### Patch Changes

- [#4449](https://github.com/neo4j/graphql/pull/4449) [`2bb8f8b`](https://github.com/neo4j/graphql/commit/2bb8f8b628c52c102c2db988685fc54f08521488) Thanks [@mjfwebb](https://github.com/mjfwebb)! - Fix: allow non-generated mutations on timestamp fields

    Before this patch, it wasn't possible to update a field with a timestamp directive even when the directive specified that only the UPDATE or CREATE operation field should be generated by the database.

- [#4375](https://github.com/neo4j/graphql/pull/4375) [`d3c6d0e`](https://github.com/neo4j/graphql/commit/d3c6d0e8897dfc7ca168f1c387c6c33b92f8cb56) Thanks [@angrykoala](https://github.com/angrykoala)! - Add support for logical operators on filters for interfaces under the experimental flag:

    ```
    interface Show {
        title: String!
    }

    type Movie implements Show {
        title: String!
    }

    type Series implements Show {
        title: String!
    }

    ```

    ```
    query actedInWhere {
        shows(where: { OR: [{ title: "Show 1" }, { title: "Show 2" }] }) {
            title
        }
    }
    ```

- [#4360](https://github.com/neo4j/graphql/pull/4360) [`5c42f8d`](https://github.com/neo4j/graphql/commit/5c42f8d5226dcc87c804bc752d676fdc9f623d30) Thanks [@angrykoala](https://github.com/angrykoala)! - Remove \_on filter for interfaces under experimental flag

- [#4409](https://github.com/neo4j/graphql/pull/4409) [`387e455`](https://github.com/neo4j/graphql/commit/387e455bb9aebb94663b05baed6c8694ec304e80) Thanks [@MacondoExpress](https://github.com/MacondoExpress)! - Add support for typename_IN filters for interfaces under the experimental flag:

    ```
    interface Show {
        title: String!
    }
    type Movie implements Show {
        title: String!
    }
    type Series implements Show {
        title: String!
    }
    ```

    ```
    query actedInWhere {
        shows(where: { typename_IN: [Series] }) {
            title
        }
    }
    ```

- [#4483](https://github.com/neo4j/graphql/pull/4483) [`4b97531`](https://github.com/neo4j/graphql/commit/4b97531170c399f243ee848c17a8e38a80e14a51) Thanks [@darrellwarde](https://github.com/darrellwarde)! - Fix authorization variable naming in create operations

- [#4507](https://github.com/neo4j/graphql/pull/4507) [`66a19c5`](https://github.com/neo4j/graphql/commit/66a19c56f00be90a8c0c6be294c98d402b0f4c5e) Thanks [@mjfwebb](https://github.com/mjfwebb)! - Fixes filtering on nested read operations

## 4.4.4

### Patch Changes

- [#4247](https://github.com/neo4j/graphql/pull/4247) [`226e5ed`](https://github.com/neo4j/graphql/commit/226e5edd22d4bff0767392079bedb58313dd606d) Thanks [@darrellwarde](https://github.com/darrellwarde)! - Fix issue in authorization context generation.

- [#4330](https://github.com/neo4j/graphql/pull/4330) [`24728fe`](https://github.com/neo4j/graphql/commit/24728fedd50a8176c54f67009b2afc84dd91418e) Thanks [@angrykoala](https://github.com/angrykoala)! - Update translation on fulltext to make it consistent for top level operations and phrase option

- [#4144](https://github.com/neo4j/graphql/pull/4144) [`c09aa9b`](https://github.com/neo4j/graphql/commit/c09aa9bb1a6ee3d13f918b0fed483893055fb1f1) Thanks [@darrellwarde](https://github.com/darrellwarde)! - Include the `@subscriptionsAuthorization` `events` argument in validation.

- [#4308](https://github.com/neo4j/graphql/pull/4308) [`7b310d6`](https://github.com/neo4j/graphql/commit/7b310d6d150c788e04af64f69029740913ddffad) Thanks [@mjfwebb](https://github.com/mjfwebb)! - Add filtering to interface aggregations

- [#4309](https://github.com/neo4j/graphql/pull/4309) [`1bf0773`](https://github.com/neo4j/graphql/commit/1bf077318d0ddbf730edf53d635f507e36fc7374) Thanks [@MacondoExpress](https://github.com/MacondoExpress)! - Fix an authorization bug present for validation rules with a predicate against a nested field and the Connection API. https://github.com/neo4j/graphql/issues/4292.

## 4.4.3

### Patch Changes

- [#4306](https://github.com/neo4j/graphql/pull/4306) [`3be44c864`](https://github.com/neo4j/graphql/commit/3be44c864564ee2f9437d104e25f9065d61415a8) Thanks [@angrykoala](https://github.com/angrykoala)! - Fix logical operators on interface connection filtering

## 4.4.2

### Patch Changes

- [#4285](https://github.com/neo4j/graphql/pull/4285) [`1bba6d186`](https://github.com/neo4j/graphql/commit/1bba6d18681301e4ad9da5bfacf7b7e29ac77bc1) Thanks [@angrykoala](https://github.com/angrykoala)! - EXPERIMENTAL: Add support for top level aggregation operations on interfaces

- [#4285](https://github.com/neo4j/graphql/pull/4285) [`193bbc789`](https://github.com/neo4j/graphql/commit/193bbc7898573f54d1d5bf18b26857c42f294fc1) Thanks [@angrykoala](https://github.com/angrykoala)! - Updates top level aggregation Cypher, this may lead to small performance changes on top level aggregation operations

- [#4257](https://github.com/neo4j/graphql/pull/4257) [`b58812f8e`](https://github.com/neo4j/graphql/commit/b58812f8e0359c0b086d68c335041cbeb7666ceb) Thanks [@mjfwebb](https://github.com/mjfwebb)! - Added nested aggregations on interfaces when the `experimental` flag is passed as `true` to the Neo4jGraphQL constructor.

## 4.4.1

### Patch Changes

- [#4235](https://github.com/neo4j/graphql/pull/4235) [`58ff087a1`](https://github.com/neo4j/graphql/commit/58ff087a113466b9b1b51c5708ff02193f8feccd) Thanks [@a-alle](https://github.com/a-alle)! - Fix directive combination logic for inherited field in the directive combination validation rule

- [#4237](https://github.com/neo4j/graphql/pull/4237) [`5aa9de932`](https://github.com/neo4j/graphql/commit/5aa9de93259d65ca6549221557aa71b9e04efe02) Thanks [@a-alle](https://github.com/a-alle)! - Fix authorization before and after parameter name clash

- [#4233](https://github.com/neo4j/graphql/pull/4233) [`0a95366ba`](https://github.com/neo4j/graphql/commit/0a95366ba7177f726da8f577384eeead47e6378b) Thanks [@a-alle](https://github.com/a-alle)! - Improve authorization variable prefix on create operations

## 4.4.0

### Minor Changes

- [#4194](https://github.com/neo4j/graphql/pull/4194) [`39749a381`](https://github.com/neo4j/graphql/commit/39749a38104b49895d993cd2f9a8401c38894564) Thanks [@angrykoala](https://github.com/angrykoala)! - Beta support for Neo4j Change Data Capture based subscriptions using `Neo4jGraphQLSubscriptionsCDCEngine`

### Patch Changes

- [#4211](https://github.com/neo4j/graphql/pull/4211) [`9324e6509`](https://github.com/neo4j/graphql/commit/9324e6509ed59825ee7c670923916d5a6f7e4c77) Thanks [@MacondoExpress](https://github.com/MacondoExpress)! - Fix label mapping for filters where the target node contains dynamic labels.

- [#4195](https://github.com/neo4j/graphql/pull/4195) [`3bbcefa54`](https://github.com/neo4j/graphql/commit/3bbcefa54bc23d39c10875aa06667ac0bd2b0cf0) Thanks [@a-alle](https://github.com/a-alle)! - Fix #4170 - authorization variable name clash

- [#4197](https://github.com/neo4j/graphql/pull/4197) [`1fd192632`](https://github.com/neo4j/graphql/commit/1fd1926320bf9355e77c045a3103bec26d9d95e6) Thanks [@darrellwarde](https://github.com/darrellwarde)! - Remove warning about Federation support being experimental.

- [#4133](https://github.com/neo4j/graphql/pull/4133) [`5bc958c9d`](https://github.com/neo4j/graphql/commit/5bc958c9d3b61dfa415bf09608b92c4768193cd2) Thanks [@MacondoExpress](https://github.com/MacondoExpress)! - Fixed a bug that prevents `@relayID` fields from being queried using the GraphQL alias and the Connection API. https://github.com/neo4j/graphql/issues/4158

- [#4218](https://github.com/neo4j/graphql/pull/4218) [`896b11ca5`](https://github.com/neo4j/graphql/commit/896b11ca5afc5cc4a6e5ae6e78fbe938875342aa) Thanks [@angrykoala](https://github.com/angrykoala)! - Fix missing custom cypher on unions

- [#4177](https://github.com/neo4j/graphql/pull/4177) [`0ba4f434b`](https://github.com/neo4j/graphql/commit/0ba4f434b7a705fab70c4ce4aefcb8bc82b87e2e) Thanks [@darrellwarde](https://github.com/darrellwarde)! - Improve debug logging of incoming GraphQL query and context, and decoding of bearer tokens.

## 4.3.4

### Patch Changes

- [#4142](https://github.com/neo4j/graphql/pull/4142) [`a1bdd5851`](https://github.com/neo4j/graphql/commit/a1bdd585188c988b25c403f330f7f15c50b2f55e) Thanks [@a-alle](https://github.com/a-alle)! - Fix #4118 - Invalid input WHERE on create with connect and auth

- [#4147](https://github.com/neo4j/graphql/pull/4147) [`755505021`](https://github.com/neo4j/graphql/commit/7555050217701073cb7786762863ffacd787f6c6) Thanks [@a-alle](https://github.com/a-alle)! - Fix #4113 - auth subqueries variable name clash

- [#4146](https://github.com/neo4j/graphql/pull/4146) [`0b3466568`](https://github.com/neo4j/graphql/commit/0b3466568707c943140ae35d79cda761f306b6a6) Thanks [@angrykoala](https://github.com/angrykoala)! - Fix nested aggregation filters #4115

## 4.3.3

### Patch Changes

- [#4136](https://github.com/neo4j/graphql/pull/4136) [`4ee9f66b1`](https://github.com/neo4j/graphql/commit/4ee9f66b1d7926cabb90ac346a6a03bf83a7ecdf) Thanks [@a-alle](https://github.com/a-alle)! - Fix `@jwtClaim` not working in `@authentication` rules

- [#4141](https://github.com/neo4j/graphql/pull/4141) [`68ac63044`](https://github.com/neo4j/graphql/commit/68ac63044afdb19583c262cb565d4b634b02871a) Thanks [@angrykoala](https://github.com/angrykoala)! - Fix Authorization filters along with subqueries #4110

## 4.3.2

### Patch Changes

- [#4108](https://github.com/neo4j/graphql/pull/4108) [`6592a6ab2`](https://github.com/neo4j/graphql/commit/6592a6ab24bb6cdfbf9cb59f99343ca33cf30342) Thanks [@darrellwarde](https://github.com/darrellwarde)! - Add missing NOT filters for JWT claims.

- [#4071](https://github.com/neo4j/graphql/pull/4071) [`e493402de`](https://github.com/neo4j/graphql/commit/e493402de5eed5dd43d433bbc37e250722d3d102) Thanks [@a-alle](https://github.com/a-alle)! - Fix #4056 variable not propagated

- [#4111](https://github.com/neo4j/graphql/pull/4111) [`7ad89796f`](https://github.com/neo4j/graphql/commit/7ad89796f3f3dd92350ed49c0299189bb393b996) Thanks [@mjfwebb](https://github.com/mjfwebb)! - Add enum case to parseLiteral in ScalarOrEnumType

- [#4098](https://github.com/neo4j/graphql/pull/4098) [`184a5209b`](https://github.com/neo4j/graphql/commit/184a5209b8186461e1ea7fdd3786456d8b2da11f) Thanks [@angrykoala](https://github.com/angrykoala)! - Fix filtering on aggregations (bug #4095)

- [#4108](https://github.com/neo4j/graphql/pull/4108) [`6592a6ab2`](https://github.com/neo4j/graphql/commit/6592a6ab24bb6cdfbf9cb59f99343ca33cf30342) Thanks [@darrellwarde](https://github.com/darrellwarde)! - Removed conditional which was preventing equality checks in JWT payload.

## 4.3.1

### Patch Changes

- [#4084](https://github.com/neo4j/graphql/pull/4084) [`97f38c337`](https://github.com/neo4j/graphql/commit/97f38c337a71fe48dec281ddc0e30cd8183eead2) Thanks [@angrykoala](https://github.com/angrykoala)! - Fix authentication filters rules in nested elements #4077

## 4.3.0

### Minor Changes

- [#4036](https://github.com/neo4j/graphql/pull/4036) [`120e22f8e`](https://github.com/neo4j/graphql/commit/120e22f8ef63af0aa72d2f66841451bc457bfee9) Thanks [@mjfwebb](https://github.com/mjfwebb)! - Schema generation logic improved
    - allow operations on Interface relationships to Interfaces
    - add descriptions to generated graphql types
    - improve schema generation logic

## 4.2.0

### Minor Changes

- [#4044](https://github.com/neo4j/graphql/pull/4044) [`059ea1c83`](https://github.com/neo4j/graphql/commit/059ea1c839516a807921a90a3966547acc4f3d33) Thanks [@MacondoExpress](https://github.com/MacondoExpress)! - Improved the transpilation implementation.

### Patch Changes

- [#4011](https://github.com/neo4j/graphql/pull/4011) [`3602fc466`](https://github.com/neo4j/graphql/commit/3602fc4669ae11ff06e0cd4c431dff8d05cdd6b9) Thanks [@angrykoala](https://github.com/angrykoala)! - Fix issue 4015, selecting the node field twice with a different selection set resulted in one selection set being ignored.

- [#4011](https://github.com/neo4j/graphql/pull/4011) [`ad2fc2aea`](https://github.com/neo4j/graphql/commit/ad2fc2aea3c452d536bba80e0396337db9cecc59) Thanks [@angrykoala](https://github.com/angrykoala)! - Fix issue 3923, applying multiple predicates on different node implementations using a connection filter resulted in some predicates not being applied.

- [#4011](https://github.com/neo4j/graphql/pull/4011) [`ef92e7ba0`](https://github.com/neo4j/graphql/commit/ef92e7ba02fc9ab2e52cb0966748fac7e6f4a846) Thanks [@angrykoala](https://github.com/angrykoala)! - Fix issue 4007, selecting an edges field using an alias resulted in the node fields not being returned.

- [#4011](https://github.com/neo4j/graphql/pull/4011) [`a2933854a`](https://github.com/neo4j/graphql/commit/a2933854a5fe6662e9c01616e31019d7a453c613) Thanks [@angrykoala](https://github.com/angrykoala)! - Fix issue 4004, when a user queried a cypher field defined with an argument named "options" produced a runtime error.

## 4.1.3

### Patch Changes

- [#3992](https://github.com/neo4j/graphql/pull/3992) [`34715e332`](https://github.com/neo4j/graphql/commit/34715e332c737138c5c2f735a34de081afa1fc7a) Thanks [@darrellwarde](https://github.com/darrellwarde)! - Fix issue where incorrect translation of authorization could cause deletion of more nodes than intended.

- [#4003](https://github.com/neo4j/graphql/pull/4003) [`f6cf36456`](https://github.com/neo4j/graphql/commit/f6cf3645687918d2cbfad3088e6a87870fba7f01) Thanks [@MacondoExpress](https://github.com/MacondoExpress)! - Fix issue 4001, in case of user defined input parse to UnknownType rather than raise an Error.

- [#4002](https://github.com/neo4j/graphql/pull/4002) [`caa7de29f`](https://github.com/neo4j/graphql/commit/caa7de29fd3d115d04735de97087141d2a185035) Thanks [@darrellwarde](https://github.com/darrellwarde)! - Remove list of lists validation in schema model which was causing errors in addition to warnings.

- [#3983](https://github.com/neo4j/graphql/pull/3983) [`529881e51`](https://github.com/neo4j/graphql/commit/529881e519b1cdc2d5767a959a7c22c336192e6d) Thanks [@darrellwarde](https://github.com/darrellwarde)! - Fix a validation error which was wrongly being thrown if two enum types contained the same value.

## 4.1.2

### Patch Changes

- [#3949](https://github.com/neo4j/graphql/pull/3949) [`295bb71f3`](https://github.com/neo4j/graphql/commit/295bb71f3ea6ea8598ac37c39b7f978cecdd438d) Thanks [@darrellwarde](https://github.com/darrellwarde)! - Fix issue where authorization rules depend on create operations that haven't happened yet.

- [#3917](https://github.com/neo4j/graphql/pull/3917) [`adf10c4c0`](https://github.com/neo4j/graphql/commit/adf10c4c08dfde5689bc86fafad488e7e5b0c8e1) Thanks [@darrellwarde](https://github.com/darrellwarde)! - Warning about missing `features.authorization` is now only given once for all type definitions.

- [#3937](https://github.com/neo4j/graphql/pull/3937) [`15ff75521`](https://github.com/neo4j/graphql/commit/15ff755217fe83d3e66db25871c33e0585c9c457) Thanks [@darrellwarde](https://github.com/darrellwarde)! - Switches to a warning for lists of lists to allow them to be used as the result of custom resolvers/Cypher.

## 4.1.1

### Patch Changes

- [#3890](https://github.com/neo4j/graphql/pull/3890) [`6d434108f`](https://github.com/neo4j/graphql/commit/6d434108ff2b88f265945586d8958aa6a40ce771) Thanks [@darrellwarde](https://github.com/darrellwarde)! - Fix: authorization checks are no longer added for the source nodes of connect operations, when the operation started with a create. The connect operation is likely required to complete before the authorization rules will be satisfied.

## 4.1.0

### Minor Changes

- [#3882](https://github.com/neo4j/graphql/pull/3882) [`a88db901f`](https://github.com/neo4j/graphql/commit/a88db901f4818eda10260f510aa77f43fc9dbbbf) Thanks [@darrellwarde](https://github.com/darrellwarde)! - Add the ability to pass through arbitrary database transaction metadata into the request context

## 4.0.0

### Major Changes

- [#2773](https://github.com/neo4j/graphql/pull/2773) [`7462b9715`](https://github.com/neo4j/graphql/commit/7462b97158bb7a202a77ec389270151e8d49cfb3) The deprecated `@callback` directive has been removed. Any remaining usages of `@callback` should be replaced with `@populatedBy`. See https://github.com/neo4j/graphql/blob/dev/docs/modules/ROOT/pages/guides/v4-migration/index.adoc#callback-renamed-to-populatedby for more information.

- [#2773](https://github.com/neo4j/graphql/pull/2773) [`7462b9715`](https://github.com/neo4j/graphql/commit/7462b97158bb7a202a77ec389270151e8d49cfb3) Remove aggregation fields for relationships to a single node (non-List relationships) - these serve no functional utility

- [#2773](https://github.com/neo4j/graphql/pull/2773) [`7462b9715`](https://github.com/neo4j/graphql/commit/7462b97158bb7a202a77ec389270151e8d49cfb3) The `operations` argument of `@subscription` has been renamed to `events`, with each event being past tense. This mirrors naming used elsewhere for subscriptions.

- [#2773](https://github.com/neo4j/graphql/pull/2773) [`7462b9715`](https://github.com/neo4j/graphql/commit/7462b97158bb7a202a77ec389270151e8d49cfb3) Support for Neo4j database 4.3 has been dropped. Please use the current Neo4j 5 release, or the LTS 4.4 release.

- [#2773](https://github.com/neo4j/graphql/pull/2773) [`7462b9715`](https://github.com/neo4j/graphql/commit/7462b97158bb7a202a77ec389270151e8d49cfb3) Aliased properties are now automatically escaped using backticks. If you were using backticks in the `property` argument of your `@alias` directives, these should now be removed.

- [#2773](https://github.com/neo4j/graphql/pull/2773) [`7462b9715`](https://github.com/neo4j/graphql/commit/7462b97158bb7a202a77ec389270151e8d49cfb3) Deprecated @node directive arguments `label` and `additionalLabels` have been removed. Please use the `labels` argument.

- [#2773](https://github.com/neo4j/graphql/pull/2773) [`7462b9715`](https://github.com/neo4j/graphql/commit/7462b97158bb7a202a77ec389270151e8d49cfb3) Remove `nodes` and `relationships` from the public API of the `Neo4jGraphQL` class.

- [#2773](https://github.com/neo4j/graphql/pull/2773) [`7462b9715`](https://github.com/neo4j/graphql/commit/7462b97158bb7a202a77ec389270151e8d49cfb3) Specifying Cypher query options to be used is now `cypherQueryOptions` instead of just `queryOptions`, and each option accepts a simple string rather than an enum.

- [#2773](https://github.com/neo4j/graphql/pull/2773) [`7462b9715`](https://github.com/neo4j/graphql/commit/7462b97158bb7a202a77ec389270151e8d49cfb3) Escape properties and relationships if needed, using | and & as part of the label is no longer supported

- [#2773](https://github.com/neo4j/graphql/pull/2773) [`7462b9715`](https://github.com/neo4j/graphql/commit/7462b97158bb7a202a77ec389270151e8d49cfb3) skipValidateTypeDefs has been removed. Please use startupValidation instead. See https://neo4j.com/docs/graphql-manual/current/guides/v4-migration/#startup-validation

- [#2773](https://github.com/neo4j/graphql/pull/2773) [`7462b9715`](https://github.com/neo4j/graphql/commit/7462b97158bb7a202a77ec389270151e8d49cfb3) It was possible to define schemas with types that have multiple relationship fields connected by the same type of relationships. Instances of this scenario are now detected during schema generation and an error is thrown so developers are informed to remedy the type definitions.

    An example of what is now considered invalid with these checks:

    ```graphql
    type Team {
        player1: Person! @relationship(type: "PLAYS_IN", direction: IN)
        player2: Person! @relationship(type: "PLAYS_IN", direction: IN)
        backupPlayers: [Person!]! @relationship(type: "PLAYS_IN", direction: IN)
    }

    type Person {
        teams: [Team!]! @relationship(type: "PLAYS_IN", direction: OUT)
    }
    ```

    For more information about this change and how to disable this validation please see the [4.0.0 migration guide](https://neo4j.com/docs/graphql-manual/current/guides/v4-migration/)

- [#2773](https://github.com/neo4j/graphql/pull/2773) [`7462b9715`](https://github.com/neo4j/graphql/commit/7462b97158bb7a202a77ec389270151e8d49cfb3) The Neo4j GraphQL Library now only accepts a `string`, `DocumentNode` or an array containing these types. A callback function returning these is also accepted. This is a reduction from `TypeSource` which also included types such as `GraphQLSchema` and `DefinitionNode`, which would have resulted in unexpected behaviour if passed in.

- [#2773](https://github.com/neo4j/graphql/pull/2773) [`7462b9715`](https://github.com/neo4j/graphql/commit/7462b97158bb7a202a77ec389270151e8d49cfb3) Removed deprecated argument `plural` from `@node` directive. Please use the `@plural` directive instead.

- [#2773](https://github.com/neo4j/graphql/pull/2773) [`7462b9715`](https://github.com/neo4j/graphql/commit/7462b97158bb7a202a77ec389270151e8d49cfb3) Removal of the following exports: `Neo4jGraphQLAuthenticationError`, `Neo4jGraphQLForbiddenError`, `EventMeta`, `Neo4jGraphQLAuthPlugin` and `RelationField`. This are either redundant, or internals which shouldn't have been exported.

- [#2773](https://github.com/neo4j/graphql/pull/2773) [`7462b9715`](https://github.com/neo4j/graphql/commit/7462b97158bb7a202a77ec389270151e8d49cfb3) Remove unused `DeleteInfo`, `GraphQLSortArg`, `GraphQLOptionsArg` and `GraphQLWhereArg` type exports.

- [#2773](https://github.com/neo4j/graphql/pull/2773) [`7462b9715`](https://github.com/neo4j/graphql/commit/7462b97158bb7a202a77ec389270151e8d49cfb3) The `limit` argument of the `@queryOptions` directive has been moved to its own directive, `@limit`.

- [#2773](https://github.com/neo4j/graphql/pull/2773) [`7462b9715`](https://github.com/neo4j/graphql/commit/7462b97158bb7a202a77ec389270151e8d49cfb3) Programmatic toggling of debug logging is now done using the `debug` option of the constructor.

- [#2773](https://github.com/neo4j/graphql/pull/2773) [`7462b9715`](https://github.com/neo4j/graphql/commit/7462b97158bb7a202a77ec389270151e8d49cfb3) Change subscriptions setup, this requires changes to constructor options passed to Neo4jGraphQL. See <https://neo4j.com/docs/graphql-manual/current/guides/v4-migration/#subscriptions-options>

    For single instance subscriptions use `true`:

    ```javascript
    const neoSchema = new Neo4jGraphQL({
        typeDefs,
        features: {
            subscriptions: true,
        },
    });
    ```

    For any other plugin, pass it `features.subscriptions`:

    ```javascript
    const neoSchema = new Neo4jGraphQL({
        typeDefs,
        features: {
            subscriptions: subscriptionPlugin,
        },
    });
    ```

- [#2773](https://github.com/neo4j/graphql/pull/2773) [`7462b9715`](https://github.com/neo4j/graphql/commit/7462b97158bb7a202a77ec389270151e8d49cfb3) The minimum version of `neo4j-driver` is now `5.8.0`, please upgrade. The `boomkark` field in the selection set has been marked as deprecated and will be removed in version `5.0.0` of the library.

- [#2773](https://github.com/neo4j/graphql/pull/2773) [`7462b9715`](https://github.com/neo4j/graphql/commit/7462b97158bb7a202a77ec389270151e8d49cfb3) The `requires` argument of the `@customResolver` directive now accepts a graphql selection set. This means it is now possible to require non-scalar fields such as related types.

- [#2773](https://github.com/neo4j/graphql/pull/2773) [`7462b9715`](https://github.com/neo4j/graphql/commit/7462b97158bb7a202a77ec389270151e8d49cfb3) `@cypher` directive now requires the parameter `columnName`.

    This requires all cypher queries to be made with a valid alias that must be referred in this new parameter.

    For Example:

    **@neo4j/graphql@3**

    ```
    @cypher(statement: "MATCH (i:Item) WHERE i.public=true RETURN i.name")
    ```

    **@neo4j/graphql@4**

    ```
    @cypher(statement: "MATCH (i:Item) WHERE i.public=true RETURN i.name as result", columnName: "result")
    ```

- [#2773](https://github.com/neo4j/graphql/pull/2773) [`7462b9715`](https://github.com/neo4j/graphql/commit/7462b97158bb7a202a77ec389270151e8d49cfb3) `neo4jDatabaseInfo` has been removed from the context. It is our belief that this has little utility in the library. If you regularly use different drivers connected to _different versions_ of Neo4j and require this feature, please raise an issue: https://github.com/neo4j/graphql/issues/new/choose

- [#2773](https://github.com/neo4j/graphql/pull/2773) [`7462b9715`](https://github.com/neo4j/graphql/commit/7462b97158bb7a202a77ec389270151e8d49cfb3) The `@id` directive has had a number of breaking changes.

    The `unique` argument has been removed. In an effort to simplify directives, `@id` will now only only be responsible for the autogeneration of UUID values.
    If you would like the property to also be backed by a unique node property constraint, use the `@unique` directive alongside `@id`.

    The `autogenerate` argument has been removed. With this value set to `false` and the above removal of constraint management, this would make the directive a no-op.

    The `global` argument has been removed. This quite key feature of specifying the globally unique identifier for Relay was hidden away inside the `@id` directive. This functionality has been moved into its own directive, `@relayId`, which is used with no arguments. The use of the `@relayId` directive also implies that the field will be backed by a unique node property constraint.

    Note, if using the `@id` and `@relayId` directive together on the same field, this will be an autogenerated ID compatible with Relay, and be backed by a single unique node property constraint. If you wish to give this constraint a name, use the `@unique` directive also with the `constraintName` argument.

- [#2773](https://github.com/neo4j/graphql/pull/2773) [`7462b9715`](https://github.com/neo4j/graphql/commit/7462b97158bb7a202a77ec389270151e8d49cfb3) Made `@relationshipProperties` mandatory for relationship property interfaces

- [#2773](https://github.com/neo4j/graphql/pull/2773) [`7462b9715`](https://github.com/neo4j/graphql/commit/7462b97158bb7a202a77ec389270151e8d49cfb3) config.callbacks has been deprecated and replaced with features.populatedBy.callbacks. See https://neo4j.com/docs/graphql-manual/current/guides/v4-migration/#_callback_renamed_to_populatedby for more information.

- [#2773](https://github.com/neo4j/graphql/pull/2773) [`7462b9715`](https://github.com/neo4j/graphql/commit/7462b97158bb7a202a77ec389270151e8d49cfb3) Validation of type definitions is now configured using the `validate` boolean option in the constructor, which defaults to `true`.

- [#2773](https://github.com/neo4j/graphql/pull/2773) [`7462b9715`](https://github.com/neo4j/graphql/commit/7462b97158bb7a202a77ec389270151e8d49cfb3) Use driver default access mode "READ" for `@cypher` directives in the `Query` type, and "WRITE" in the `Mutation` type.

- [#2773](https://github.com/neo4j/graphql/pull/2773) [`7462b9715`](https://github.com/neo4j/graphql/commit/7462b97158bb7a202a77ec389270151e8d49cfb3) Removed `@computed` directive. Please use `@customResolver` instead.

- [#2773](https://github.com/neo4j/graphql/pull/2773) [`7462b9715`](https://github.com/neo4j/graphql/commit/7462b97158bb7a202a77ec389270151e8d49cfb3) Remove all arguments from IExecutableSchemaDefinition apart from `typeDefs` and `resolvers`. This is to simplify the API and to remove any unexpected behaviours from arguments which we blindly pass through.

- [#2773](https://github.com/neo4j/graphql/pull/2773) [`7462b9715`](https://github.com/neo4j/graphql/commit/7462b97158bb7a202a77ec389270151e8d49cfb3) All labels and field names are escaped in the generated Cypher

- [#2773](https://github.com/neo4j/graphql/pull/2773) [`7462b9715`](https://github.com/neo4j/graphql/commit/7462b97158bb7a202a77ec389270151e8d49cfb3) `enableRegex` has been removed and replaced with `MATCHES` filters in the features configuration object. See the migration guide for more information: https://neo4j.com/docs/graphql-manual/current/guides/v4-migration

- [#2773](https://github.com/neo4j/graphql/pull/2773) [`7462b9715`](https://github.com/neo4j/graphql/commit/7462b97158bb7a202a77ec389270151e8d49cfb3) Relationship type strings are now automatically escaped using backticks. If you were using backticks in the `type` argument of your `@relationship` directives, these should now be removed to avoid backticks being added into your relationship type labels.

- [#2773](https://github.com/neo4j/graphql/pull/2773) [`7462b9715`](https://github.com/neo4j/graphql/commit/7462b97158bb7a202a77ec389270151e8d49cfb3) T`cypherQueryOptions` moved into context-only, as a per-request option.

### Minor Changes

- [#2773](https://github.com/neo4j/graphql/pull/2773) [`7462b9715`](https://github.com/neo4j/graphql/commit/7462b97158bb7a202a77ec389270151e8d49cfb3) The evaluation of authorization rules is now supported when using the Neo4j GraphQL Library as a Federation Subgraph.

### Patch Changes

- [#2773](https://github.com/neo4j/graphql/pull/2773) [`7462b9715`](https://github.com/neo4j/graphql/commit/7462b97158bb7a202a77ec389270151e8d49cfb3) `cypherParams` in the context now work as expected when using the OGM

- [#2773](https://github.com/neo4j/graphql/pull/2773) [`7462b9715`](https://github.com/neo4j/graphql/commit/7462b97158bb7a202a77ec389270151e8d49cfb3) `cypherParams` added to the `Neo4jGraphQLContext` type, and the fields within it can be referred to directly.

## 4.0.0-beta.2

### Major Changes

- [#3592](https://github.com/neo4j/graphql/pull/3592) [`2ba1d45b5`](https://github.com/neo4j/graphql/commit/2ba1d45b5bf642975381ca8431cb10094151586d) Thanks [@darrellwarde](https://github.com/darrellwarde)! - The Neo4j GraphQL Library now only accepts a `string`, `DocumentNode` or an array containing these types. A callback function returning these is also accepted. This is a reduction from `TypeSource` which also included types such as `GraphQLSchema` and `DefinitionNode`, which would have resulted in unexpected behaviour if passed in.

- [#3809](https://github.com/neo4j/graphql/pull/3809) [`a16ba357c`](https://github.com/neo4j/graphql/commit/a16ba357cb745ba728009c5e6b531b4c56a62f43) Thanks [@darrellwarde](https://github.com/darrellwarde)! - The `limit` argument of the `@queryOptions` directive has been moved to its own directive, `@limit`.

- [#3792](https://github.com/neo4j/graphql/pull/3792) [`56857a3e5`](https://github.com/neo4j/graphql/commit/56857a3e53134ad9f46f3265567c55570f674aab) Thanks [@darrellwarde](https://github.com/darrellwarde)! - Use driver default access mode "READ" for `@cypher` directives in the `Query` type, and "WRITE" in the `Mutation` type.

### Patch Changes

- [#3758](https://github.com/neo4j/graphql/pull/3758) [`e9bf1e619`](https://github.com/neo4j/graphql/commit/e9bf1e619ee71ead228530a9d46834a655686c6d) Thanks [@darrellwarde](https://github.com/darrellwarde)! - `cypherParams` added to the `Neo4jGraphQLContext` type, and the fields within it can be referred to directly.

- [#3795](https://github.com/neo4j/graphql/pull/3795) [`9354860ae`](https://github.com/neo4j/graphql/commit/9354860ae2f5f4a82179de874344724862d0c231) Thanks [@darrellwarde](https://github.com/darrellwarde)! - If possible, instantiate JWKS endpoint connection on startup, to benefit from caching.

## 4.0.0-beta.1

### Patch Changes

- [#3729](https://github.com/neo4j/graphql/pull/3729) [`be5dcdcde`](https://github.com/neo4j/graphql/commit/be5dcdcdec49adb6748dd8fc34b0b6f3e6d783fa) Thanks [@darrellwarde](https://github.com/darrellwarde)! - Improve the checking for non-existent parameters when evaluating authorization rules

## 4.0.0-beta.0

### Major Changes

- [#3062](https://github.com/neo4j/graphql/pull/3062) [`ea1bae3c3`](https://github.com/neo4j/graphql/commit/ea1bae3c3b8ec53febfa056c5fec25aa9b0c5c2a) Thanks [@mjfwebb](https://github.com/mjfwebb)! - The deprecated `@callback` directive has been removed. Any remaining usages of `@callback` should be replaced with `@populatedBy`. See <https://github.com/neo4j/graphql/blob/dev/docs/modules/ROOT/pages/guides/v4-migration/index.adoc#callback-renamed-to-populatedby> for more information.

- [#3013](https://github.com/neo4j/graphql/pull/3013) [`0fb2592b4`](https://github.com/neo4j/graphql/commit/0fb2592b4271adc02f4bbbf6e467eec5f7742be1) Thanks [@darrellwarde](https://github.com/darrellwarde)! - Remove aggregation fields for relationships to a single node (non-List relationships) - these serve no functional utility

- [#2863](https://github.com/neo4j/graphql/pull/2863) [`c9ee9e757`](https://github.com/neo4j/graphql/commit/c9ee9e757427f512950ec58aad7e30923b297a05) Thanks [@darrellwarde](https://github.com/darrellwarde)! - Support for Neo4j database 4.3 has been dropped. Please use the current Neo4j 5 release, or the LTS 4.4 release.

- [#2996](https://github.com/neo4j/graphql/pull/2996) [`4a78e7a8d`](https://github.com/neo4j/graphql/commit/4a78e7a8d70d3ff1ebaff8ba63ce1f9e5849d8e6) Thanks [@mjfwebb](https://github.com/mjfwebb)! - Aliased properties are now automatically escaped using backticks. If you were using backticks in the `property` argument of your `@alias` directives, these should now be removed.

- [#2834](https://github.com/neo4j/graphql/pull/2834) [`8d3aff007`](https://github.com/neo4j/graphql/commit/8d3aff007c0d5428313cef23602e9a4ef5ef3792) Thanks [@a-alle](https://github.com/a-alle)! - Deprecated @node directive arguments `label` and `additionalLabels` have been removed. Please use the `labels` argument.

- [#3671](https://github.com/neo4j/graphql/pull/3671) [`b3951fa81`](https://github.com/neo4j/graphql/commit/b3951fa81232a968fe492a4b10ea54afc604e2d2) Thanks [@darrellwarde](https://github.com/darrellwarde)! - Remove `nodes` and `relationships` from the public API of the `Neo4jGraphQL` class.

- [#3628](https://github.com/neo4j/graphql/pull/3628) [`2167c9ac1`](https://github.com/neo4j/graphql/commit/2167c9ac10b178ad881b12310fc798fc1f77b262) Thanks [@darrellwarde](https://github.com/darrellwarde)! - Specifying Cypher query options to be used is now `cypherQueryOptions` instead of just `queryOptions`, and each option accepts a simple string rather than an enum.

- [#3242](https://github.com/neo4j/graphql/pull/3242) [`29d68ad51`](https://github.com/neo4j/graphql/commit/29d68ad515bcd2ee573d40387978250f92f83fe9) Thanks [@angrykoala](https://github.com/angrykoala)! - Escape properties and relationships if needed, using | and & as part of the label is no longer supported

- [#3105](https://github.com/neo4j/graphql/pull/3105) [`395e12f14`](https://github.com/neo4j/graphql/commit/395e12f14e0e7fffe50e3841ca5e69da459855d2) Thanks [@mjfwebb](https://github.com/mjfwebb)! - skipValidateTypeDefs has been removed. Please use startupValidation instead. See <https://neo4j.com/docs/graphql-manual/current/guides/v4-migration/#startup-validation>

- [#3043](https://github.com/neo4j/graphql/pull/3043) [`15a7f0418`](https://github.com/neo4j/graphql/commit/15a7f04188bcc676477ec562e24b27851a927905) Thanks [@mjfwebb](https://github.com/mjfwebb)! - It was possible to define schemas with types that have multiple relationship fields connected by the same type of relationships. Instances of this scenario are now detected during schema generation and an error is thrown so developers are informed to remedy the type definitions.

    An example of what is now considered invalid with these checks:

    ```graphql
    type Team {
        player1: Person! @relationship(type: "PLAYS_IN", direction: IN)
        player2: Person! @relationship(type: "PLAYS_IN", direction: IN)
        backupPlayers: [Person!]! @relationship(type: "PLAYS_IN", direction: IN)
    }

    type Person {
        teams: [Team!]! @relationship(type: "PLAYS_IN", direction: OUT)
    }
    ```

    For more information about this change and how to disable this validation please see the [4.0.0 migration guide](https://neo4j.com/docs/graphql-manual/current/guides/v4-migration/)

- [#2818](https://github.com/neo4j/graphql/pull/2818) [`93b9d806b`](https://github.com/neo4j/graphql/commit/93b9d806b12c79dae7491b901378acf9d43f1c06) Thanks [@a-alle](https://github.com/a-alle)! - Removed deprecated argument `plural` from `@node` directive. Please use the `@plural` directive instead.

- [#3670](https://github.com/neo4j/graphql/pull/3670) [`d4aea32c6`](https://github.com/neo4j/graphql/commit/d4aea32c66aa1dcbf7b3399165adf74fed36e92e) Thanks [@darrellwarde](https://github.com/darrellwarde)! - Removal of the following exports: `Neo4jGraphQLAuthenticationError`, `Neo4jGraphQLForbiddenError`, `EventMeta`, `Neo4jGraphQLAuthPlugin` and `RelationField`. This are either redundant, or internals which shouldn't have been exported.

- [#3679](https://github.com/neo4j/graphql/pull/3679) [`5ea18136e`](https://github.com/neo4j/graphql/commit/5ea18136e36303efc0806cc7027b7dfce13e1fa4) Thanks [@darrellwarde](https://github.com/darrellwarde)! - Remove unused `DeleteInfo`, `GraphQLSortArg`, `GraphQLOptionsArg` and `GraphQLWhereArg` type exports.

- [#3673](https://github.com/neo4j/graphql/pull/3673) [`aa11d5251`](https://github.com/neo4j/graphql/commit/aa11d525111cfda005581ed2327407b9c9c319f9) Thanks [@darrellwarde](https://github.com/darrellwarde)! - Programmatic toggling of debug logging is now done using the `debug` option of the constructor.

- [#3234](https://github.com/neo4j/graphql/pull/3234) [`f1225baa7`](https://github.com/neo4j/graphql/commit/f1225baa75c71ad82e36e9fb250477382eb6757c) Thanks [@angrykoala](https://github.com/angrykoala)! - Change subscriptions setup, this requires changes to constructor options passed to Neo4jGraphQL. See <https://neo4j.com/docs/graphql-manual/current/guides/v4-migration/#subscriptions-options>

    For single instance subscriptions use `true`:

    ```javascript
    const neoSchema = new Neo4jGraphQL({
        typeDefs,
        features: {
            subscriptions: true,
        },
    });
    ```

    For any other plugin, pass it `features.subscriptions`:

    ```javascript
    const neoSchema = new Neo4jGraphQL({
        typeDefs,
        features: {
            subscriptions: subscriptionPlugin,
        },
    });
    ```

- [#3645](https://github.com/neo4j/graphql/pull/3645) [`7df67be49`](https://github.com/neo4j/graphql/commit/7df67be4991b8829acbd00651c66b41558729008) Thanks [@darrellwarde](https://github.com/darrellwarde)! - The minimum version of `neo4j-driver` is now `5.8.0`, please upgrade. The `boomkark` field in the selection set has been marked as deprecated and will be removed in version `5.0.0` of the library.

- [#2922](https://github.com/neo4j/graphql/pull/2922) [`7743399d3`](https://github.com/neo4j/graphql/commit/7743399d320b26126bb6e83bcd498c1c78517a83) Thanks [@Liam-Doodson](https://github.com/Liam-Doodson)! - The `requires` argument of the `@customResolver` directive now accepts a graphql selection set. This means it is now possible to require non-scalar fields such as related types.

- [#2769](https://github.com/neo4j/graphql/pull/2769) [`e5b53a597`](https://github.com/neo4j/graphql/commit/e5b53a5976a2880e0efdecddcddcfb427015c823) Thanks [@angrykoala](https://github.com/angrykoala)! - `@cypher` directive now requires the parameter `columnName`.

    This requires all cypher queries to be made with a valid alias that must be referred in this new parameter.

    For Example:

    **@neo4j/graphql@3**

    ```
    @cypher(statement: "MATCH (i:Item) WHERE i.public=true RETURN i.name")
    ```

    **@neo4j/graphql@4**

    ```
    @cypher(statement: "MATCH (i:Item) WHERE i.public=true RETURN i.name as result", columnName: "result")
    ```

- [#3630](https://github.com/neo4j/graphql/pull/3630) [`3896544b5`](https://github.com/neo4j/graphql/commit/3896544b50939df38a792bcd9b41bc77f25bc5a9) Thanks [@darrellwarde](https://github.com/darrellwarde)! - `neo4jDatabaseInfo` has been removed from the context. It is our belief that this has little utility in the library. If you regularly use different drivers connected to _different versions_ of Neo4j and require this feature, please raise an issue: <https://github.com/neo4j/graphql/issues/new/choose>

- [#2944](https://github.com/neo4j/graphql/pull/2944) [`8f0656b35`](https://github.com/neo4j/graphql/commit/8f0656b35b86a1d4966dea8cdb2a8ee5a3505dd6) Thanks [@Liam-Doodson](https://github.com/Liam-Doodson)! - Made `@relationshipProperties` mandatory for relationship property interfaces

- [#3099](https://github.com/neo4j/graphql/pull/3099) [`c9f35f10c`](https://github.com/neo4j/graphql/commit/c9f35f10c0fde1af7b82a3adbd7137955705495a) Thanks [@mjfwebb](https://github.com/mjfwebb)! - config.callbacks has been deprecated and replaced with features.populatedBy.callbacks. See <https://neo4j.com/docs/graphql-manual/current/guides/v4-migration/#_callback_renamed_to_populatedby> for more information.

- [#3687](https://github.com/neo4j/graphql/pull/3687) [`1ad4328e4`](https://github.com/neo4j/graphql/commit/1ad4328e4bba39801aa96bf961e6e5c5a2a9ce8d) Thanks [@darrellwarde](https://github.com/darrellwarde)! - Validation of type definitions is now configured using the `validate` boolean option in the constructor, which defaults to `true`.

- [#2819](https://github.com/neo4j/graphql/pull/2819) [`2ab3d5212`](https://github.com/neo4j/graphql/commit/2ab3d521277d66afd7acaea00aa56d44f10480bd) Thanks [@a-alle](https://github.com/a-alle)! - Removed `@computed` directive. Please use `@customResolver` instead.

- [#2598](https://github.com/neo4j/graphql/pull/2598) [`257aa4c97`](https://github.com/neo4j/graphql/commit/257aa4c97a0d367063725dff703fdd30f0f8ecb5) Thanks [@darrellwarde](https://github.com/darrellwarde)! - Remove all arguments from IExecutableSchemaDefinition apart from `typeDefs` and `resolvers`. This is to simplify the API and to remove any unexpected behaviours from arguments which we blindly pass through.

- [#3653](https://github.com/neo4j/graphql/pull/3653) [`5b5f08ce7`](https://github.com/neo4j/graphql/commit/5b5f08ce764f431fa685c8320351236a9aaf57a0) Thanks [@angrykoala](https://github.com/angrykoala)! - All labels and field names are escaped in the generated Cypher

- [#3097](https://github.com/neo4j/graphql/pull/3097) [`9f5a44545`](https://github.com/neo4j/graphql/commit/9f5a445455280abfcf862c2cf23ce44e7a11bc0d) Thanks [@mjfwebb](https://github.com/mjfwebb)! - `enableRegex` has been removed and replaced with `MATCHES` filters in the features configuration object. See the migration guide for more information: <https://neo4j.com/docs/graphql-manual/current/guides/v4-migration>

- [#2955](https://github.com/neo4j/graphql/pull/2955) [`9f3a9374e`](https://github.com/neo4j/graphql/commit/9f3a9374e5272577f2453cd3704c6924526f8b45) Thanks [@mjfwebb](https://github.com/mjfwebb)! - Relationship type strings are now automatically escaped using backticks. If you were using backticks in the `type` argument of your `@relationship` directives, these should now be removed to avoid backticks being added into your relationship type labels.

- [#3674](https://github.com/neo4j/graphql/pull/3674) [`59e369992`](https://github.com/neo4j/graphql/commit/59e369992b2226a3c5feec72f2799e2b30765819) Thanks [@darrellwarde](https://github.com/darrellwarde)! - `cypherQueryOptions` moved into context-only, as a per-request option.

### Minor Changes

- [#3661](https://github.com/neo4j/graphql/pull/3661) [`ce84c47cc`](https://github.com/neo4j/graphql/commit/ce84c47cc610366def7d3abd9227ecb5244ef9d1) Thanks [@darrellwarde](https://github.com/darrellwarde)! - The evaluation of authorization rules is now supported when using the Neo4j GraphQL Library as a Federation Subgraph.

## 3.24.3

### Patch Changes

- [#3828](https://github.com/neo4j/graphql/pull/3828) [`65666a5f7`](https://github.com/neo4j/graphql/commit/65666a5f7e2ab53654526dd239614b02bd900c44) Thanks [@darrellwarde](https://github.com/darrellwarde)! - Fix the configuration of nested operations when leaving a type with only relationships with no nested delete, connect or disconnect operations.

## 3.24.2

### Patch Changes

- [#3795](https://github.com/neo4j/graphql/pull/3795) [`9354860ae`](https://github.com/neo4j/graphql/commit/9354860ae2f5f4a82179de874344724862d0c231) Thanks [@darrellwarde](https://github.com/darrellwarde)! - If possible, instantiate JWKS endpoint connection on startup, to benefit from caching.

## 3.24.1

### Patch Changes

- [#3729](https://github.com/neo4j/graphql/pull/3729) [`be5dcdcde`](https://github.com/neo4j/graphql/commit/be5dcdcdec49adb6748dd8fc34b0b6f3e6d783fa) Thanks [@darrellwarde](https://github.com/darrellwarde)! - Improve the checking for non-existent parameters when evaluating authorization rules

## 3.24.0

### Minor Changes

- [#3639](https://github.com/neo4j/graphql/pull/3639) [`09cc28ef2`](https://github.com/neo4j/graphql/commit/09cc28ef26f13c46c220bd160d68c5f6c4668f39) Thanks [@darrellwarde](https://github.com/darrellwarde)! - Encourages switching from `driverConfig` to `sessionConfig` in both constructor and context. Can be used to switch database, and to use impersonation and user switching.

### Patch Changes

- [#3678](https://github.com/neo4j/graphql/pull/3678) [`c55a2b6fd`](https://github.com/neo4j/graphql/commit/c55a2b6fd36f9eb2ba5f51be3f21e97b68789fcc) Thanks [@darrellwarde](https://github.com/darrellwarde)! - Fix generation of schema for fields to an interface relationship when using subscriptions.

- [#3627](https://github.com/neo4j/graphql/pull/3627) [`cd884be5c`](https://github.com/neo4j/graphql/commit/cd884be5c07870ea778f5d81db5c55d45eca6dc3) Thanks [@MacondoExpress](https://github.com/MacondoExpress)! - Fixing argument parsing Flat/Int wrongly coerced as String.

## 3.23.1

### Patch Changes

- [#3603](https://github.com/neo4j/graphql/pull/3603) [`0a5e91bb2`](https://github.com/neo4j/graphql/commit/0a5e91bb2d7db61802ffe31517f60949884f4be5) Thanks [@darrellwarde](https://github.com/darrellwarde)! - Ensure that label checks are done against parameters.

## 3.23.0

### Minor Changes

- [#3581](https://github.com/neo4j/graphql/pull/3581) [`775fdea1d`](https://github.com/neo4j/graphql/commit/775fdea1d7af274094a7dd56018e75fb2b2596e2) Thanks [@ID!](https://github.com/ID!)! - This release includes the addition of three new directives for authentication and authorization:

    The `@authentication` directive is used to configure authentication checks at either the schema, object or field level:

    ```graphql
    type Post @authentication(operations: [CREATE]) {
        content: String!
    }
    ```

    The `@authorization` directive is used to configure fine-grained authorization against node properties:

    ```graphql
    type User @authorization(validate: [{ where: { node: { id: "$jwt.sub" } } }]) {
        id: ID!
    }
    ```

    The `@subscriptionsAuthorization` directive is used to configure fine-grained authorization specifically for Subscriptions events:

    ```graphql
    type Post @subscriptionsAuthorization(filter: [{ where: { node: { author: "$jwt.sub" } } }]) {
        likes: Int!
    }
    ```

    These three directives supersede the `@auth` directive, which will be removed in version 4.0.0 of the Neo4j GraphQL Library.

## 3.22.0

### Minor Changes

- [#3509](https://github.com/neo4j/graphql/pull/3509) [`cc201e6fc`](https://github.com/neo4j/graphql/commit/cc201e6fc6f0146f0cf80aad2bcaf086a215554c) Thanks [@MacondoExpress](https://github.com/MacondoExpress)! - Introduced schema configuration directive: `@filterable`.

    Usage:

    ```graphql
    type User {
        name: String @filterable(byValue: true, byAggregate: true)
    }
    ```

### Patch Changes

- [#3542](https://github.com/neo4j/graphql/pull/3542) [`f779a0061`](https://github.com/neo4j/graphql/commit/f779a00612adc4e0c42a3696435cbf6072dcfe31) Thanks [@Liam-Doodson](https://github.com/Liam-Doodson)! - Fixed #3541 which caused an error when using `@key` and other directives on the same type

- [#3538](https://github.com/neo4j/graphql/pull/3538) [`56a733023`](https://github.com/neo4j/graphql/commit/56a733023f6f300b92c8811e37bf6884dc661133) Thanks [@Liam-Doodson](https://github.com/Liam-Doodson)! - Fixed #3537 which prevented extending the schema with `@neo4j/graphql` directives when calling `getSubgraphSchema()`

## 3.21.0

### Minor Changes

- [#3402](https://github.com/neo4j/graphql/pull/3402) [`baa787745`](https://github.com/neo4j/graphql/commit/baa787745f5fef2af6b29ba3b4722a51f94b1961) Thanks [@darrellwarde](https://github.com/darrellwarde)! - Add top-level boolean operators for filtering on Subscriptions relationship events

- [#3482](https://github.com/neo4j/graphql/pull/3482) [`b891355e5`](https://github.com/neo4j/graphql/commit/b891355e58de1c56df68ce528a0a814d5202cab3) Thanks [@darrellwarde](https://github.com/darrellwarde)! - Export a new type, `Neo4jGraphQLContext` which can be passed into a GraphQL server to provide strong typing when populating the context with values to influence the behaviour of the Neo4j GraphQL Library. For an example of how this might be used, see the [Apollo docs](https://www.apollographql.com/docs/apollo-server/data/context#the-context-function).

- [#3431](https://github.com/neo4j/graphql/pull/3431) [`f19a57ca2`](https://github.com/neo4j/graphql/commit/f19a57ca236cb608c8138237751c4432ede6233f) Thanks [@angrykoala](https://github.com/angrykoala)! - Add @settable directive, allowing to disable some fields from mutation operations

    For example:

    ```graphql
    type Movie {
        title: String!
        description: String @settable(onCreate: true, onUpdate: false)
    }
    ```

- [#3432](https://github.com/neo4j/graphql/pull/3432) [`0a444662b`](https://github.com/neo4j/graphql/commit/0a444662b2ac986971076505fbb6c17aec4ea539) Thanks [@MacondoExpress](https://github.com/MacondoExpress)! - Add `aggregate` argument to the @relationship directive, allowing to disable nested aggregation

    For example:

    ```graphql
    type Actor {
        username: String!
        password: String!
    }

    type Movie {
        title: String
        actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN, aggregate: false)
    }
    ```

- [#3403](https://github.com/neo4j/graphql/pull/3403) [`f4d691566`](https://github.com/neo4j/graphql/commit/f4d6915661ef5f18e0d5fa3bd1b96d3564d94ee8) Thanks [@angrykoala](https://github.com/angrykoala)! - Add @selectable directive, allowing to disable fields from query, aggregations and subscription responses

    For example:

    ```graphql
    type Movie {
        title: String!
        description: String @selectable(onRead: true, onAggregate: false)
    }
    ```

### Patch Changes

- [#3438](https://github.com/neo4j/graphql/pull/3438) [`8c99be2fe`](https://github.com/neo4j/graphql/commit/8c99be2fe3ef5a831c8f043403dedf980cf84f86) Thanks [@Liam-Doodson](https://github.com/Liam-Doodson)! - Fixed #3437 which caused the `nestedOperations` argument of `@relationship` to generate empty input types if the CONNECT, CREATE or CONNECT_OR_CREATE operations were not generated

- [#3489](https://github.com/neo4j/graphql/pull/3489) [`0f32311ea`](https://github.com/neo4j/graphql/commit/0f32311ea685c996f35a62410a21ef1d9f495b46) Thanks [@angrykoala](https://github.com/angrykoala)! - Remove internal performance measurements requiring `performance.now`

- [#3465](https://github.com/neo4j/graphql/pull/3465) [`5616aa662`](https://github.com/neo4j/graphql/commit/5616aa662256e416b8401c8e50be79db194dfb28) Thanks [@Liam-Doodson](https://github.com/Liam-Doodson)! - Fixed #3429 and added support for unions/interfaces to the `nestedOperations` argument of `@relationship`

- [#3446](https://github.com/neo4j/graphql/pull/3446) [`1d5506525`](https://github.com/neo4j/graphql/commit/1d550652512331f3fc69bf3b5307fbcb3fd79aab) Thanks [@Liam-Doodson](https://github.com/Liam-Doodson)! - An empty `nestedOperations` array no longer causes `<type><rel-field>UpdateFieldInput` input types from being generated with only the `where` field

- [#3438](https://github.com/neo4j/graphql/pull/3438) [`8c99be2fe`](https://github.com/neo4j/graphql/commit/8c99be2fe3ef5a831c8f043403dedf980cf84f86) Thanks [@Liam-Doodson](https://github.com/Liam-Doodson)! - Fixed #3413 which caused the `nestedOperations` argument of `@relationship` to control top-level operations

- [#3445](https://github.com/neo4j/graphql/pull/3445) [`cc7c8e6a9`](https://github.com/neo4j/graphql/commit/cc7c8e6a9ba5b880c971efbfcd36485c92948a6b) Thanks [@Liam-Doodson](https://github.com/Liam-Doodson)! - Fixed #3428 which caused an error when removing the `CONNECT_OR_CREATE` `nestedOperation` if the related type has a unique field

## 3.20.1

### Patch Changes

- [#3396](https://github.com/neo4j/graphql/pull/3396) [`449d66fbd`](https://github.com/neo4j/graphql/commit/449d66fbddb061c40bfd3df10c8c12bf037960d7) Thanks [@angrykoala](https://github.com/angrykoala)! - Fix sorting fields with @alias directive

- Updated dependencies [[`ddae88e48`](https://github.com/neo4j/graphql/commit/ddae88e48a2e13ea9b6f4d9b39c46c52cf35a17e), [`42d2f6938`](https://github.com/neo4j/graphql/commit/42d2f6938df2b728c5ed552200565d1f8145e8bd)]:
    - @neo4j/cypher-builder@0.4.3

## 3.20.0

### Minor Changes

- [#3357](https://github.com/neo4j/graphql/pull/3357) [`a39b22fc1`](https://github.com/neo4j/graphql/commit/a39b22fc1f8f1227cac5a7efbaab1d855062054e) Thanks [@mjfwebb](https://github.com/mjfwebb)! - Introduced relationship directive configuration with the new nestedOperations argument. This allows users to specify which nested operations they want to be built into the schema.

    Usage:

    ```graphql
    type Movie {
        id: ID
        actors: [Person!]! @relationship(type: "ACTED_IN", direction: IN, nestedOperations: [CREATE, UPDATE, CONNECT])
    }
    ```

### Patch Changes

- [#3358](https://github.com/neo4j/graphql/pull/3358) [`6cce9ffe0`](https://github.com/neo4j/graphql/commit/6cce9ffe0605795be8e2e1990860d4ea0bd256ec) Thanks [@a-alle](https://github.com/a-alle)! - Fix update mutation returning info object when subscriptions enabled

## 3.19.0

### Minor Changes

- [#3333](https://github.com/neo4j/graphql/pull/3333) [`cc08bcd8a`](https://github.com/neo4j/graphql/commit/cc08bcd8a07044e38380fada05893de980351644) Thanks [@MacondoExpress](https://github.com/MacondoExpress)! - Introduced top-level schema configuration, `@query`, `@mutation`, `@subscription`.

    Usage:

    ```graphql
    type User @query(read: false) @mutation(operations: [CREATE, DELETE]) {
        name: String
    }
    extend schema @subscription(operations: [CREATE])
    ```

### Patch Changes

- [#3344](https://github.com/neo4j/graphql/pull/3344) [`dcfe28b49`](https://github.com/neo4j/graphql/commit/dcfe28b4912bb328a03caab48991f0903f000751) Thanks [@darrellwarde](https://github.com/darrellwarde)! - Fix relationship validation when an update and connect are used in the same Mutation.

- [#3322](https://github.com/neo4j/graphql/pull/3322) [`ce573b770`](https://github.com/neo4j/graphql/commit/ce573b7705a01caadcc1ad10984f85976451ca2c) Thanks [@angrykoala](https://github.com/angrykoala)! - Optimise query source metadata in executor

- [#3341](https://github.com/neo4j/graphql/pull/3341) [`43e189c14`](https://github.com/neo4j/graphql/commit/43e189c14853cd626e14b53338b4ef0ca7e489b8) Thanks [@tbwiss](https://github.com/tbwiss)! - feat: Neo4jGraphQL class, added public method to validate the type definitions

## 3.18.3

### Patch Changes

- [#3264](https://github.com/neo4j/graphql/pull/3264) [`e8092aa85`](https://github.com/neo4j/graphql/commit/e8092aa855244f7da21bb82f874bfda534a6fa4b) Thanks [@mjfwebb](https://github.com/mjfwebb)! - Federation: Setting `@key` resolvable to false no longer prevents queries and mutations for a type from being generated.

- [#3309](https://github.com/neo4j/graphql/pull/3309) [`99fe4b4b8`](https://github.com/neo4j/graphql/commit/99fe4b4b813538fa985111918bf6ffe2ef458f05) Thanks [@angrykoala](https://github.com/angrykoala)! - Improve server performance for large schemas when querying

- Updated dependencies [[`2d3661476`](https://github.com/neo4j/graphql/commit/2d3661476b78713d11b6d74a8db8c7af51d18989)]:
    - @neo4j/cypher-builder@0.4.2

## 3.18.2

### Patch Changes

- [#3216](https://github.com/neo4j/graphql/pull/3216) [`a8aabfeca`](https://github.com/neo4j/graphql/commit/a8aabfecad39b371fa82d16ea00e1e45d4044d05) Thanks [@angrykoala](https://github.com/angrykoala)! - Fix error in logical operations on optional parameters #3215

- [#3192](https://github.com/neo4j/graphql/pull/3192) [`8657dff82`](https://github.com/neo4j/graphql/commit/8657dff8274ea3d3a4a42c18c8e81232748cbeff) Thanks [@darrellwarde](https://github.com/darrellwarde)! - Source query and params are added to driver transaction config to aid with debugging the library from database query logs.

- Updated dependencies [[`f0d6d45b0`](https://github.com/neo4j/graphql/commit/f0d6d45b07cc65081ede71ce98efc916ce506977), [`f0d6d45b0`](https://github.com/neo4j/graphql/commit/f0d6d45b07cc65081ede71ce98efc916ce506977)]:
    - @neo4j/cypher-builder@0.4.1

## 3.18.1

### Patch Changes

- [#3183](https://github.com/neo4j/graphql/pull/3183) [`cbc15970c`](https://github.com/neo4j/graphql/commit/cbc15970cd87e5cdcfbae40ce5bacf1fb819ade8) Thanks [@angrykoala](https://github.com/angrykoala)! - Fix query by edge property on union type

## 3.18.0

### Minor Changes

- [#3076](https://github.com/neo4j/graphql/pull/3076) [`7a2f2acc4`](https://github.com/neo4j/graphql/commit/7a2f2acc434d1996a4b3785416acb0c46ad7f199) Thanks [@mjfwebb](https://github.com/mjfwebb)! - enableRegex has been deprecated and replaced with MATCHES filters in the features configuration object.

- [#3085](https://github.com/neo4j/graphql/pull/3085) [`ce5fb9eb3`](https://github.com/neo4j/graphql/commit/ce5fb9eb36a08dde95de605b49f842876b1c1515) Thanks [@mjfwebb](https://github.com/mjfwebb)! - config.callbacks has been deprecated and replaced with features.populatedBy.callbacks. See <https://neo4j.com/docs/graphql-manual/current/guides/v4-migration/#_callback_renamed_to_populatedby> for more information.

### Patch Changes

- Updated dependencies [[`2bc2c7019`](https://github.com/neo4j/graphql/commit/2bc2c70196c084f850aaf5b17838b0a66eaca79c), [`0d7a140ae`](https://github.com/neo4j/graphql/commit/0d7a140aea93eca94c03bcd49fda9ee9dfa5ae2b), [`d47624ea1`](https://github.com/neo4j/graphql/commit/d47624ea1b1b79401c59d326b4d0e31e64a1545d), [`bfae63097`](https://github.com/neo4j/graphql/commit/bfae6309717ab936768cab7e5e2a1a20bbff60da), [`b276bbae2`](https://github.com/neo4j/graphql/commit/b276bbae29ead5b110f28984cc77914755ac4c22), [`a04ef4469`](https://github.com/neo4j/graphql/commit/a04ef44692e744e3154a74c5ac2c73f323732fc7)]:
    - @neo4j/cypher-builder@0.4.0

## 3.17.2

### Patch Changes

- [#3036](https://github.com/neo4j/graphql/pull/3036) [`ff99e317c`](https://github.com/neo4j/graphql/commit/ff99e317cff519b1ae26bd52c70b2d89ac923512) Thanks [@darrellwarde](https://github.com/darrellwarde)! - Fix #2993 - skip the generation of relationship property input types if all fields are autogenerated.

- [#3051](https://github.com/neo4j/graphql/pull/3051) [`b6e4ebdc6`](https://github.com/neo4j/graphql/commit/b6e4ebdc62770951e333893c8f9562a2c9cbb99f) Thanks [@MacondoExpress](https://github.com/MacondoExpress)! - Include cardinality validation for abstract type during the update create

- [#3029](https://github.com/neo4j/graphql/pull/3029) [`0ce8bcf4b`](https://github.com/neo4j/graphql/commit/0ce8bcf4b7b021e341496cde8b10140f00d47c84) Thanks [@MacondoExpress](https://github.com/MacondoExpress)! - Fixed a bug that generates a relationship field of a union type as a List, in some inputs, even if defined as a 1 to 1 relationship field by the user.

- [#3037](https://github.com/neo4j/graphql/pull/3037) [`39abf6591`](https://github.com/neo4j/graphql/commit/39abf65915bb100baab15f3e838b899152109e63) Thanks [@angrykoala](https://github.com/angrykoala)! - Optimize Cypher query for filters on single relationships for required fields

- [#3010](https://github.com/neo4j/graphql/pull/3010) [`03141c81e`](https://github.com/neo4j/graphql/commit/03141c81e38e85bc6499231ae90a19e3fbdb17c3) Thanks [@happenslol](https://github.com/happenslol)! - Fix Date scalar serialization for custom resolvers

- Updated dependencies [[`cdbf0c1fe`](https://github.com/neo4j/graphql/commit/cdbf0c1fed34e5c39c8697410e13b338498f7520), [`507f9f7ff`](https://github.com/neo4j/graphql/commit/507f9f7ff5a57ff42f6554b21c2eff0cf37c10ba), [`084e0e036`](https://github.com/neo4j/graphql/commit/084e0e036ea05091db9082cae227b55a55157109), [`c4b9f120a`](https://github.com/neo4j/graphql/commit/c4b9f120ac2e22a6c9c1a34c920cb1ddf88fa45d)]:
    - @neo4j/cypher-builder@0.3.0

## 3.17.1

### Patch Changes

- [#2983](https://github.com/neo4j/graphql/pull/2983) [`56d126238`](https://github.com/neo4j/graphql/commit/56d1262389ff38522d7b9c3964e878415994b1fa) Thanks [@happenslol](https://github.com/happenslol)! - Fix count aggregate field translation resulting in a syntax error when used inside inline fragments

- [#2988](https://github.com/neo4j/graphql/pull/2988) [`cfe96e713`](https://github.com/neo4j/graphql/commit/cfe96e713ea54e6c670d7fe0dc535e7065b81d9c) Thanks [@darrellwarde](https://github.com/darrellwarde)! - Fix: context is now fully populated when using Apollo Federation, therefore, driver is no longer mandatory on construction and can be injected into the context like usual

- [#2942](https://github.com/neo4j/graphql/pull/2942) [`8e41a724a`](https://github.com/neo4j/graphql/commit/8e41a724a3abae1fa63fb5cd4cc1cf7a08e124d1) Thanks [@darrellwarde](https://github.com/darrellwarde)! - Fix `@coalesce` and `@default` for Enum List values

- [#2994](https://github.com/neo4j/graphql/pull/2994) [`eaf16062c`](https://github.com/neo4j/graphql/commit/eaf16062c9a27eacdea53de87423b726bef7bed6) Thanks [@darrellwarde](https://github.com/darrellwarde)! - Fix order of operations for nested update (delete->disconnect->update->connect->create)

- [#2743](https://github.com/neo4j/graphql/pull/2743) [`514bb64b6`](https://github.com/neo4j/graphql/commit/514bb64b6c22e886b3d8c06fc48b968af86bd421) Thanks [@dvanmali](https://github.com/dvanmali)! - fix: remove dependency of bindPredicate property from auth plugin into context

- [#2930](https://github.com/neo4j/graphql/pull/2930) [`99985018e`](https://github.com/neo4j/graphql/commit/99985018e6894d827efbfe1fa5fad6cc177594eb) Thanks [@darrellwarde](https://github.com/darrellwarde)! - Federation: `@shareable` directives defined on an `OBJECT` are now propagated effectively through the schema. `resolvable` argument of the `@key` directive now stops type generation of the relevant types.

## 3.17.0

### Minor Changes

- [#2442](https://github.com/neo4j/graphql/pull/2442) [`6f0d9c06d`](https://github.com/neo4j/graphql/commit/6f0d9c06d9b34d30211bdf703bb0b26844033179) Thanks [@darrellwarde](https://github.com/darrellwarde)! - Experimental support for Apollo Federation. Call `getSubgraphSchema()` to allow the schema to be used in a supergraph. The API is still being refined and will be subject to breaking changes.

### Patch Changes

- [#2913](https://github.com/neo4j/graphql/pull/2913) [`a0d4dc4cf`](https://github.com/neo4j/graphql/commit/a0d4dc4cf5d007235be3c7e36202aea9d39b6542) Thanks [@darrellwarde](https://github.com/darrellwarde)! - Fixes #2889 where nodes could not be created with enum list as a property

- [#2620](https://github.com/neo4j/graphql/pull/2620) [`6421735f0`](https://github.com/neo4j/graphql/commit/6421735f014f0e2edacb1be7ba15c8819a1a0adb) Thanks [@mhlz](https://github.com/mhlz)! - Selection of fields on interfaces in unions fail in some cases

- [#2892](https://github.com/neo4j/graphql/pull/2892) [`cdbf768a0`](https://github.com/neo4j/graphql/commit/cdbf768a05323b15595fe26b5d047866f0f0c036) Thanks [@Liam-Doodson](https://github.com/Liam-Doodson)! - Removed deprecation messages from single relationships that did not make sense

- [#2879](https://github.com/neo4j/graphql/pull/2879) [`1902f903f`](https://github.com/neo4j/graphql/commit/1902f903f89453f2d17be909e2b05f1c12ac39a9) Thanks [@MacondoExpress](https://github.com/MacondoExpress)! - Fixed a bug that prevents to return of the correct SelectionSet when a nested abstract field is null.

- [#2884](https://github.com/neo4j/graphql/pull/2884) [`1a2101c33`](https://github.com/neo4j/graphql/commit/1a2101c33d00a738be26c57fa378d4a9e3bede41) Thanks [@darrellwarde](https://github.com/darrellwarde)! - Add unique identifier to Cypher queries when combining with `UNION`, to ensure results aren't incorrectly de-duped. Fixes #2820.

- Updated dependencies [[`c436ab040`](https://github.com/neo4j/graphql/commit/c436ab0403a45395594728e6fc192034712f45af), [`1a2101c33`](https://github.com/neo4j/graphql/commit/1a2101c33d00a738be26c57fa378d4a9e3bede41)]:
    - @neo4j/cypher-builder@0.2.1

## 3.16.1

### Patch Changes

- [#2810](https://github.com/neo4j/graphql/pull/2810) [`0fe3a6853`](https://github.com/neo4j/graphql/commit/0fe3a68536e0cc5ec2cdd05057d038ca38358ff8) Thanks [@Liam-Doodson](https://github.com/Liam-Doodson)! - Fixed #2803 - invalid cypher when using aggregation filters within nested relationships/connections

- [#2877](https://github.com/neo4j/graphql/pull/2877) [`79ef38c5d`](https://github.com/neo4j/graphql/commit/79ef38c5dd43da19a64b0e7c25019209e19415f3) Thanks [@Liam-Doodson](https://github.com/Liam-Doodson)! - Fixed #2871 - invalid cypher for relationship filters nested within a SINGLE relationship

- Updated dependencies [[`81df28ed9`](https://github.com/neo4j/graphql/commit/81df28ed9238c1b4692aabe8e1de438ba01ae914), [`4fdb5135f`](https://github.com/neo4j/graphql/commit/4fdb5135fa3bdb84b87893d14afe263ad5ed020f), [`d4455881c`](https://github.com/neo4j/graphql/commit/d4455881c83f9ec597e657d92b9c9c126721541b)]:
    - @neo4j/cypher-builder@0.2.0

## 3.16.0

### Minor Changes

- [#2761](https://github.com/neo4j/graphql/pull/2761) [`6d2ba44d4`](https://github.com/neo4j/graphql/commit/6d2ba44d49a043bf4aed5311e368cf0c30719745) Thanks [@Liam-Doodson](https://github.com/Liam-Doodson)! - Added fine grain controls over startup validation. This makes it possible to turn off checks for custom resolvers when using the new `@customResolver` directive and addresses #2394

- [#2825](https://github.com/neo4j/graphql/pull/2825) [`14df1f827`](https://github.com/neo4j/graphql/commit/14df1f8271323a9d320810f5a19c02e79a5b3d84) Thanks [@a-alle](https://github.com/a-alle)! - `@node` arguments `label` and `additionalLabels` deprecated in favor of a new `labels` argument

### Patch Changes

- [#2835](https://github.com/neo4j/graphql/pull/2835) [`29e1d659a`](https://github.com/neo4j/graphql/commit/29e1d659aa7c48c73e6f19ed37bff320bff4dfeb) Thanks [@MacondoExpress](https://github.com/MacondoExpress)! - Fixed a wrong predicate generated by the batch create and field-level auth for some inputs.

- [#2822](https://github.com/neo4j/graphql/pull/2822) [`022861de2`](https://github.com/neo4j/graphql/commit/022861de2e1d69f8b56444b1c92308b2365e599c) Thanks [@MacondoExpress](https://github.com/MacondoExpress)! - Introduced \_LENGTH aggregation filters for string fields.

- [#2785](https://github.com/neo4j/graphql/pull/2785) [`8859980f9`](https://github.com/neo4j/graphql/commit/8859980f93598212fb226aa0172a0f0091965801) Thanks [@angrykoala](https://github.com/angrykoala)! - Fix comparison of duration fields on aggregations #2697

- [#2795](https://github.com/neo4j/graphql/pull/2795) [`a270243bb`](https://github.com/neo4j/graphql/commit/a270243bb3baaa0abadeb395fff5b0036a754c7b) Thanks [@angrykoala](https://github.com/angrykoala)! - Fix reusing the same parameters in custom @cypher queries within the same GraphQL query

- [#2632](https://github.com/neo4j/graphql/pull/2632) [`3fff70828`](https://github.com/neo4j/graphql/commit/3fff708284e95b4667be5094bbda6cf828a467a9) Thanks [@MacondoExpress](https://github.com/MacondoExpress)! - Introduced the logical operator NOT, some comparators like `NOT_CONTAINS` are no longer necessary and will be deprecated starting from version 4.0.

- [#2821](https://github.com/neo4j/graphql/pull/2821) [`8db2a1e2c`](https://github.com/neo4j/graphql/commit/8db2a1e2ce8a2f8d3077663a6665e0e670652db1) Thanks [@angrykoala](https://github.com/angrykoala)! - Fix parameter collision on nested disconnect #2782

- [#2752](https://github.com/neo4j/graphql/pull/2752) [`44ce8a741`](https://github.com/neo4j/graphql/commit/44ce8a74154182fca7ce6cf269bcd0009e61e34b) Thanks [@Andy2003](https://github.com/Andy2003)! - Removes apoc.do.when from generated Cypher, improving query performance in some update mutations

- [#2813](https://github.com/neo4j/graphql/pull/2813) [`4f6d4ae97`](https://github.com/neo4j/graphql/commit/4f6d4ae97f1278d37e65a25a10561efdfdeb6bac) Thanks [@MacondoExpress](https://github.com/MacondoExpress)! - Add deprecation to aggregation filters not relying on an aggregating function.

- Updated dependencies [[`81df28ed9`](https://github.com/neo4j/graphql/commit/81df28ed9238c1b4692aabe8e1de438ba01ae914)]:
    - @neo4j/cypher-builder@0.1.10

## 3.15.0

### Minor Changes

- [#2359](https://github.com/neo4j/graphql/pull/2359) [`3fd44b3ef`](https://github.com/neo4j/graphql/commit/3fd44b3ef08d6eebec3cb1dd51111af8bf4e9fb2) Thanks [@farhadnowzari](https://github.com/farhadnowzari)! - - The `JwksEndpoint` in `Neo4jGraphQLAuthJWKSPlugin` now will accept a function as well which returns a computed endpoint.
    - The `Secret` in `Neo4jGraphQLAuthJWTPlugin` now will accept a function as well which returns a computed secret.

- [#2588](https://github.com/neo4j/graphql/pull/2588) [`ef1822849`](https://github.com/neo4j/graphql/commit/ef182284930c8444c7205e2bc398ef17481e6279) Thanks [@a-alle](https://github.com/a-alle)! - Add `overwrite` argument on connect operation for relationships to standard types and arrays of

### Patch Changes

- [#2715](https://github.com/neo4j/graphql/pull/2715) [`f17f6b5b0`](https://github.com/neo4j/graphql/commit/f17f6b5b0259d26cf207a340be027b6c20ec2b81) Thanks [@tbwiss](https://github.com/tbwiss)! - fix: issue on generated Cypher with interface type (#2709)

- [#2760](https://github.com/neo4j/graphql/pull/2760) [`343845b26`](https://github.com/neo4j/graphql/commit/343845b26b577f0126dd3d7f2c070c5d0d1e3bf3) Thanks [@Liam-Doodson](https://github.com/Liam-Doodson)! - Fixed #2713 - missing checks for connection not NONE when filtering by connection_ALL

- [#2760](https://github.com/neo4j/graphql/pull/2760) [`6a784dd1f`](https://github.com/neo4j/graphql/commit/6a784dd1ffbaa8c901e04b67f62590545bdd4f5d) Thanks [@Liam-Doodson](https://github.com/Liam-Doodson)! - Fixed #2708 - invalid cypher when using an aggregation filter within a relationship filter

- [#2760](https://github.com/neo4j/graphql/pull/2760) [`163cf903d`](https://github.com/neo4j/graphql/commit/163cf903d375222b8455733d7f6a45ae831dea25) Thanks [@Liam-Doodson](https://github.com/Liam-Doodson)! - Fixes #2670 - invalid cypher when using an aggregation filter within a connection filter

## 3.14.2

### Patch Changes

- [#2674](https://github.com/neo4j/graphql/pull/2674) [`785e99db7`](https://github.com/neo4j/graphql/commit/785e99db7c75276ea1380cbef68435fe02dc8049) Thanks [@angrykoala](https://github.com/angrykoala)! - Fix aliased fields on aggregations filtering #2656

- [#2675](https://github.com/neo4j/graphql/pull/2675) [`6c38084c0`](https://github.com/neo4j/graphql/commit/6c38084c0f2513085babc6a71b5039adf4b5c7e2) Thanks [@Liam-Doodson](https://github.com/Liam-Doodson)! - Fixed #2675 - counting aggregation source not target

- [#2619](https://github.com/neo4j/graphql/pull/2619) [`788fe93ef`](https://github.com/neo4j/graphql/commit/788fe93ef4d52e8a4fd697ac7f134b0e523ea4de) Thanks [@tbwiss](https://github.com/tbwiss)! - fix: resolvers input for Neo4jGraphQL class accepts a IResolvers array

- [#2631](https://github.com/neo4j/graphql/pull/2631) [`ea1917a5a`](https://github.com/neo4j/graphql/commit/ea1917a5a751fe9df362e687cc1f4d9b353e588f) Thanks [@tbwiss](https://github.com/tbwiss)! - fix: node directive label is not used in interface sub-query (bug report #2614)

- [#2680](https://github.com/neo4j/graphql/pull/2680) [`1f8dee357`](https://github.com/neo4j/graphql/commit/1f8dee357296956c90968d79a5a3e0e9343fe2f9) Thanks [@darrellwarde](https://github.com/darrellwarde)! - Fix aggregation Cypher translation when aliasing relationship properties using the `@alias` directive

- [#2666](https://github.com/neo4j/graphql/pull/2666) [`f19ef34d7`](https://github.com/neo4j/graphql/commit/f19ef34d7908539fdba6bebc5b2a76fc09cf46c1) Thanks [@Liam-Doodson](https://github.com/Liam-Doodson)! - Fixed #2662 - missing `size()` call on string edge property aggregations when filtering by AVERAGE/LONGEST/SHORTEST.

- [#2664](https://github.com/neo4j/graphql/pull/2664) [`3252f44d7`](https://github.com/neo4j/graphql/commit/3252f44d7d5453690f0aa0f35b9246a41ff5908b) Thanks [@a-alle](https://github.com/a-alle)! - Fix point types when subscriptions enabled

- Updated dependencies [[`ddf51ccfe`](https://github.com/neo4j/graphql/commit/ddf51ccfeec896b64ee943e910e59ac4e2f62869)]:
    - @neo4j/cypher-builder@0.1.9

## 3.14.1

### Patch Changes

- [#2516](https://github.com/neo4j/graphql/pull/2516) [`95ecaf7c3`](https://github.com/neo4j/graphql/commit/95ecaf7c37b3e6e69bf025d49b5ad00ad44dcb39) Thanks [@Liam-Doodson](https://github.com/Liam-Doodson)! - Fixed #2388 - filtering on nested aggregation queries

- [#2576](https://github.com/neo4j/graphql/pull/2576) [`05280d0f1`](https://github.com/neo4j/graphql/commit/05280d0f16792e8e004c732ab039152d4dd32707) Thanks [@darrellwarde](https://github.com/darrellwarde)! - Reverts #2492 which caused a regression when creating bi-directional Union relationships

- [#2578](https://github.com/neo4j/graphql/pull/2578) [`26d8a0045`](https://github.com/neo4j/graphql/commit/26d8a00453b03fa14328bcc2f5f4685e7b5e3ba3) Thanks [@angrykoala](https://github.com/angrykoala)! - Fix sorting on multiple fields in the same object #2577

- [#2580](https://github.com/neo4j/graphql/pull/2580) [`189352546`](https://github.com/neo4j/graphql/commit/18935254652240c1ad826c3c85a5be873c4dbd20) Thanks [@angrykoala](https://github.com/angrykoala)! - Fix sorting by cypher fields when not in the selection set

- [#2564](https://github.com/neo4j/graphql/pull/2564) [`9243fb3af`](https://github.com/neo4j/graphql/commit/9243fb3afc0c04408bf78c1ba581856ccb0e51fc) Thanks [@Liam-Doodson](https://github.com/Liam-Doodson)! - Added checks for constraints on additional labels specified by the `@node` directive when running `assertIndexesAndConstraints`.

- [#2516](https://github.com/neo4j/graphql/pull/2516) [`95ecaf7c3`](https://github.com/neo4j/graphql/commit/95ecaf7c37b3e6e69bf025d49b5ad00ad44dcb39) Thanks [@Liam-Doodson](https://github.com/Liam-Doodson)! - Fixed #2520 - Transaction closed error when using multiple aggregation filters on update mutation

- [#2516](https://github.com/neo4j/graphql/pull/2516) [`95ecaf7c3`](https://github.com/neo4j/graphql/commit/95ecaf7c37b3e6e69bf025d49b5ad00ad44dcb39) Thanks [@Liam-Doodson](https://github.com/Liam-Doodson)! - Performance improved by removing use of `apoc.runFirstColumn` from aggregation projections

- [#2516](https://github.com/neo4j/graphql/pull/2516) [`1b2913803`](https://github.com/neo4j/graphql/commit/1b2913803880bd1e8e1f1b7f79262ae20b1585e3) Thanks [@Liam-Doodson](https://github.com/Liam-Doodson)! - Performance increase by removing use of `apoc.runFirstColumn` from nested aggregate where filters

- [#2587](https://github.com/neo4j/graphql/pull/2587) [`cd4f57a5d`](https://github.com/neo4j/graphql/commit/cd4f57a5ddc67660f7c41fd67e2006e68a8a0e1d) Thanks [@angrykoala](https://github.com/angrykoala)! - Fix invalid Cypher query on nested fields with `@cypher` directive using `columnName` #2581

- [#2580](https://github.com/neo4j/graphql/pull/2580) [`88d2cdfc1`](https://github.com/neo4j/graphql/commit/88d2cdfc1265f8a45c384872d32704bf452d36df) Thanks [@angrykoala](https://github.com/angrykoala)! - Improved performance on some connection pagination queries

## 3.14.0

### Minor Changes

- [#2455](https://github.com/neo4j/graphql/pull/2455) [`9d9bea661`](https://github.com/neo4j/graphql/commit/9d9bea6611851dd3ae9912aa0eb29554ed2b0eb0) Thanks [@angrykoala](https://github.com/angrykoala)! - Add columnName argument to @cypher directive

- [#2551](https://github.com/neo4j/graphql/pull/2551) [`652ebcdba`](https://github.com/neo4j/graphql/commit/652ebcdbadf71c3e55989672eb1064b52b32828e) Thanks [@angrykoala](https://github.com/angrykoala)! - Subscriptions stable release.
    - [Documentation](https://neo4j.com/docs/graphql-manual/current/subscriptions/)
    - [Examples](https://github.com/neo4j/graphql/tree/dev/examples/subscriptions)

### Patch Changes

- Updated dependencies [[`2d2cb2e42`](https://github.com/neo4j/graphql/commit/2d2cb2e42dc0d495b944fa5a49abed8e4c0892e5)]:
    - @neo4j/cypher-builder@0.1.8

## 3.13.1

### Patch Changes

- [#2515](https://github.com/neo4j/graphql/pull/2515) [`1bec3f95d`](https://github.com/neo4j/graphql/commit/1bec3f95d0f469c2a4e879b1904a4d1a4938207e) Thanks [@darrellwarde](https://github.com/darrellwarde)! - Add `bindPredicate` which allows the predicate used to evaluate `bind` rules to be changed

- [#2503](https://github.com/neo4j/graphql/pull/2503) [`0d70b0704`](https://github.com/neo4j/graphql/commit/0d70b07049a0f4b2391240929aadc54f62eedc42) Thanks [@darrellwarde](https://github.com/darrellwarde)! - Allow scalars to be passed as their native Neo4j values - this might apply to using with the OGM for example

- [#2472](https://github.com/neo4j/graphql/pull/2472) [`5d349e05c`](https://github.com/neo4j/graphql/commit/5d349e05c08ed655144b9919528ba66047f49443) Thanks [@Liam-Doodson](https://github.com/Liam-Doodson)! - Removes use of runFirstColumn for top-level aggregation queries.

- [#2501](https://github.com/neo4j/graphql/pull/2501) [`638f3205a`](https://github.com/neo4j/graphql/commit/638f3205ab3b20eb69a7bb33e6c11685d3e53a51) Thanks [@MacondoExpress](https://github.com/MacondoExpress)! - Fix bug during the create operation caused by defining a relational field name as "node"

- [#2492](https://github.com/neo4j/graphql/pull/2492) [`2710165e0`](https://github.com/neo4j/graphql/commit/2710165e0bfd200a8755e1b94f363ee17258fcac) Thanks [@darrellwarde](https://github.com/darrellwarde)! - Ensure that union create input is non-nullable for required relationships

- Updated dependencies [[`c8c2d2d4d`](https://github.com/neo4j/graphql/commit/c8c2d2d4d4897adfd1afcd666bf9f46263dfab1f)]:
    - @neo4j/cypher-builder@0.1.7

## 3.13.0

### Minor Changes

- [#2456](https://github.com/neo4j/graphql/pull/2456) [`b981c45f7`](https://github.com/neo4j/graphql/commit/b981c45f76753557c18b1152ad62f258d2bee7f7) Thanks [@a-alle](https://github.com/a-alle)! - Adds support for subscriptions events for connect and disconnect

- [#2383](https://github.com/neo4j/graphql/pull/2383) [`20aa9c05b`](https://github.com/neo4j/graphql/commit/20aa9c05be4c780493d536bc98335fb88d857b6a) Thanks [@a-alle](https://github.com/a-alle)! - Adds filtering on connect and disconnect subscriptions events

### Patch Changes

- [#2406](https://github.com/neo4j/graphql/pull/2406) [`12ec721e6`](https://github.com/neo4j/graphql/commit/12ec721e66f7ce570b31be3341c625a48bda304f) Thanks [@MacondoExpress](https://github.com/MacondoExpress)! - Bulk-create performance improvements for protected nodes and fields.

- [#2488](https://github.com/neo4j/graphql/pull/2488) [`c06ac56ae`](https://github.com/neo4j/graphql/commit/c06ac56ae84360dc19bccd4545334c8c65b1c768) Thanks [@angrykoala](https://github.com/angrykoala)! - Fix cursor based pagination over connection fields

- [#2438](https://github.com/neo4j/graphql/pull/2438) [`e220f36e0`](https://github.com/neo4j/graphql/commit/e220f36e07bb27aeb5c787e7ebf5b09e7fba2afc) Thanks [@angrykoala](https://github.com/angrykoala)! - Fix nested delete attempting to delete same node multiple times

- [#2476](https://github.com/neo4j/graphql/pull/2476) [`b624c7ace`](https://github.com/neo4j/graphql/commit/b624c7aced55493f9df1abcaca91b139713f4186) Thanks [@darrellwarde](https://github.com/darrellwarde)! - Remove additional SKIP and LIMIT from Cypher which was causing excessive skipping

- Updated dependencies [[`150b64c04`](https://github.com/neo4j/graphql/commit/150b64c046dd511d29436b33d67770aed6217c8f)]:
    - @neo4j/cypher-builder@0.1.6

## 3.12.2

### Patch Changes

- [#2431](https://github.com/neo4j/graphql/pull/2431) [`82846ef0a`](https://github.com/neo4j/graphql/commit/82846ef0a5ac0c778d295970405626bed829cff3) Thanks [@MacondoExpress](https://github.com/MacondoExpress)! - remove dependency from crypto

- Updated dependencies [[`e23691152`](https://github.com/neo4j/graphql/commit/e23691152db927d03891c592a716ca41e58d5f47), [`4c79ec3cf`](https://github.com/neo4j/graphql/commit/4c79ec3cf29ea7f0cd0e5fc18f98e65c221af8e5)]:
    - @neo4j/cypher-builder@0.1.5

## 3.12.1

### Patch Changes

- [#2370](https://github.com/neo4j/graphql/pull/2370) [`d71ddb54d`](https://github.com/neo4j/graphql/commit/d71ddb54d811e280357bd37270b9f5cae0c600aa) Thanks [@angrykoala](https://github.com/angrykoala)! - Speeds up schema generation in getSchema

- [#2338](https://github.com/neo4j/graphql/pull/2338) [`35bbf3197`](https://github.com/neo4j/graphql/commit/35bbf3197ecd3ad576567189242036ac3ee07b57) Thanks [@darrellwarde](https://github.com/darrellwarde)! - Alias subquery return in UNWIND CREATE

- [#2407](https://github.com/neo4j/graphql/pull/2407) [`f2a56c738`](https://github.com/neo4j/graphql/commit/f2a56c73854c60144ec2809b855cd52eb1288a43) Thanks [@MacondoExpress](https://github.com/MacondoExpress)! - Included enum in OnCreateInput types

- [#2390](https://github.com/neo4j/graphql/pull/2390) [`d04699b50`](https://github.com/neo4j/graphql/commit/d04699b50f0dd50984ab6688743f4fe027d797a0) Thanks [@darrellwarde](https://github.com/darrellwarde)! - Allow SortDirection to be used in input type definitions

- [#2339](https://github.com/neo4j/graphql/pull/2339) [`27dd34de7`](https://github.com/neo4j/graphql/commit/27dd34de7815824afa490667ce2484f017c823a3) Thanks [@Liam-Doodson](https://github.com/Liam-Doodson)! - Added deprecation warnings to old full-text inputs.

- [#2360](https://github.com/neo4j/graphql/pull/2360) [`f2799750a`](https://github.com/neo4j/graphql/commit/f2799750a0a1aeaecaf9ead5295483e5205ada62) Thanks [@Liam-Doodson](https://github.com/Liam-Doodson)! - Fix deprecation directives carried on to generated fields and inputs

- [#2371](https://github.com/neo4j/graphql/pull/2371) [`9d0859b59`](https://github.com/neo4j/graphql/commit/9d0859b596be29d0e64f6531e2bf0c17325b9a34) Thanks [@darrellwarde](https://github.com/darrellwarde)! - Remove redundant adding of resolvers to schema to improve performance

- Updated dependencies [[`94b6cea4f`](https://github.com/neo4j/graphql/commit/94b6cea4f26b90523fed59d0b22cbac25461a71c)]:
    - @neo4j/cypher-builder@0.1.4

## 3.12.0

### Minor Changes

- [#2286](https://github.com/neo4j/graphql/pull/2286) [`8642d3d67`](https://github.com/neo4j/graphql/commit/8642d3d67882cda2a0e212bdcf4b56376d419509) Thanks [@Liam-Doodson](https://github.com/Liam-Doodson)! - Created a new top-level query for full-text indexes. Added the full-text score to the results of this new query and made it possible to filter, sort and paginate the results. Deprecated existing full-text queries.

- [#2115](https://github.com/neo4j/graphql/pull/2115) [`3b06cafbc`](https://github.com/neo4j/graphql/commit/3b06cafbc9f8ac6bfe43997bdd8e9db784b3907b) Thanks [@MacondoExpress](https://github.com/MacondoExpress)! - Optimized batch creation, when possible, to improve performance when a large numbers of nodes are created in single mutation

### Patch Changes

- [#2281](https://github.com/neo4j/graphql/pull/2281) [`0faef6f33`](https://github.com/neo4j/graphql/commit/0faef6f3330d70126817f6496556f5ad85611ad9) Thanks [@angrykoala](https://github.com/angrykoala)! - Add reconnect option in AMQP subscriptions plugin

- Updated dependencies [[`7aff0cf19`](https://github.com/neo4j/graphql/commit/7aff0cf194010c8268024917abec931d9ba2c359)]:
    - @neo4j/cypher-builder@0.1.3

## 3.11.1

### Patch Changes

- [#2304](https://github.com/neo4j/graphql/pull/2304) [`2c6d986a1`](https://github.com/neo4j/graphql/commit/2c6d986a19061fd8bc7739a2dd4737e7828e20d0) Thanks [@angrykoala](https://github.com/angrykoala)! - Use @neo4j/cypher-builder for cypher generation

- Updated dependencies [[`42771f950`](https://github.com/neo4j/graphql/commit/42771f950badfc33e8babf07f85931ebd6018749)]:
    - @neo4j/cypher-builder@0.1.2

## 3.11.0

### Minor Changes

- [#2220](https://github.com/neo4j/graphql/pull/2220) [`44fc500eb`](https://github.com/neo4j/graphql/commit/44fc500ebbaff3f8cdfcc676bd2ef8cad2fd58ec) Thanks [@Liam-Doodson](https://github.com/Liam-Doodson)! - Added the `@plural` directive and depreacted the `plural` argument of the `@node` directive.

- [#2225](https://github.com/neo4j/graphql/pull/2225) [`b37376e38`](https://github.com/neo4j/graphql/commit/b37376e38e13ab2ed6f0e0eeb99f2d9f17161fd7) Thanks [@Liam-Doodson](https://github.com/Liam-Doodson)! - Added the `@customResolver` directive and deprecated the `@computed` directive.

- [#2232](https://github.com/neo4j/graphql/pull/2232) [`94512c90e`](https://github.com/neo4j/graphql/commit/94512c90e5e37601a4d260f1153ac043639ceb6f) Thanks [@Liam-Doodson](https://github.com/Liam-Doodson)! - Added checks for custom resolvers for fields with the `@customResolver` directive.

- [#2214](https://github.com/neo4j/graphql/pull/2214) [`4ee4d40ad`](https://github.com/neo4j/graphql/commit/4ee4d40ad5aca514ddc08091b2501bfa699294e9) Thanks [@Liam-Doodson](https://github.com/Liam-Doodson)! - Added the `@populatedBy` directive to replace the `@callback` directive and deprecated the `@callback` directive.

### Patch Changes

- [#2268](https://github.com/neo4j/graphql/pull/2268) [`8eff620b9`](https://github.com/neo4j/graphql/commit/8eff620b93d86d544d4594b69c5058a9092347c0) Thanks [@angrykoala](https://github.com/angrykoala)! - Fix invalid nested results on sorted connections without edges #2262

- [#2200](https://github.com/neo4j/graphql/pull/2200) [`c769933cb`](https://github.com/neo4j/graphql/commit/c769933cba76d16c4f14b2c18aaf5c47415b05d9) Thanks [@a-alle](https://github.com/a-alle)! - Throw an error when the same db property is being modified at once

- [#2260](https://github.com/neo4j/graphql/pull/2260) [`5ce80724f`](https://github.com/neo4j/graphql/commit/5ce80724f4d45a38e5d4b5d0d369384a4599d51f) Thanks [@angrykoala](https://github.com/angrykoala)! - Fix invalid Cypher on nested update operations with interfaces

- [#2252](https://github.com/neo4j/graphql/pull/2252) [`2c8f3ec37`](https://github.com/neo4j/graphql/commit/2c8f3ec37ce57f281972ddc107a9490392c482df) Thanks [@angrykoala](https://github.com/angrykoala)! - Fix nested update with subscriptions invalid Cypher

- [#2274](https://github.com/neo4j/graphql/pull/2274) [`74e6fee11`](https://github.com/neo4j/graphql/commit/74e6fee119c8f0c7d30384422e722754411135b9) Thanks [@angrykoala](https://github.com/angrykoala)! - Fix ordering with nested interface fields #2267

- [#2266](https://github.com/neo4j/graphql/pull/2266) [`e7bcf4f0b`](https://github.com/neo4j/graphql/commit/e7bcf4f0b69a75c10e0ee0a604fd35cab09fcfaf) Thanks [@angrykoala](https://github.com/angrykoala)! - Fix error of queries with mixed nested fields and cypher elements #2261

## 3.10.1

### Patch Changes

- [#2207](https://github.com/neo4j/graphql/pull/2207) [`23467c469`](https://github.com/neo4j/graphql/commit/23467c4699287c9d33c0a1004db83ddb9e7e606a) Thanks [@angrykoala](https://github.com/angrykoala)! - Use lastBookmark instead of lastBookmarks to keep compatibility of neo4j-driver 4 in tests

## 3.10.0

### Minor Changes

- [#2175](https://github.com/neo4j/graphql/pull/2175) [`7b8a73cbd`](https://github.com/neo4j/graphql/commit/7b8a73cbd3e6accaaa7d64daa35f25941a7022c1) Thanks [@Liam-Doodson](https://github.com/Liam-Doodson)! - Added extra where fields for custom scalars. For lists of custom scalars \_NOT, \_INCLUDES and \_NOT_INCLUDES are now supported. For a single value custom scalars \_NOT, \_IN and \_NOT_IN are now supported.

### Patch Changes

- [#2183](https://github.com/neo4j/graphql/pull/2183) [`64b3d0777`](https://github.com/neo4j/graphql/commit/64b3d07776685400313603f57e274ad8e821968b) Thanks [@darrellwarde](https://github.com/darrellwarde)! - Fix invalid auth clauses for operations other than CONNECT or CREATE in `connectOrCreate`

- [#2190](https://github.com/neo4j/graphql/pull/2190) [`cad28dd1f`](https://github.com/neo4j/graphql/commit/cad28dd1f2f92fccf713beee600d2234c7c9709b) Thanks [@angrykoala](https://github.com/angrykoala)! - Fix union types on custom cypher directives

- [#2190](https://github.com/neo4j/graphql/pull/2190) [`cad28dd1f`](https://github.com/neo4j/graphql/commit/cad28dd1f2f92fccf713beee600d2234c7c9709b) Thanks [@angrykoala](https://github.com/angrykoala)! - Fix invalid WHERE clause after WITH in a CALL subquery

- [#2180](https://github.com/neo4j/graphql/pull/2180) [`5a748dc32`](https://github.com/neo4j/graphql/commit/5a748dc326ff063a8d8db6c281d681a68b679ade) Thanks [@a-alle](https://github.com/a-alle)! - Fix sort priority order between edge and node sort fields in the same query

- [#2196](https://github.com/neo4j/graphql/pull/2196) [`c4ced43c0`](https://github.com/neo4j/graphql/commit/c4ced43c01cdd0d86d60a68906c3e79d847c5394) Thanks [@angrykoala](https://github.com/angrykoala)! - Fix #2189: `@cypher` directive forcefuly omits empty fields

## 3.9.0

### Minor Changes

- [#2099](https://github.com/neo4j/graphql/pull/2099) [`0c89c88ae`](https://github.com/neo4j/graphql/commit/0c89c88ae25bb6c06edac4adff43b47802f45ea1) Thanks [@a-alle](https://github.com/a-alle)! - Allows combining filters with AND/OR when subscribing to events.

- [#2025](https://github.com/neo4j/graphql/pull/2025) [`fb1e2c93f`](https://github.com/neo4j/graphql/commit/fb1e2c93f41adeaa61cc458f20a5812472ed3e2c) Thanks [@a-alle](https://github.com/a-alle)! - Add support for @exclude directive on subscription operations

### Patch Changes

- [#2105](https://github.com/neo4j/graphql/pull/2105) [`28742a5bd`](https://github.com/neo4j/graphql/commit/28742a5bd77b21497300248d18ff23206e1ec66f) Thanks [@a-alle](https://github.com/a-alle)! - Fix on `@cypher` directive fields in connections

## 3.8.0

### Minor Changes

- [#2081](https://github.com/neo4j/graphql/pull/2081) [`e978b185f`](https://github.com/neo4j/graphql/commit/e978b185f1d0fe4ec7bd75ecbaa03a5216105a14) Thanks [@darrellwarde](https://github.com/darrellwarde)! - Allow `@fulltext` directive to specify `ID` fields

- [#1972](https://github.com/neo4j/graphql/pull/1972) [`a965bd861`](https://github.com/neo4j/graphql/commit/a965bd861bef0fab93480705ac4f011f1f6c534f) Thanks [@a-alle](https://github.com/a-alle)! - Add more filtering options on subscriptions

- [#1822](https://github.com/neo4j/graphql/pull/1822) [`1d90a5252`](https://github.com/neo4j/graphql/commit/1d90a5252abf724fc91b92fe3a86ee69c0ab26bb) Thanks [@MacondoExpress](https://github.com/MacondoExpress)! - Adds database version detection so that Cypher can be generated in a dynamic manner. Uses this new logic to switch between `point.distance()` and `distance()` as needed. This PR also switches over to use the Cypher index management API.

### Patch Changes

- [#1986](https://github.com/neo4j/graphql/pull/1986) [`f958503e0`](https://github.com/neo4j/graphql/commit/f958503e059fcfabc46628fd651914e08d29b998) Thanks [@tbwiss](https://github.com/tbwiss)! - fix: Sum aggregate on where unexpected behaviour (#1933)

- [#2053](https://github.com/neo4j/graphql/pull/2053) [`2abb6036f`](https://github.com/neo4j/graphql/commit/2abb6036f267ba0c1310f36e3a7882948800ae05) Thanks [@angrykoala](https://github.com/angrykoala)! - Remove apoc.cypher.runFirstColumnSingle from connections projections

- [#2023](https://github.com/neo4j/graphql/pull/2023) [`a037e34a9`](https://github.com/neo4j/graphql/commit/a037e34a9bb1f8eff07992e0d08b9c0fbf5f5a11) Thanks [@litewarp](https://github.com/litewarp)! - fix: nested relation error with interface query

- [#2009](https://github.com/neo4j/graphql/pull/2009) [`8260fb845`](https://github.com/neo4j/graphql/commit/8260fb845aced51dbf90425870b766210c96a22c) Thanks [@angrykoala](https://github.com/angrykoala)! - Fix nested interface projections

- [#2065](https://github.com/neo4j/graphql/pull/2065) [`99a7f707a`](https://github.com/neo4j/graphql/commit/99a7f707ad4afd2ef1613e8218de713836d165f3) Thanks [@darrellwarde](https://github.com/darrellwarde)! - fix: multiple nodes created if following connection of multiple interface relationships

- [#2014](https://github.com/neo4j/graphql/pull/2014) [`66c040179`](https://github.com/neo4j/graphql/commit/66c0401791e9fc0182a2e5c271bff11bd05f5fef) Thanks [@mjfwebb](https://github.com/mjfwebb)! - refactor: fix linting errors and add types

- [#2002](https://github.com/neo4j/graphql/pull/2002) [`1ceb09860`](https://github.com/neo4j/graphql/commit/1ceb09860e256ea5f7bebe4797c31045d3ca9ece) Thanks [@tbwiss](https://github.com/tbwiss)! - fix: Remove "Math.floor(Math.random() \* Math.random())" from integration tests

- [#2062](https://github.com/neo4j/graphql/pull/2062) [`972a06c83`](https://github.com/neo4j/graphql/commit/972a06c83db82bbef49c56f861d07ff688b99cb5) Thanks [@darrellwarde](https://github.com/darrellwarde)! - fix: there will no longer be a Cypher syntax error when selecting interface relationship fields following the creation of multiple nodes

## 3.7.0

### Minor Changes

- [#1925](https://github.com/neo4j/graphql/pull/1925) [`1c589e246`](https://github.com/neo4j/graphql/commit/1c589e246f0ce9ffe82c5e7612deb4e7bac7c6e1) Thanks [@tbwiss](https://github.com/tbwiss)! - feat: Adding the functionality to enable global authentication via a setting in the Auth plugin

### Patch Changes

- [#1918](https://github.com/neo4j/graphql/pull/1918) [`957da9430`](https://github.com/neo4j/graphql/commit/957da943008508b43e996efea0c7fa0fe7c08495) Thanks [@angrykoala](https://github.com/angrykoala)! - Refactor Cypher projections on relationships to subqueries

- [#1968](https://github.com/neo4j/graphql/pull/1968) [`4e6a38799`](https://github.com/neo4j/graphql/commit/4e6a38799a470bc9846b3800e3abbdd508a88e38) Thanks [@angrykoala](https://github.com/angrykoala)! - Unpin peer dependencies to support a wider range of versions

- [#1954](https://github.com/neo4j/graphql/pull/1954) [`31c287458`](https://github.com/neo4j/graphql/commit/31c2874588842501636fd754fe18bbc648e4e849) Thanks [@angrykoala](https://github.com/angrykoala)! - Performance improvement on \_SINGLE operations

- [#1939](https://github.com/neo4j/graphql/pull/1939) [`37a77f97c`](https://github.com/neo4j/graphql/commit/37a77f97cab35edf2ab0a09cb49800564ac99e6f) Thanks [@angrykoala](https://github.com/angrykoala)! - Performance improvement in nested relationship operations \_SOME, \_ALL and \_NONE

- [#1934](https://github.com/neo4j/graphql/pull/1934) [`8b6d0990b`](https://github.com/neo4j/graphql/commit/8b6d0990b04a985e06d9b9f880ddd86b75cd00d5) Thanks [@angrykoala](https://github.com/angrykoala)! - Remove apoc.coll.sortMulti

- [#1955](https://github.com/neo4j/graphql/pull/1955) [`5955a6a36`](https://github.com/neo4j/graphql/commit/5955a6a363b0490916ca2765e457b01be751ad20) Thanks [@angrykoala](https://github.com/angrykoala)! - Fix label injection through unicode

## 3.6.3

### Patch Changes

- [#1842](https://github.com/neo4j/graphql/pull/1842) [`037856af`](https://github.com/neo4j/graphql/commit/037856afc74e9739707cb5a92cb830edc24a43b1) Thanks [@MacondoExpress](https://github.com/MacondoExpress)! - Fix bug where callback fields were not included in the onCreate input type.

- [#1919](https://github.com/neo4j/graphql/pull/1919) [`7e90ecfe`](https://github.com/neo4j/graphql/commit/7e90ecfed5a3cc61dda8d54d525c190842f0d1ef) Thanks [@tbwiss](https://github.com/tbwiss)! - fix: Support for Neo4j GraphQL Toolbox in Safari web browser

- [#1926](https://github.com/neo4j/graphql/pull/1926) [`7affa891`](https://github.com/neo4j/graphql/commit/7affa8912e16bf3ebf27bd5460eb5c671f9b672a) Thanks [@angrykoala](https://github.com/angrykoala)! - Remove apoc.cypher.runFirstColumnSingle from point values projection

- [#1882](https://github.com/neo4j/graphql/pull/1882) [`07109478`](https://github.com/neo4j/graphql/commit/07109478b0dbd7ca4cf99f31e720f09ea8ad77c2) Thanks [@tbwiss](https://github.com/tbwiss)! - fix: Pass the cypherParams from the top-level context to the translate functions.

- [#1837](https://github.com/neo4j/graphql/pull/1837) [`07d2b61e`](https://github.com/neo4j/graphql/commit/07d2b61e35820def7c399b110a7bc99217f76e60) Thanks [@angrykoala](https://github.com/angrykoala)! - Fix nested filters on aggregations

- [#1854](https://github.com/neo4j/graphql/pull/1854) [`d7870c31`](https://github.com/neo4j/graphql/commit/d7870c31faaa1e211236fac4e50714937f07ce22) Thanks [@darrellwarde](https://github.com/darrellwarde)! - Remove instances of `apoc.meta.type`, to reduce our Apoc footprint in the GraphQL Library.

## 3.6.2

### Patch Changes

- [#1849](https://github.com/neo4j/graphql/pull/1849) [`68e44f53`](https://github.com/neo4j/graphql/commit/68e44f53672740780cd51d7985f15c85fd7def54) Thanks [@tbwiss](https://github.com/tbwiss)! - Fix: Cypher generation syntax error
  Generated cypher statement when executed produces a syntax error, requires white spaces between AND and variable name.

## 3.6.1

### Patch Changes

- [#1796](https://github.com/neo4j/graphql/pull/1796) [`3c2d0658`](https://github.com/neo4j/graphql/commit/3c2d065889159dd4b5c37c24de58cd1b34869790) Thanks [@darrellwarde](https://github.com/darrellwarde)! - fix: move `ORDER BY`, `SKIP` and `LIMIT` to as early as possible in a Cypher query. This results in significant reduction in projecting related nodes which will be made redundant by a late `SKIP` and `LIMIT`.

- [#1810](https://github.com/neo4j/graphql/pull/1810) [`fad52b51`](https://github.com/neo4j/graphql/commit/fad52b513d7835b0a01856c2882ab536df205252) Thanks [@angrykoala](https://github.com/angrykoala)! - Remove apoc.runFirstColumn from count projection to avoid database contention

## 3.6.0

### Minor Changes

- [#1619](https://github.com/neo4j/graphql/pull/1619) [`0a49f56d`](https://github.com/neo4j/graphql/commit/0a49f56dbd45eb3ca69ceafce4ed308cdc1d6e90) Thanks [@mjfwebb](https://github.com/mjfwebb)! - Feat: Array methods pop and push

- [#1773](https://github.com/neo4j/graphql/pull/1773) [`381c4061`](https://github.com/neo4j/graphql/commit/381c40610766f9eb6c938ddba424e44e3382f103) Thanks [@MacondoExpress](https://github.com/MacondoExpress)! - Comparators `LT`, `LTE`, `GT`, and `GTE` now are included for string fields.
  Add `features` option to `Neo4jGraphQLConfig`, which allows to enable, disable or configure specific features.

### Patch Changes

- [#1778](https://github.com/neo4j/graphql/pull/1778) [`4c8098f4`](https://github.com/neo4j/graphql/commit/4c8098f428937b7bd6bf3d29abb778618c7b030c) Thanks [@darrellwarde](https://github.com/darrellwarde)! - fixed: Aggregation column contains implicit grouping expressions

- [#1781](https://github.com/neo4j/graphql/pull/1781) [`36ebee06`](https://github.com/neo4j/graphql/commit/36ebee06352f5edbbd3748f818b8c0a7c5262681) Thanks [@darrellwarde](https://github.com/darrellwarde)! - fix: always specify a default database to avoid round-trip requests for routing table

- [#1757](https://github.com/neo4j/graphql/pull/1757) [`ba713faf`](https://github.com/neo4j/graphql/commit/ba713faf7da05c6f9031c83542dbc51bc1a0239e) Thanks [@angrykoala](https://github.com/angrykoala)! - Fix connection projection for nodes with zero relationships

- [#1738](https://github.com/neo4j/graphql/pull/1738) [`801cdaea`](https://github.com/neo4j/graphql/commit/801cdaea608e83fa3ba9fffb56b4f93db88d149a) Thanks [@litewarp](https://github.com/litewarp)! - fixed: cannot query Cypher fields on root connections when sort is not provided as an argument

- [#1747](https://github.com/neo4j/graphql/pull/1747) [`21a0c58c`](https://github.com/neo4j/graphql/commit/21a0c58c85c8368c70c6a83a428f0c20231557b4) Thanks [@tbwiss](https://github.com/tbwiss)! - fix: Invalid Cypher generated for connection predicates

- [#1770](https://github.com/neo4j/graphql/pull/1770) [`4d62eea7`](https://github.com/neo4j/graphql/commit/4d62eea78fe4a2d72805697a0adcb0b21625e87e) Thanks [@angrykoala](https://github.com/angrykoala)! - Fix nested connection filters using SINGLE and SOME
  Fix implicit and parameters missing in connection where

- [#1780](https://github.com/neo4j/graphql/pull/1780) [`28ffcf88`](https://github.com/neo4j/graphql/commit/28ffcf88d0b5026eb2f3cce756b762fc9d025811) Thanks [@darrellwarde](https://github.com/darrellwarde)! - fixed: an EXISTS clause is used in a RETURN clause where it is not valid

- [#1723](https://github.com/neo4j/graphql/pull/1723) [`0f52cf7e`](https://github.com/neo4j/graphql/commit/0f52cf7e360da1c9e68a8d63c81f1c35a66679f4) Thanks [@tbwiss](https://github.com/tbwiss)! - Fix: Simple connection query with `totalCount` fails.

- [#1789](https://github.com/neo4j/graphql/pull/1789) [`52f755b0`](https://github.com/neo4j/graphql/commit/52f755b0a5ecda6f8356a61e83591c7c00b1e30e) Thanks [@darrellwarde](https://github.com/darrellwarde)! - fix: structure of CASE statements not in line with best practice

- [#1743](https://github.com/neo4j/graphql/pull/1743) [`1c7987b5`](https://github.com/neo4j/graphql/commit/1c7987b51b10fed565d92e9d74256f986800c2cf) Thanks [@darrellwarde](https://github.com/darrellwarde)! - fixed: redundant check against non-existent parameter when querying interface connection using `_on`

- [#1724](https://github.com/neo4j/graphql/pull/1724) [`de4756ca`](https://github.com/neo4j/graphql/commit/de4756caa7b5d6baad4ea549e7a7652dabfa89fc) Thanks [@tbwiss](https://github.com/tbwiss)! - Fix: Filtering using connection fields could fail

## 3.5.1

### Patch Changes

- 30af948c: Update Cypher execution functionality so that transaction functions are used when executing using either a driver or a session.
