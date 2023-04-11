# Read/write controls

## Problem

The current `@exclude` directive does not offer the level of granularity that our users desire. We have a number of GitHub issues proposing new features in this area:

* [#1672](https://github.com/neo4j/graphql/issues/1672) proposes the need to selectively disable aggregation and connection fields
* [#2804](https://github.com/neo4j/graphql/issues/2804) proposes the need to selectively disable filtering and sorting
* [#1034](https://github.com/neo4j/graphql/issues/1034) proposes being able to use `@exclude` on field definitions
* [#850](https://github.com/neo4j/graphql/issues/850) proposes being able to use `@exclude` on relationship fields

## Advanced use case summary

```gql
type User @write(operations: [CREATE, UPDATE]) {
  name: String!
  comments: [Comment!]! @relationship(type: "HAS_AUTHOR", direction: IN) @aggregations
  posts: [Post!]! @relationship(type: "HAS_AUTHOR", direction: IN) @aggregations
}

type Post @write(operations: [CREATE, UPDATE, DELETE]) {
  content: String!
  comments: [Comment!]! @relationship(type: "HAS_COMMENT", direction: OUT) @write(operations: [CREATE])
  author: User! @relationship(type: "HAS_AUTHOR", direction: OUT) @write(operations: [CREATE_RELATIONSHIP])
}

type Comment @write(operations: [UPDATE, DELETE]) {
  content: String!
  post: Post! @relationship(type: "HAS_COMMENT", direction: IN)
  author: User! @relationship(type: "HAS_AUTHOR", direction: OUT) @write(operations: [CREATE_RELATIONSHIP])
}

extend schema @readonly
```

* `extend schema @readonly` makes the entire schema read-only
* The following Mutation Fields are added:
  * `createUsers`, `updateUsers`
  * `createPosts`, `updatePosts`, `deletePosts`
  * `updateComments`, `deleteComments`
* All relationships _from_ `User` are read-only, but with added aggregation fields
* `Comment` nodes can _only_ be created when coming from a `Post`
* The `post` field from `Comment` is read-only
* The `author` field _must_ be connected to a `User` when coming from either a `Post` or `Comment`

This highlights some disadvantages:

* Despite `CREATE` and `UPDATE` being specified on `User`, we ended up overwriting them for all relationships pointing to `User`

## Solution

It is likely that a single directive for this functionality is no longer desired, given the ever-expanding capabilities of the library.

This RFC will discuss some options on how functionality might be split.

### Globals

There are currently `@readonly` and `@writeonly` directive which are only applicable to fields. These will be extended, with a toggle argument added for usage in overriding situations:

```gql
directive @readonly on SCHEMA | OBJECT | FIELD_DEFINITION

directive @writeonly(
  enabled: Boolean! = true
) on SCHEMA | OBJECT | FIELD_DEFINITION
```

Note that the `@readonly` argument does not need a toggle argument because the `@write` directive can be used for this purpose. This reduces the number of sugar syntax directives.

Only one of the above can be used in any given location.

To disable all Mutations (and thus, all nested operations):

```gql
extend schema @readonly
```

To disable all Queries, except for the Relay `node` Query:

```gql
extend schema @writeonly
```

To disable all nested write operations across a particular relationship:

```gql
type Movie {
  title: String!
}

type Actor {
  name: String!
  movies: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT) @readonly
}
```

To re-enable reads for the `Actor.movies` relationship in the following example where the `Movie` type has been set as write-only:

```gql
type Movie @writeonly {
  title: String!
}

type Actor {
  name: String!
  movies: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT) @writeonly(enabled: false)
}
```

### Aggregations

At present, it is the intention to only introduce toggling for aggregation queries.

Due to future intentions of API design in the library, Connections will become the primary currency, and we want to normalize their usage as opposed to encourage them being disabled.

We will introduce a single directive to toggle aggregations:

```gql
directive @aggregations (
  enabled: Boolean! = true
) on SCHEMA | OBJECT | FIELD_DEFINITION
```

At present, the proposal is that aggregations will be disabled by default.

To enable them for the entire schema, as is the current behaviour:

```gql
extend schema @aggregations
```

To enable them for a particular type:

```gql
type Movie @aggregations {
  title: String!
}

type Actor {
  name: String!
  movies: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT)
}
```

The above will enable:

* The `moviesAggregate` root-level Query field
* The nested `Actor.moviesAggregate` field

Finally, aggregations can be toggled for a relationship field:

```gql
type Movie {
  title: String!
}

type Actor {
  name: String!
  movies: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT) @aggregations 
}
```

The above will enable only the `Actor.moviesAggregate` field. The use of the `@aggregations` directive on a non-relationship field will throw an error.

Finally, the `@aggregations` directive can be used to override the toggle at a higher level:

```gql
type Movie @aggregations(enabled: false) {
  title: String!
}

type Actor {
  name: String!
  movies: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT) @aggregations 
}

extend type schema @aggregations
```

The above will:

* Enable all root-level and nested aggregation fields
  * However, the `Query.moviesAggregate` and `Actor.moviesAggregate` fields will be disabled by the `@aggregations` directive on the `Movie` type
    * However, the `Actor.moviesAggregate` field will once again be enabled by the `@aggregations` directive on `Actor.movies`

### Write operations

This option takes an unopinionated view of root-level versus nested operations, encompassing them all in a single directive. These operations are:

* `CREATE`
* `UPDATE`
* `DELETE`
* `CREATE_RELATIONSHIP`
* `DELETE_RELATIONSHIP`

The directive for toggling these operations will be defined as:

```gql
enum WriteOperation {
  CREATE
  DELETE
  UPDATE
  CREATE_RELATIONSHIP
  DELETE_RELATIONSHIP
}

directive @write(
  operations: [WriteOperation!]! = [CREATE, UPDATE, DELETE, CREATE_RELATIONSHIP, DELETE_RELATIONSHIP]
) on SCHEMA | OBJECT | FIELD_DEFINITION
```

To remove create operations from both the Mutation type and also nested operations, one can simply do:

```gql
extend schema @write(operations: [UPDATE, DELETE, CREATE_RELATIONSHIP, DELETE_RELATIONSHIP])
```

For a particular type, you can remove its create operation from the Mutation type and also from any nested relationship operations pointing _to_ it by doing:

```gql
type User @write(operations: [UPDATE, DELETE, CREATE_RELATIONSHIP, DELETE_RELATIONSHIP]) {
  name: String!
}
```

Finally, you can remove nested operations for a particular relationship:

```gql
type User {
  name: String!
}

type Post {
  author: User! @relationship(type: "HAS_AUTHOR", direction: OUT) @write(operations: [UPDATE, DELETE, CREATE_RELATIONSHIP, DELETE_RELATIONSHIP]) 
}
```

It should be noted, that when used on a field definition, it is only valid when combined with a `@relationship` directive, and this should be confirmed during type definition validation.

The `@write` directive can also be used in multiple locations to introduce complex rules:

```gql
type Comment @write(operations: [CREATE, DELETE, UPDATE, CREATE_RELATIONSHIP, DELETE_RELATIONSHIP]) {
  content: String!
}

type Post {
  comments: [Comment!]! @relationship(type: "HAS_COMMENT", direction: OUT) @write(operations: [CREATE])
}

extend schema @write(operations: [CREATE, UPDATE, CREATE_RELATIONSHIP, DELETE_RELATIONSHIP])
```

In the above example:

* All delete operations are removed at the schema level
  * The `deleteComments` Mutation field, however, is reintroduced by the `@write` directive on the `Comment` type
* When performing a nested operation from the `Post` type, you can only create a `Comment`, and nothing else

#### `connectOrCreate`

The existence of the `connectOrCreate` operation will depend on both the `CREATE` and `CREATE_RELATIONSHIP` operations being present in the `@write` directive.
