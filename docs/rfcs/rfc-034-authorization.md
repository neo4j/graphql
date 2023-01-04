# Authorization

## Problem

Authorization is currently bundled into the `@auth` directive, alongside authentication, as well as additional functionality such as `bind`. Combining these behaviours is often unclear.

## Solution

Break out authorization into its own directive. Authentication will be _implied_, and data validation (`bind`) will be specified in a different directive. This just leaves `allow` (which throws an error if a predicate cannot be validated) and `where` (which filters data based on a predicate).

```gql
directive @authorization(
  rules: [<Type varies based on type applied to>]
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

#### Throwing an error if a simple predicate cannot be validated

```gql
extend type User @authorization(rules: [{ where: { id: "$jwt.sub" } }])
```

Given the folowing query is executed:

```gql
{
  users {
    id
  }
}
```

If the `id` property of _any_ of the returned users is _not_ equal to the JWT subject, the complete query will throw an error.

#### Throwing an error if a predicate using JWT roles cannot be validated

User must have role "user":

```gql
extend type User @authorization(rules: [{ where: { roles_INCLUDES: "user" } }])

#### TODO: Better document what this use case is - more advanced

```gql
# Winner winner chicken dinner
type User @authorization(
    # rules combined with OR operator
    rules: [
      {
        operations: [UPDATE],
        where: {     # UserWhere
            OR: [
              {
                AND: [
                  { id: "$jwt.id" },
                  { admin: false }
                ]
              },
              { admin: true }
            ]
          }
      },
      {
        operations: [READ],
        where: {     # UserWhere
            admin: false
          }
      },
      {
        operations: [UPDATE, READ],
        where: {     # UserWhere
            superAdmin: true
          }
      },
    ]
) {
    id: ID!
    name: String!
    admin: Boolean!
}
```
