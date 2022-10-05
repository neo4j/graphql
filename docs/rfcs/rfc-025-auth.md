# Auth 2.0

## Authentication

Authentication is used to check whether the client has provided a valid JWT signed by the configured secret.

This is configured either globally for the entire API, or on a per-type basis through directives.

Compared to the current implementation, authentication will be broken out into its own simplified directive for when
you just want to check the authenticaton status of a user before letting them access data. The definition will be as follows:

```gql
directive @authentication(
    operations: [Operation!]! = [READ, CREATE, UPDATE, DELETE, AGGREGATIONS...]
) on OBJECT | FIELD_DEFINITION
```

To enable authentication for anything to do with the `Movie` type, you would do the following:

```gql
type Movie @authentication {
    title: String!
}
```

To require authentication for only `CREATE` operations, you would do the following:

```gql
type Actor @authentication(operations: [CREATE]) {
    title: String!
}
```

### Future work

#### Disable authentication for a type

When global authentication has been enabled, the `@authentication` directive should be usable to disable the
need for authentication for specific types. The directive definition will be as follows:

```gql
directive @authentication(
    enabled: Boolean! = true
    operations: [Operation!]! = [READ, CREATE, UPDATE, DELETE, AGGREGATIONS...]
) on OBJECT | FIELD_DEFINITION
```

To disable authentication for, say, the `Movie` type, you would apply the directive as follows:

```gql
type Movie @authentication(enabled: false) {
    title: String!
}
```

#### Authentication status calculated in API layer

Presently, the authentication status of a user is calculated with the Cypher query which goes to the database.

This isn't as secure as it should be, so we should calculate this in the API layer before going to the database.

## Authorization

The first thing to note that the need for authorization against a type _implies_ the need for authentication.
You _do not_ need to combine `@authentication` with the authorization solution.

The existing implementation 

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
