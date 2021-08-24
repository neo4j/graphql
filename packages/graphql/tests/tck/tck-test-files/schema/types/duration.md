# Schema Duration

Tests that the provided typeDefs return the correct schema.

---

## Duration

### TypeDefs

```graphql
type Movie {
    id: ID
    duration: Duration
}
```

### Output

```graphql
"""
A duration, represented as an ISO 8601 duration string allowing for basic date time format
"""
scalar Duration

type Movie {
    id: ID
    duration: Duration
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
    duration: Duration
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
    duration: SortDirection
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
    duration: Duration
    duration_IN: [Duration]
    duration_NOT: Duration
    duration_NOT_IN: [Duration]
    OR: [MovieWhere!]
    AND: [MovieWhere!]
}

input MovieUpdateInput {
    id: ID
    duration: Duration
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
}

type Query {
    movies(where: MovieWhere, options: MovieOptions): [Movie!]!
    moviesCount(where: MovieWhere): Int!
}
```

---
