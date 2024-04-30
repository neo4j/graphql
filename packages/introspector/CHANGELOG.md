# @neo4j/introspector

## 3.0.1

### Patch Changes

-   [#5053](https://github.com/neo4j/graphql/pull/5053) [`dc45cc4`](https://github.com/neo4j/graphql/commit/dc45cc45b1fe6fbb44756e12519c1447673ebfdb) Thanks [@a-alle](https://github.com/a-alle)! - Add Duration type to introspector

## 3.0.0

### Major Changes

-   [#4410](https://github.com/neo4j/graphql/pull/4410) [`a76c9c9`](https://github.com/neo4j/graphql/commit/a76c9c96486d98514903c1d8cffaa17a53c6eb07) Thanks [@angrykoala](https://github.com/angrykoala)! - Change @relationshipProperties to target types instead of interfaces:

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

-   [#4441](https://github.com/neo4j/graphql/pull/4441) [`6653a9e`](https://github.com/neo4j/graphql/commit/6653a9e7850101c75608d341a72ef48818addfcd) Thanks [@a-alle](https://github.com/a-alle)! - Introduce new properties field in connection edges field for relationship properties.

## 2.0.0

### Major Changes

-   [#2773](https://github.com/neo4j/graphql/pull/2773) [`7462b9715`](https://github.com/neo4j/graphql/commit/7462b97158bb7a202a77ec389270151e8d49cfb3) Thanks [@angrykoala](https://github.com/angrykoala)! - Deprecated @node directive arguments `label` and `additionalLabels` have been removed. Please use the `labels` argument.

### Patch Changes

-   [#2773](https://github.com/neo4j/graphql/pull/2773) [`7462b9715`](https://github.com/neo4j/graphql/commit/7462b97158bb7a202a77ec389270151e8d49cfb3) Thanks [@angrykoala](https://github.com/angrykoala)! - Introspector now produces `@mutation` directive instead on `@exclude` when readonly

## 2.0.0-beta.1

### Patch Changes

-   [#3743](https://github.com/neo4j/graphql/pull/3743) [`85b3c06e8`](https://github.com/neo4j/graphql/commit/85b3c06e800699f30daedc796286c37cd318746c) Thanks [@darrellwarde](https://github.com/darrellwarde)! - Introspector now produces `@mutation` directive instead on `@exclude` when readonly

## 2.0.0-beta.0

### Major Changes

-   [#2834](https://github.com/neo4j/graphql/pull/2834) [`8d3aff007`](https://github.com/neo4j/graphql/commit/8d3aff007c0d5428313cef23602e9a4ef5ef3792) Thanks [@a-alle](https://github.com/a-alle)! - Deprecated @node directive arguments `label` and `additionalLabels` have been removed. Please use the `labels` argument.

## 1.0.3

### Patch Changes

-   [#2826](https://github.com/neo4j/graphql/pull/2826) [`c2eaff8ef`](https://github.com/neo4j/graphql/commit/c2eaff8ef94b8cc6297be1435131967ea8a71115) Thanks [@angrykoala](https://github.com/angrykoala)! - Fix injection through relationship labels on introspection

## 1.0.2

### Patch Changes

-   [#2014](https://github.com/neo4j/graphql/pull/2014) [`66c040179`](https://github.com/neo4j/graphql/commit/66c0401791e9fc0182a2e5c271bff11bd05f5fef) Thanks [@mjfwebb](https://github.com/mjfwebb)! - refactor: fix linting errors and add types
