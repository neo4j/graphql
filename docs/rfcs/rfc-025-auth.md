# Auth

## Features

### Overarching

Operation based logic - if a create operation is happening, check relevant rules.

### Authentication

Authentication is used to check whether the client has provided a valid JWT signed by the configured secret.

### Authorization

Authorization _implies_ authentication.

In principal, rules can be combined with no user knowledge of where the rules are being evaluated.

Two use cases:

* _Before_ allowing access, check that values match
* _After_ modification, check that values still match

#### Literal values

Content can also be checked for static values.

Executed as close to the beginning of the request as possible (JavaScript runtime, before Cypher).

This could also include a roles field in the JWT, which is assessed using a `CONTAINS` filter.

#### Property values

Dynamically comparing node property values against:

* Values within a valid JWT
* Literal values
* Values within the GraphQL context

Executed with knowledge of data (within Cypher for Query/Mutation, on data return for Subscriptions).

Also works against related nodes.

## Use cases

### Authentication only on a type

```gql
type Movie @authentication {
    title: String!
}

type Actor @authentication(operations: [CREATE]) {
    title: String!
}

directive @authentication(
    enabled: Boolean! = true
    operations: [Operation!]! = [READ, CREATE, UPDATE, DELETE, AGGREGATIONS...]
) on OBJECT | FIELD_DEFINITION
```

### Authorization of a property value against a JWT value

```gql


type User @authorization(rules: [{operations: [UPDATE], where: {id: "$jwt.id"}}]) {
    id: ID!
}

```

### TODO: Combining authorization rules with OR

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

Pieces of work:

* Remove `CREATE`, it's not valid for authorization, only outbound validation

### TODO: Combining authorization rules with AND

Multiple directives, future work, but limited use cases:

* Where a field must always have a certain value?
* Blocklist functionality? `rule: BLOCK`?
