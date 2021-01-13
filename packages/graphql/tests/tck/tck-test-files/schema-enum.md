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

input MovieAND {
  status: String
  status_IN: [String]
  status_NOT: String
  status_NOT_IN: [String]
  status_CONTAINS: String
  status_NOT_CONTAINS: String
  status_STARTS_WITH: String
  status_NOT_STARTS_WITH: String
  status_ENDS_WITH: String
  status_NOT_ENDS_WITH: String
  status_REGEX: String
  OR: [MovieOR]
  AND: [MovieAND]
}

input MovieCreateInput {
  status: Status
}

input MovieOptions {
  sort: [MovieSort]
  limit: Int
  skip: Int
}

input MovieOR {
  status: String
  status_IN: [String]
  status_NOT: String
  status_NOT_IN: [String]
  status_CONTAINS: String
  status_NOT_CONTAINS: String
  status_STARTS_WITH: String
  status_NOT_STARTS_WITH: String
  status_ENDS_WITH: String
  status_NOT_ENDS_WITH: String
  status_REGEX: String
  OR: [MovieOR]
  AND: [MovieAND]
}

enum MovieSort {
  status_DESC
  status_ASC
}

input MovieWhere {
  status: String
  status_IN: [String]
  status_NOT: String
  status_NOT_IN: [String]
  status_CONTAINS: String
  status_NOT_CONTAINS: String
  status_STARTS_WITH: String
  status_NOT_STARTS_WITH: String
  status_ENDS_WITH: String
  status_NOT_ENDS_WITH: String
  status_REGEX: String
  OR: [MovieOR]
  AND: [MovieAND]
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
  Movies(where: MovieWhere, options: MovieOptions): [Movie]!
}
```

---
