## Schema Interfaces

Tests that the provided typeDefs return the correct schema.

---

### Interfaces

**TypeDefs**

```typedefs-input
interface Node @auth(rules: [{allow: "*", operations: ["read"]}]) {
    id: ID
    movies: [Movie] @relationship(type: "HAS_MOVIE", direction: "OUT")
    customQuery: [Movie] @cypher(statement: """
      MATCH (m:Movie)
      RETURN m
    """)
}

type Movie implements Node @auth(rules: [{allow: "*", operations: ["read"]}]) {
    id: ID
    nodes: [Node]
    movies: [Movie] @relationship(type: "HAS_MOVIE", direction: "OUT")
    customQuery: [Movie] @cypher(statement: """
      MATCH (m:Movie)
      RETURN m
    """)
}
```

**Output**

```schema-output
interface Node {
    id: ID
    movies: [Movie]
    customQuery: [Movie]
}

type Movie implements Node {
  id: ID
  nodes: [Node]
  movies(options: MovieOptions, where: MovieWhere): [Movie]
  customQuery: [Movie]
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
  movies: MovieWhere
  movies_IN: [MovieWhere]
  movies_NOT: MovieWhere
  movies_NOT_IN: [MovieWhere]
  OR: [MovieOR]
  AND: [MovieAND]
}

input MovieCreateInput {
  id: ID
  movies: MovieMoviesFieldInput
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
  movies: MovieWhere
  movies_IN: [MovieWhere]
  movies_NOT: MovieWhere
  movies_NOT_IN: [MovieWhere]
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
  movies: MovieWhere
  movies_IN: [MovieWhere]
  movies_NOT: MovieWhere
  movies_NOT_IN: [MovieWhere]
  OR: [MovieOR]
  AND: [MovieAND]
}

input MovieDisconnectFieldInput {
  disconnect: MovieDisconnectInput
  where: MovieWhere
}

input MovieDisconnectInput {
  movies: [MovieDisconnectFieldInput]
}

input MovieMoviesFieldInput {
  connect: [MovieConnectFieldInput]
  create: [MovieCreateInput]
}

input MovieMoviesUpdateFieldInput {
  connect: [MovieConnectFieldInput]
  create: [MovieCreateInput]
  disconnect: [MovieDisconnectFieldInput]
  update: MovieUpdateInput
  where: MovieWhere
}

input MovieRelationInput {
  movies: [MovieCreateInput]
}

input MovieConnectFieldInput {
  connect: MovieConnectInput
  where: MovieWhere
}

input MovieConnectInput {
  movies: [MovieConnectFieldInput]
}

input MovieUpdateInput {
  id: ID
  movies: [MovieMoviesUpdateFieldInput]
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
  updateMovies(where: MovieWhere, update: MovieUpdateInput, connect: MovieConnectInput, create: MovieRelationInput, disconnect: MovieDisconnectInput): UpdateMoviesMutationResponse!
}

type Query {
  movies(where: MovieWhere, options: MovieOptions): [Movie]!
}
```

---
