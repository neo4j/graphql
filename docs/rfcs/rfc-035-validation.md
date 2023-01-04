# Validation

## Problem

The current `@auth` directive has a `bind` argument that checks data following operations and ensures that it meets certain criteria. It will throw an error and rollback the transaction if it does not. The `bind` argument causes a lot of confusion about its use, and it should be made into a standalone feature.

## Solution

The introduction of a new directive for data validation.

```gql
enum ValidationHook {
  PRE
  POST
}

directive @validation(
  hooks: [ValidationHook!]! = [POST]
  operations: [Operation!]! = [READ, CREATE, UPDATE, DELETE]
  expect: Where
) on OBJECT | FIELD_DEFINITION | SCHEMA | INTERFACE
```

### Use cases

All examples use the following base type definitions:

```gql
type User {
  id: ID!
  active: Boolean!
}

type Post {
  content: String!
  author: User! @relationship(type: "WROTE", direction: IN)
}
```

#### Following a Mutation, check that a property still matches a JWT value

```gql
extend type User @validation(expect: { id: "$jwt.sub" })
```

This will ensure that a user cannot change their ID to masquerade as another user.
