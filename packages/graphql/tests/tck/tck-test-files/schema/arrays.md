# Schema Arrays

Tests that the provided typeDefs return the correct schema.

---

## Arrays

### TypeDefs

```graphql
type Movie {
    id: ID!
    ratings: [Float!]!
    averageRating: Float!
}
```

### Output

```graphql
type CreateInfo {
    bookmark: String
    nodesCreated: Int!
    relationshipsCreated: Int!
}

type UpdateInfo {
    bookmark: String
    nodesCreated: Int!
    nodesDeleted: Int!
    relationshipsCreated: Int!
    relationshipsDeleted: Int!
}

type Movie {
    id: ID!
    ratings: [Float!]!
    averageRating: Float!
}

type DeleteInfo {
    bookmark: String
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
    id: ID!
    ratings: [Float!]!
    averageRating: Float!
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
    averageRating: SortDirection
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
    ratings: [Float!]
    ratings_INCLUDES: Float
    ratings_NOT: [Float!]
    ratings_NOT_INCLUDES: Float
    averageRating: Float
    averageRating_IN: [Float]
    averageRating_NOT: Float
    averageRating_NOT_IN: [Float]
    averageRating_LT: Float
    averageRating_LTE: Float
    averageRating_GT: Float
    averageRating_GTE: Float
    OR: [MovieWhere!]
    AND: [MovieWhere!]
}

input MovieUpdateInput {
    id: ID
    ratings: [Float!]
    averageRating: Float
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
}
```

---
