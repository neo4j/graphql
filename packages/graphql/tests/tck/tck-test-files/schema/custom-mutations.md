# Schema Custom Mutations

Tests that the provided typeDefs return the correct schema.

---

## Custom Mutations

### TypeDefs

```graphql
input ExampleInput {
    id: ID
}

type Movie {
    id: ID
}

type Query {
    testQuery(input: ExampleInput): String
    testCypherQuery(input: ExampleInput): String @cypher(statement: "")
}

type Mutation {
    testMutation(input: ExampleInput): String
    testCypherMutation(input: ExampleInput): String @cypher(statement: "")
}

type Subscription {
    testSubscription(input: ExampleInput): String
}
```

### Output

```graphql
input ExampleInput {
    id: ID
}

type Movie {
    id: ID
}

type DeleteInfo {
    nodesDeleted: Int!
    relationshipsDeleted: Int!
}

enum SortDirection {
    """
    Sort by field values in ascending order.
    """
    ASC
    """
    Sort by field values in descending order.
    """
    DESC
}

input MovieCreateInput {
    id: ID
}

input MovieOptions {
    """
    Specify one or more MovieSort objects to sort Movies by. The sorts will be applied in the order in which they are arranged in the array.
    """
    sort: [MovieSort]
    limit: Int
    offset: Int
}

"""
Fields to sort Movies by. The order in which sorts are applied is not guaranteed when specifying many fields in one MovieSort object.
"""
input MovieSort {
    id: SortDirection
}

input MovieWhere {
    id: ID
    id_IN: [ID]
    id_NOT: ID
    id_NOT_IN: [ID]
    id_CONTAINS: ID
    id_NOT_CONTAINS: ID
    id_STARTS_WITH: ID
    id_NOT_STARTS_WITH: ID
    id_ENDS_WITH: ID
    id_NOT_ENDS_WITH: ID
    OR: [MovieWhere!]
    AND: [MovieWhere!]
}

input MovieUpdateInput {
    id: ID
}

type CreateMoviesMutationResponse {
    movies: [Movie!]!
}

type UpdateMoviesMutationResponse {
    movies: [Movie!]!
}

type Mutation {
    createMovies(input: [MovieCreateInput!]!): CreateMoviesMutationResponse!
    deleteMovies(where: MovieWhere): DeleteInfo!
    updateMovies(
        where: MovieWhere
        update: MovieUpdateInput
    ): UpdateMoviesMutationResponse!
    testMutation(input: ExampleInput): String
    testCypherMutation(input: ExampleInput): String
}

type Query {
    movies(where: MovieWhere, options: MovieOptions): [Movie!]!
    countMovies(where: MovieWhere): Int!
    testQuery(input: ExampleInput): String
    testCypherQuery(input: ExampleInput): String
}

type Subscription {
    testSubscription(input: ExampleInput): String
}
```

---
