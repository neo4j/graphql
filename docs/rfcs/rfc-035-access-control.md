# Banana

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
