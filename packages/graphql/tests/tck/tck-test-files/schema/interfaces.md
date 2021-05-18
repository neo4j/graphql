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
enum SortDirection {
  """Sort by field values in ascending order."""
  ASC
  """Sort by field values in descending order."""
  DESC
}

interface Node {
    id: ID
    movies: [Movie]
    customQuery: [Movie]
}

type Movie implements Node {
  id: ID
  nodes: [Node]
  movies(options: MovieOptions, where: MovieWhere): [Movie]
  moviesConnection(options: MovieMoviesConnectionOptions, where: MovieMoviesConnectionWhere): MovieMoviesConnection!
  customQuery: [Movie]
}

type MovieMoviesRelationship {
  node: Movie!
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

type DeleteInfo {
  nodesDeleted: Int!
  relationshipsDeleted: Int!
}

input MovieCreateInput {
  id: ID
  movies: MovieMoviesFieldInput
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
  movies: MovieWhere
  movies_NOT: MovieWhere
  OR: [MovieWhere!]
  AND: [MovieWhere!]
}

input MovieDisconnectFieldInput {
  disconnect: MovieDisconnectInput
  where: MovieWhere
}

input MovieDisconnectInput {
  movies: [MovieDisconnectFieldInput!]
}

input MovieMoviesFieldInput {
  connect: [MovieConnectFieldInput!]
  create: [MovieCreateInput!]
}

input MovieDeleteFieldInput {
  delete: MovieDeleteInput
  where: MovieWhere
}

input MovieMoviesUpdateFieldInput {
  connect: [MovieConnectFieldInput!]
  create: [MovieCreateInput!]
  disconnect: [MovieDisconnectFieldInput!]
  update: MovieUpdateInput
  where: MovieWhere
  delete: [MovieDeleteFieldInput!]
}

input MovieRelationInput {
  movies: [MovieCreateInput!]
}

input MovieConnectFieldInput {
  connect: MovieConnectInput
  where: MovieWhere
}

input MovieConnectInput {
  movies: [MovieConnectFieldInput!]
}

input MovieUpdateInput {
  id: ID
  movies: [MovieMoviesUpdateFieldInput!]
}

input MovieMoviesDeleteFieldInput {
  where: MovieWhere
  delete: MovieDeleteInput
}

input MovieDeleteInput {
  movies: [MovieMoviesDeleteFieldInput!]
}

type CreateMoviesMutationResponse {
  movies: [Movie!]!
}

type UpdateMoviesMutationResponse {
  movies: [Movie!]!
}

type Mutation {
  createMovies(input: [MovieCreateInput!]!): CreateMoviesMutationResponse!
  deleteMovies(where: MovieWhere, delete: MovieDeleteInput): DeleteInfo!
  updateMovies(
    where: MovieWhere
    update: MovieUpdateInput
    connect: MovieConnectInput
    create: MovieRelationInput
    disconnect: MovieDisconnectInput
    delete: MovieDeleteInput
  ): UpdateMoviesMutationResponse!
}

type Query {
  movies(where: MovieWhere, options: MovieOptions): [Movie]!
}
```

---
