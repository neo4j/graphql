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

input MovieCreateInput {
  status: Status
}

input MovieOptions {
  sort: [MovieSort]
  limit: Int
  skip: Int
}

enum MovieSort {
  status_DESC
  status_ASC
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
  createMovies(input: [MovieCreateInput]!): CreateMoviesMutationResponse!
  deleteMovies(where: MovieWhere): DeleteInfo!
  updateMovies(where: MovieWhere, update: MovieUpdateInput): UpdateMoviesMutationResponse!
}

type Query {
  movies(where: MovieWhere, options: MovieOptions): [Movie]!
}
```

---
