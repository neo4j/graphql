## Schema Custom Mutations

Tests that the provided typeDefs return the correct schema.

---

### Custom Mutations

**TypeDefs**

```typedefs-input
input ExampleInput {
    id: ID
}

type Movie {
    id: ID
}

type Query {
  testQuery(input: ExampleInput): String
  testCypherQuery(input: ExampleInput): String @cypher(statement: "")
}

type Mutation {
  testMutation(input: ExampleInput): String
  testCypherMutation(input: ExampleInput): String @cypher(statement: "")
}

type Subscription {
  testSubscription(input: ExampleInput): String
}
```

**Output**

```schema-output
input ExampleInput {
    id: ID
}

type Movie {
  id: ID
}

type DeleteInfo {
  nodesDeleted: Int!
  relationshipsDeleted: Int!
}

input MovieAND {
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
  id_REGEX: String
  OR: [MovieOR]
  AND: [MovieAND]
}

input MovieCreateInput {
  id: ID
}

input MovieOptions {
  sort: [MovieSort]
  limit: Int
  skip: Int
}

input MovieOR {
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
  id_REGEX: String
  OR: [MovieOR]
  AND: [MovieAND]
}

enum MovieSort {
  id_DESC
  id_ASC
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
  id_REGEX: String
  OR: [MovieOR]
  AND: [MovieAND]
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
  createMovies(input: [MovieCreateInput]!): CreateMoviesMutationResponse!
  deleteMovies(where: MovieWhere): DeleteInfo!
  updateMovies(where: MovieWhere, update: MovieUpdateInput): UpdateMoviesMutationResponse!
  testMutation(input: ExampleInput): String
  testCypherMutation(input: ExampleInput): String
}

type Query {
  Movies(where: MovieWhere, options: MovieOptions): [Movie]!
  testQuery(input: ExampleInput): String
  testCypherQuery(input: ExampleInput): String
}

type Subscription {
  testSubscription(input: ExampleInput): String
}
```

---
