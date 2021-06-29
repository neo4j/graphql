## Schema Interfaces

Tests that the provided typeDefs return the correct schema.

---

### Interfaces

**TypeDefs**

```typedefs-input
interface MovieNode @auth(rules: [{allow: "*", operations: [READ]}]) {
    id: ID
    movies: [Movie] @relationship(type: "HAS_MOVIE", direction: OUT)
    customQuery: [Movie] @cypher(statement: """
      MATCH (m:Movie)
      RETURN m
    """)
}

type Movie implements MovieNode @auth(rules: [{allow: "*", operations: [READ]}]) {
    id: ID
    nodes: [MovieNode]
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

type Movie implements MovieNode {
  id: ID
  customQuery: [Movie]
  nodes: [MovieNode]
  movies(where: MovieWhere, options: MovieOptions): [Movie]
  moviesConnection(
    where: MovieMoviesConnectionWhere,
    options: MovieMoviesConnectionOptions
  ): MovieMoviesConnection!
}

input MovieConnectInput {
  movies: [MovieMoviesConnectFieldInput!]
}

input MovieCreateInput {
  id: ID
  movies: MovieMoviesFieldInput
}

input MovieDeleteInput {
  movies: [MovieMoviesDeleteFieldInput!]
}

input MovieDisconnectInput {
  movies: [MovieMoviesDisconnectFieldInput!]
}

input MovieMoviesDeleteFieldInput {
  delete: MovieDeleteInput
  where: MovieMoviesConnectionWhere
}

input MovieMoviesDisconnectFieldInput {
  disconnect: MovieDisconnectInput
  where: MovieMoviesConnectionWhere
}

input MovieMoviesConnectFieldInput {
  where: MovieWhere
  connect: [MovieConnectInput!]
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

input MovieMoviesFieldInput {
  create: [MovieMoviesCreateFieldInput!]
  connect: [MovieMoviesConnectFieldInput!]
}

type MovieMoviesRelationship {
  node: Movie!
}

input MovieMoviesUpdateFieldInput {
  where: MovieMoviesConnectionWhere
  update: MovieUpdateInput
  connect: [MovieMoviesConnectFieldInput!]
  disconnect: [MovieMoviesDisconnectFieldInput!]
  create: [MovieMoviesCreateFieldInput!]
  delete: [MovieMoviesDeleteFieldInput!]
}

input MovieOptions {
  """
  Specify one or more MovieSort objects to sort Movies by. The sorts will be applied in the order in which they are arranged in the array.
  """
  sort: [MovieSort]
  limit: Int
  skip: Int
}

input MovieRelationInput {
  movies: [MovieMoviesCreateFieldInput!]
}

"""
Fields to sort Movies by. The order in which sorts are applied is not guaranteed when specifying many fields in one MovieSort object.
"""
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
  updateMovies(where: MovieWhere, update: MovieUpdateInput, connect: MovieConnectInput, disconnect: MovieDisconnectInput, create: MovieRelationInput, delete: MovieDeleteInput): UpdateMoviesMutationResponse!
}

interface MovieNode {
  movies: [Movie]
  id: ID
  customQuery: [Movie]
}

"""Globally-identifiable node (Relay)"""
interface Node {
    id: ID!
}

type Query {
  movies(where: MovieWhere, options: MovieOptions): [Movie!]!
  node(id: ID!): Node!
}

enum SortDirection {
  """Sort by field values in ascending order."""
  ASC

  """Sort by field values in descending order."""
  DESC
}

type UpdateMoviesMutationResponse {
  movies: [Movie!]!
}
```

---
