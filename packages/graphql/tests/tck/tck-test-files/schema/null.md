# Schema Null

Tests that the not null of types are preserved

---

## Simple

### TypeDefs

```graphql
type Movie {
    id: ID!
    ids: [ID!]!
    name: String!
    names: [String!]!
    actorCount: Int!
    actorCounts: [Int!]!
    averageRating: Float!
    averageRatings: [Float!]!
    isActives: [Boolean!]!
    filmedAt: Point!
    filmedAts: [Point!]!
    createdAt: DateTime!
    createdAts: [DateTime!]!
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

type CreateMoviesMutationResponse {
    info: CreateInfo!
    movies: [Movie!]!
}

"""
A date and time, represented as an ISO-8601 string
"""
scalar DateTime

type DeleteInfo {
    nodesDeleted: Int!
    relationshipsDeleted: Int!
}

type Movie {
    id: ID!
    ids: [ID!]!
    name: String!
    names: [String!]!
    actorCount: Int!
    actorCounts: [Int!]!
    averageRating: Float!
    averageRatings: [Float!]!
    isActives: [Boolean!]!
    createdAt: DateTime!
    createdAts: [DateTime!]!
    filmedAt: Point!
    filmedAts: [Point!]!
}

input MovieCreateInput {
    id: ID!
    ids: [ID!]!
    name: String!
    names: [String!]!
    actorCount: Int!
    actorCounts: [Int!]!
    averageRating: Float!
    averageRatings: [Float!]!
    isActives: [Boolean!]!
    createdAt: DateTime!
    createdAts: [DateTime!]!
    filmedAt: PointInput!
    filmedAts: [PointInput!]!
}

input MovieOptions {
    """
    Specify one or more MovieSort objects to sort Movies by. The sorts will be applied in the order in which they are arranged in the array.
    """
    sort: [MovieSort]
    limit: Int
    offset: Int
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

"""
Fields to sort Movies by. The order in which sorts are applied is not guaranteed when specifying many fields in one MovieSort object.
"""
input MovieSort {
    actorCount: SortDirection
    averageRating: SortDirection
    createdAt: SortDirection
    filmedAt: SortDirection
    id: SortDirection
    name: SortDirection
}

input MovieUpdateInput {
    id: ID
    ids: [ID!]
    name: String
    names: [String!]
    actorCount: Int
    actorCounts: [Int!]
    averageRating: Float
    averageRatings: [Float!]
    isActives: [Boolean!]
    createdAt: DateTime
    createdAts: [DateTime!]
    filmedAt: PointInput
    filmedAts: [PointInput!]
}

input MovieWhere {
    OR: [MovieWhere!]
    AND: [MovieWhere!]
    id: ID
    id_NOT: ID
    id_IN: [ID]
    id_NOT_IN: [ID]
    id_CONTAINS: ID
    id_NOT_CONTAINS: ID
    id_STARTS_WITH: ID
    id_NOT_STARTS_WITH: ID
    id_ENDS_WITH: ID
    id_NOT_ENDS_WITH: ID
    ids: [ID!]
    ids_INCLUDES: ID
    ids_NOT: [ID!]
    ids_NOT_INCLUDES: ID
    name: String
    name_CONTAINS: String
    name_ENDS_WITH: String
    name_IN: [String]
    name_NOT: String
    name_NOT_CONTAINS: String
    name_NOT_ENDS_WITH: String
    name_NOT_IN: [String]
    name_NOT_STARTS_WITH: String
    name_STARTS_WITH: String
    names: [String!]
    names_INCLUDES: String
    names_NOT: [String!]
    names_NOT_INCLUDES: String
    actorCount: Int
    actorCount_NOT: Int
    actorCount_IN: [Int]
    actorCount_NOT_IN: [Int]
    actorCount_LT: Int
    actorCount_LTE: Int
    actorCount_GT: Int
    actorCount_GTE: Int
    actorCounts: [Int!]
    actorCounts_INCLUDES: Int
    actorCounts_NOT: [Int!]
    actorCounts_NOT_INCLUDES: Int
    averageRating: Float
    averageRating_NOT: Float
    averageRating_IN: [Float]
    averageRating_NOT_IN: [Float]
    averageRating_LT: Float
    averageRating_LTE: Float
    averageRating_GT: Float
    averageRating_GTE: Float
    averageRatings: [Float!]
    averageRatings_INCLUDES: Float
    averageRatings_NOT: [Float!]
    averageRatings_NOT_INCLUDES: Float
    isActives: [Boolean!]
    isActives_NOT: [Boolean!]
    createdAt: DateTime
    createdAt_NOT: DateTime
    createdAt_IN: [DateTime]
    createdAt_NOT_IN: [DateTime]
    createdAt_LT: DateTime
    createdAt_LTE: DateTime
    createdAt_GT: DateTime
    createdAt_GTE: DateTime
    createdAts: [DateTime!]
    createdAts_INCLUDES: DateTime
    createdAts_NOT: [DateTime!]
    createdAts_NOT_INCLUDES: DateTime
    filmedAt: PointInput
    filmedAt_NOT: PointInput
    filmedAt_IN: [PointInput]
    filmedAt_NOT_IN: [PointInput]
    filmedAt_DISTANCE: PointDistance
    filmedAt_LT: PointDistance
    filmedAt_LTE: PointDistance
    filmedAt_GT: PointDistance
    filmedAt_GTE: PointDistance
    filmedAts: [PointInput!]
    filmedAts_INCLUDES: PointInput
    filmedAts_NOT: [PointInput!]
    filmedAts_NOT_INCLUDES: PointInput
}

type Mutation {
    createMovies(input: [MovieCreateInput!]!): CreateMoviesMutationResponse!
    deleteMovies(where: MovieWhere): DeleteInfo!
    updateMovies(
        where: MovieWhere
        update: MovieUpdateInput
    ): UpdateMoviesMutationResponse!
}

type Point {
    longitude: Float!
    latitude: Float!
    height: Float
    crs: String!
    srid: Int!
}

input PointDistance {
    point: PointInput!
    """
    The distance in metres to be used when comparing two points
    """
    distance: Float!
}

input PointInput {
    longitude: Float!
    latitude: Float!
    height: Float
}

type Query {
    movies(where: MovieWhere, options: MovieOptions): [Movie!]!
    moviesCount(where: MovieWhere): Int!
}

type UpdateMoviesMutationResponse {
    info: UpdateInfo!
    movies: [Movie!]!
}
```

---
