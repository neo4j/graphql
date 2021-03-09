## Schema DateTime

Tests that the provided typeDefs return the correct schema.

---

### DateTime

**TypeDefs**

```typedefs-input
type Movie {
    id: ID
    datetime: DateTime
}
```

**Output**

```schema-output
"""A date and time, represented as an ISO-8601 string"""
scalar DateTime

type Movie {
  id: ID
  datetime: DateTime
}

type DeleteInfo {
  nodesDeleted: Int!
  relationshipsDeleted: Int!
}


input MovieCreateInput {
  id: ID
  datetime: DateTime
}

input MovieOptions {
  sort: [MovieSort]
  limit: Int
  skip: Int
}

enum MovieSort {
  id_DESC
  id_ASC
  datetime_DESC
  datetime_ASC
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
  datetime: DateTime
  datetime_NOT: DateTime
  datetime_IN: [DateTime]
  datetime_NOT_IN: [DateTime]
  datetime_LT: DateTime
  datetime_LTE: DateTime
  datetime_GT: DateTime
  datetime_GTE: DateTime
  OR: [MovieWhere!]
  AND: [MovieWhere!]
}

input MovieUpdateInput {
  id: ID
  datetime: DateTime
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
