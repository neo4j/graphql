# Schema Inputs

Tests that the provided typeDefs return the correct schema.

---

## Inputs

### TypeDefs

```graphql
input NodeInput {
    id: ID
}

type Movie {
    id: ID
}

type Query {
    name(input: NodeInput): String
}
```

### Output

```graphql
type CreateInfo {
    bookmark: String!
}

type UpdateInfo {
    bookmark: String!
}

input NodeInput {
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
    info: CreateInfo!
    movies: [Movie!]!
}

type UpdateMoviesMutationResponse {
    info: UpdateInfo!
    movies: [Movie!]!
}

type Mutation {
    createMovies(input: [MovieCreateInput!]!): CreateMoviesMutationResponse!
    deleteMovies(where: MovieWhere): DeleteInfo!
    updateMovies(
        where: MovieWhere
        update: MovieUpdateInput
    ): UpdateMoviesMutationResponse!
}

type Query {
    movies(where: MovieWhere, options: MovieOptions): [Movie!]!
    moviesCount(where: MovieWhere): Int!
    name(input: NodeInput): String
}
```

---
