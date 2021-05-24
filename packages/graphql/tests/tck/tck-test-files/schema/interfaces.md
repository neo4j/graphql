## Schema Interfaces

Tests that the provided typeDefs return the correct schema.

---

### Interfaces

**TypeDefs**

```typedefs-input
interface Node @auth(rules: [{allow: "*", operations: [READ]}]) {
    id: ID
    movies: [Movie] @relationship(type: "HAS_MOVIE", direction: OUT)
    customQuery: [Movie] @cypher(statement: """
      MATCH (m:Movie)
      RETURN m
    """)
}

type Movie implements Node @auth(rules: [{allow: "*", operations: [READ]}]) {
    id: ID
    nodes: [Node]
    movies: [Movie] @relationship(type: "HAS_MOVIE", direction: OUT)
    customQuery: [Movie] @cypher(statement: """
      MATCH (m:Movie)
      RETURN m
    """)
}
```

**Output**

```schema-output
type CreateMoviesMutationResponse {
  movies: [Movie!]!
}

type DeleteInfo {
  nodesDeleted: Int!
  relationshipsDeleted: Int!
}

type Movie implements Node {
  id: ID
  customQuery: [Movie]
  nodes: [Node]
  movies(where: MovieWhere, options: MovieOptions): [Movie]
  moviesConnection(
    where: MovieMoviesConnectionWhere
    options: MovieMoviesConnectionOptions
  ): MovieMoviesConnection!
}

input MovieConnectFieldInput {
  where: MovieWhere
  connect: MovieConnectInput
}

input MovieConnectInput {
  movies: [MovieConnectFieldInput!]
}

input MovieCreateInput {
  id: ID
  movies: MovieMoviesFieldInput
}

input MovieDeleteFieldInput {
  where: MovieWhere
  delete: MovieDeleteInput
}

input MovieDeleteInput {
  movies: [MovieMoviesDeleteFieldInput!]
}

input MovieDisconnectFieldInput {
  where: MovieWhere
  disconnect: MovieDisconnectInput
}

input MovieDisconnectInput {
  movies: [MovieDisconnectFieldInput!]
}

type MovieMoviesConnection {
  edges: [MovieMoviesRelationship!]!
}

input MovieMoviesConnectionOptions {
  sort: [MovieMoviesConnectionSort!]
}

input MovieMoviesConnectionSort {
  node: MovieSort
}

input MovieMoviesConnectionWhere {
  AND: [MovieMoviesConnectionWhere!]
  OR: [MovieMoviesConnectionWhere!]
  node: MovieWhere
  node_NOT: MovieWhere
}

input MovieMoviesCreateFieldInput {
  node: MovieCreateInput!
}

input MovieMoviesDeleteFieldInput {
  where: MovieWhere
  delete: MovieDeleteInput
}

input MovieMoviesFieldInput {
  create: [MovieMoviesCreateFieldInput!]
  connect: [MovieConnectFieldInput!]
}

type MovieMoviesRelationship {
  node: Movie!
}

input MovieMoviesUpdateFieldInput {
  where: MovieMoviesConnectionWhere
  update: MovieUpdateInput
  connect: [MovieConnectFieldInput!]
  disconnect: [MovieDisconnectFieldInput!]
  create: [MovieMoviesCreateFieldInput!]
  delete: [MovieDeleteFieldInput!]
}

input MovieOptions {
  # Specify one or more MovieSort objects to sort Movies by. The sorts will be applied in the order in which they are arranged in the array.
  sort: [MovieSort]
  limit: Int
  skip: Int
}

input MovieRelationInput {
  movies: [MovieMoviesCreateFieldInput!]
}

# Fields to sort Movies by. The order in which sorts are applied is not guaranteed when specifying many fields in one MovieSort object.
input MovieSort {
  id: SortDirection
}

input MovieUpdateInput {
  id: ID
  movies: [MovieMoviesUpdateFieldInput!]
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
  movies: MovieWhere
  movies_NOT: MovieWhere
}

type Mutation {
  createMovies(input: [MovieCreateInput!]!): CreateMoviesMutationResponse!
  deleteMovies(where: MovieWhere, delete: MovieDeleteInput): DeleteInfo!
  updateMovies(
    where: MovieWhere
    update: MovieUpdateInput
    connect: MovieConnectInput
    disconnect: MovieDisconnectInput
    create: MovieRelationInput
    delete: MovieDeleteInput
  ): UpdateMoviesMutationResponse!
}

interface Node {
  movies: [Movie]
  id: ID
  customQuery: [Movie]
}

type Query {
  movies(where: MovieWhere, options: MovieOptions): [Movie]!
}

enum SortDirection {
  # Sort by field values in ascending order.
  ASC

  # Sort by field values in descending order.
  DESC
}

type UpdateMoviesMutationResponse {
  movies: [Movie!]!
}
```

---
