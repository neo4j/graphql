## Schema Scalars

Tests that the provided typeDefs return the correct schema(with scalars).

---

### Scalars

**TypeDefs**

```typedefs-input
scalar CustomScalar

type Movie {
  id: ID
  myCustomScalar: CustomScalar
}
```

**Output**

```schema-output
scalar CustomScalar

type Movie {
  id: ID
  myCustomScalar: CustomScalar
}

type DeleteInfo {
  nodesDeleted: Int!
  relationshipsDeleted: Int!
}

input MovieCreateInput {
  id: ID
  myCustomScalar: CustomScalar
}

input MovieOptions {
  sort: [MovieSort]
  limit: Int
  skip: Int
}

enum MovieSort {
  id_DESC
  id_ASC
  myCustomScalar_DESC
  myCustomScalar_ASC
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
  myCustomScalar: CustomScalar
  OR: [MovieWhere]
  AND: [MovieWhere]
}

input MovieUpdateInput {
  id: ID
  myCustomScalar: CustomScalar
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
