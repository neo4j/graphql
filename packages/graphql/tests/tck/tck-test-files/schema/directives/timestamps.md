## Schema TimeStamps

Tests that the provided typeDefs return the correct schema.

---

### TimeStamp

**TypeDefs**

```typedefs-input
type Movie {
    id: ID
    createdAt: DateTime! @timestamp(operations: [CREATE])
    updatedAt: DateTime! @timestamp(operations: [UPDATE])
}
```

**Output**

```schema-output

"""A date and time, represented as an ISO-8601 string"""
scalar DateTime

type Movie {
  id: ID
  createdAt: DateTime!
  updatedAt: DateTime!
}

type DeleteInfo {
  nodesDeleted: Int!
  relationshipsDeleted: Int!
}

enum SortDirection {
  """Sort by field values in ascending order."""
  ASC
  """Sort by field values in descending order."""
  DESC
}

input MovieCreateInput {
  id: ID
}

input MovieOptions {
  """Specify one or more MovieSort objects to sort Movies by. The sorts will be applied in the order in which they are arranged in the array."""
sort: [MovieSort]
  limit: Int
  skip: Int
}

"""Fields to sort Movies by. The order in which sorts are applied is not guaranteed when specifying many fields in one MovieSort object."""
input MovieSort {
  id: SortDirection
  createdAt: SortDirection
  updatedAt: SortDirection
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
  id_MATCHES: String
  createdAt: DateTime
  createdAt_NOT: DateTime
  createdAt_IN: [DateTime]
  createdAt_NOT_IN: [DateTime]
  createdAt_LT: DateTime
  createdAt_LTE: DateTime
  createdAt_GT: DateTime
  createdAt_GTE: DateTime
  updatedAt: DateTime
  updatedAt_NOT: DateTime
  updatedAt_IN: [DateTime]
  updatedAt_NOT_IN: [DateTime]
  updatedAt_LT: DateTime
  updatedAt_LTE: DateTime
  updatedAt_GT: DateTime
  updatedAt_GTE: DateTime
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
  updateMovies(where: MovieWhere, update: MovieUpdateInput): UpdateMoviesMutationResponse!
}

type Query {
  movies(where: MovieWhere, options: MovieOptions): [Movie]!
}
```

---
