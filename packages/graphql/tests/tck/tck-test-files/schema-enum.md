## Schema Enums

Tests that the provided typeDefs return the correct schema(with enums).

---

### Enums

**TypeDefs**

```typedefs-input
enum Status {
  ACTIVE
  INACTIVE
  PENDING
}

type Movie {
  status: Status
}
```

**Output**

```schema-output

enum Status {
  ACTIVE
  INACTIVE
  PENDING
}

type Movie {
  status: Status
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
  status: Status
}

input MovieOptions {
  """Specify one or more MovieSort objects to sort Movies by. The sorts will be applied in the order in which they are arranged in the array."""
sort: [MovieSort]
  limit: Int
  skip: Int
}

"""Fields to sort Movies by. The order in which sorts are applied is not guaranteed when specifying many fields in one MovieSort object."""
input MovieSort {
  status: SortDirection
}

input MovieWhere {
  status: Status
  status_IN: [Status]
  status_NOT: Status
  status_NOT_IN: [Status]
  OR: [MovieWhere!]
  AND: [MovieWhere!]
}

input MovieUpdateInput {
  status: Status
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
