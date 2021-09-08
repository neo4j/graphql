# Schema -> Aggregations

---

## Aggregations

### TypeDefs

```graphql
type Movie {
    id: ID
    title: String
    createdAt: DateTime
    imdbRating: Float
    someInt: Int
    someBigInt: BigInt
}
```

### Output

```graphql
type Query {
    movies(where: MovieWhere, options: MovieOptions): [Movie!]!
    moviesCount(where: MovieWhere): Int!
    moviesAggregate(where: MovieWhere): MovieAggregateSelection!
}

type Mutation {
    createMovies(input: [MovieCreateInput!]!): CreateMoviesMutationResponse!
    deleteMovies(where: MovieWhere): DeleteInfo!
    updateMovies(
        where: MovieWhere
        update: MovieUpdateInput
    ): UpdateMoviesMutationResponse!
}

"""
A date and time, represented as an ISO-8601 string
"""
scalar DateTime

"""
A BigInt value up to 64 bits in size, which can be a number or a string if used inline, or a string only if used as a variable. Always returned as a string.
"""
scalar BigInt

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

type CreateInfo {
    bookmark: String
    nodesCreated: Int!
    relationshipsCreated: Int!
}

type DateTimeAggregationSelection {
    max: DateTime!
    min: DateTime!
}

type FloatAggregationSelection {
    average: Float!
    max: Float!
    min: Float!
}

type IntAggregationSelection {
    average: Float!
    max: Int!
    min: Int!
}

type StringAggregationSelection {
    shortest: String!
    longest: String!
}

type BigIntAggregationSelection {
    average: Float!
    max: BigInt!
    min: BigInt!
}

type IDAggregationSelection {
    shortest: ID!
    longest: ID!
}

type MovieAggregateSelection {
    count: Int!
    createdAt: DateTimeAggregationSelection!
    id: IDAggregationSelection!
    imdbRating: FloatAggregationSelection!
    someBigInt: BigIntAggregationSelection!
    someInt: IntAggregationSelection!
    title: StringAggregationSelection!
}

type CreateMoviesMutationResponse {
    info: CreateInfo!
    movies: [Movie!]!
}

type DeleteInfo {
    bookmark: String
    nodesDeleted: Int!
    relationshipsDeleted: Int!
}

type UpdateInfo {
    bookmark: String
    nodesCreated: Int!
    nodesDeleted: Int!
    relationshipsCreated: Int!
    relationshipsDeleted: Int!
}

type Movie {
    id: ID
    title: String
    imdbRating: Float
    someInt: Int
    someBigInt: BigInt
    createdAt: DateTime
}

type UpdateMoviesMutationResponse {
    info: UpdateInfo!
    movies: [Movie!]!
}

input MovieCreateInput {
    id: ID
    title: String
    imdbRating: Float
    someInt: Int
    someBigInt: BigInt
    createdAt: DateTime
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
    title: SortDirection
    imdbRating: SortDirection
    someInt: SortDirection
    someBigInt: SortDirection
    createdAt: SortDirection
}

input MovieUpdateInput {
    id: ID
    title: String
    imdbRating: Float
    someInt: Int
    someBigInt: BigInt
    createdAt: DateTime
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
    title: String
    title_NOT: String
    title_IN: [String]
    title_NOT_IN: [String]
    title_CONTAINS: String
    title_NOT_CONTAINS: String
    title_STARTS_WITH: String
    title_NOT_STARTS_WITH: String
    title_ENDS_WITH: String
    title_NOT_ENDS_WITH: String
    imdbRating: Float
    imdbRating_NOT: Float
    imdbRating_IN: [Float]
    imdbRating_NOT_IN: [Float]
    imdbRating_LT: Float
    imdbRating_LTE: Float
    imdbRating_GT: Float
    imdbRating_GTE: Float
    someInt: Int
    someInt_NOT: Int
    someInt_IN: [Int]
    someInt_NOT_IN: [Int]
    someInt_LT: Int
    someInt_LTE: Int
    someInt_GT: Int
    someInt_GTE: Int
    someBigInt: BigInt
    someBigInt_NOT: BigInt
    someBigInt_IN: [BigInt]
    someBigInt_NOT_IN: [BigInt]
    someBigInt_LT: BigInt
    someBigInt_LTE: BigInt
    someBigInt_GT: BigInt
    someBigInt_GTE: BigInt
    createdAt: DateTime
    createdAt_NOT: DateTime
    createdAt_IN: [DateTime]
    createdAt_NOT_IN: [DateTime]
    createdAt_LT: DateTime
    createdAt_LTE: DateTime
    createdAt_GT: DateTime
    createdAt_GTE: DateTime
}
```

---
