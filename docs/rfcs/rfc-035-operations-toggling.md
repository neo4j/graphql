# Operations toggling

## Requirements

* "Levels":
  * Top-level entry points
  * Nested traversals

* Required configurability:
  * Queries:
    * Default
    * Aggregations
    * Connections
  * Filters:
    * Default
    * Aggregations
    * Connections
  * Mutations:
    * Create
    * Update
    * Delete
  * Subscriptions:
    * Create event
    * Delete event
    * Update event
    * Create relationship event
    * Delete relationship event

## Subscriptions configuration

### Enabled/disabled by events specification only

```gql
enum SubscriptionEvent {
  CREATE
  UPDATE
  DELETE
  CREATE_RELATIONSHIP
  DELETE_RELATIONSHIP
}

directive @subscription(
  events: [SubscriptionEvent!]! = [CREATE, UPDATE, DELETE, CREATE_RELATIONSHIP, DELETE_RELATIONSHIP]
) on OBJECT | SCHEMA


type User @subscription(events: [CREATE]) {
  name: String!
}
```

```gql
enum SubscriptionEvent {
  CREATE
  UPDATE
  DELETE
  CREATE_RELATIONSHIP
  DELETE_RELATIONSHIP
}

directive @subscription(
  events: [SubscriptionEvent!]! = [CREATE, UPDATE, DELETE, CREATE_RELATIONSHIP, DELETE_RELATIONSHIP]
) on OBJECT | SCHEMA

type User @subscription(events: []) {
  name: String!
}

type Movie {
  title: String!
}

extend schema @subscription(events: [CREATE])
```

Don't mix boolean flag with array of events/operations, it's confusing when the two are combined.
Ensure that authentication/authorization work in the same way, using an empty array to disable.

Alternatively with a boolean flag:

```gql
directive @subscription(
  enabled: Boolean! = true
  events: [SubscriptionEvent!]! = [CREATE, UPDATE, DELETE, CREATE_RELATIONSHIP, DELETE_RELATIONSHIP]
) on OBJECT | SCHEMA

type User @subscription(enabled: false) {
  name: String!
}

type Movie {
  title: String!
}

extend schema @subscription(events: [CREATE])
```

Which is technically equivalent to:

```gql
type User @subscription(enabled: false, events: [CREATE, UPDATE, DELETE, CREATE_RELATIONSHIP, DELETE_RELATIONSHIP]) {
  name: String!
}
```

## Mutation

```gql
enum MutationOperation {
  CREATE
  UPDATE
  DELETE
}

directive @mutation(
  operations: [MutationOperation!]! = [CREATE, UPDATE, DELETE]
) on OBJECT | SCHEMA


type User @mutation(operations: [CREATE]) {
  name: String!
}
```

```gql
extend schema @mutation
```

```gql
type User @protected(operations: [DELETE]) {

}

type User @operations(enabled: [CREATE])
```

                create     update     delete     read
readonly            x                            x
writeonly           x      x          x
rejectdelete        x      x                     x
readwrite(default)  x      x          x          x
readonly(nocreate)                               x
rejectcreate               x          x          x

`@permissions(mode: READONLY)`

```gql
type User {
  posts: [Post!]! @relationship(type: "HAS_AUTHOR", direction: IN) @aggregation
}

extend schema @aggregation
```

READ
UPDATE
AGGREGATE

```gql
type User {

}

type Movie @exclude(operations: [AGGREGATE, READ]) {

}

type Post {

}

extend schema @exclude(operations: [AGGREGATE, READ, CREATE])
```

Defaults:

* Create Mutation: YES
* Update Mutation: YES
* Delete Mutation: YES
* Nested: YES
  * create
  * update
  * delete
  * connect
  * disconnect

updateMovies
  where?
  create
  update
  delete
  connect
  disconnect

operations: {
  Movie: {
    create: true
    delete: true
    update: true
    connect: false
    disconnect: false
  }
}

Brainstorming 09/02/23 morning Diplomat:

```gql
type Movie {
  title: String!
  actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN, operations: [CREATE]) @operations(enable: [CREATE, DELETE])
}

type Actor @operations(enable: [CREATE, DELETE]) {
  name: String!
  movies: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT)
}


enum WriteOperations {
  CREATE
  DELETE
  UPDATE
}

directive @operations(
 node: [WriteOperations!]! = [CREATE, DELETE, UPDATE]
  relationship: [WriteOperations!]! = [CREATE, DELETE, UPDATE]
) on SCHEMA | FIELD_DEFINITION | OBJECT

# A type can have a directive to enable/disable operations on that NODE: DEFINITE
# A relationship field can have create/update/delete operations enabled/disabled: DEFINITE
# A schema level directive to enable/disable create/delete/update NODES: DEFINITE

# Uncertainties:
#  * Type-level relationship operation toggling
#. * Schema-level relationship operation toggling
#. * To include _RELATIONSHIP or not
#. * Relationship operation toggling inside or outside of @relationship directive

```

## Use cases

### I want to disable all node creations in my API

```gql
enum WriteOperations {
  CREATE
  UPDATE
  DELETE
}

extend schema @write(operations: [DELETE, UPDATE])
```

### I want to disable the node creation of a particular type

```gql
type Movie @write(operations: [DELETE, UPDATE]) {
  title: String
}
```

### I want to disable create of relationships for a given relationship field

```gql
enum RelationshipWriteOperations {
  CREATE
  UPDATE
  DELETE
  CONNECT
  DISCONNECT
}

type Movie {
  title: String!
  actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN, writeOperations: [CREATE, CONNECT, DISCONNECT, UPDATE, DELETE])
}
```

### I want to disable the create of nodes for a given relationship field

`@relationship` directive will have an argument `writeOperations` which allows for the configuring of nested write operations.

The `@write` directive is not applicable here because that would require ability to apply to `FIELD` locations. This would give the impression that this could also be used on Scalar type fields, which is not the case. Additionally, `CONNECT` and `DISCONNECT` will only be available as nested operations of a relationship, given that these are "contextual" operations.

```gql
type Movie {
  actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN, writeOperations: [CONNECT, DISCONNECT, UPDATE, DELETE])
}
```

```gql
enum RelationshipWriteOperations {
  CREATE
  UPDATE
  DELETE
  CONNECT
  DISCONNECT
}

interface ActedIn @relationshipProperties {
  role: String!
}

# The Edge of Insanity
type Movie @aggregation @writeonly {
  title: String! @filter(enabled: false)
  actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN, properties: "ActedIn", writeOperations: [CREATE, CONNECT, DISCONNECT, UPDATE, DELETE], aggregation: true) @filter(enabled: false)
  password: String! @private
}

extend type schema @aggregation
```
