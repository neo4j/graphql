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
"""Instructs @neo4j/graphql to run the specified Cypher statement in order to resolve the value of the field to which the directive is applied."""
directive @cypher(
  """The Cypher statement to run which returns a value of the same type composition as the field definition on which the directive is applied."""
  statement: String!
) on FIELD_DEFINITION
"""Instructs @neo4j/graphql to completely ignore a field definition, assuming that it will be fully accounted for by custom resolvers."""
directive @ignore on FIELD_DEFINITION
"""Instructs @neo4j/graphql to only expose a field through the Neo4j GraphQL OGM."""
directive @private on FIELD_DEFINITION
"""Instructs @neo4j/graphql to exclude a field from the generated input types for the object type within which the directive is applied."""
directive @readonly on FIELD_DEFINITION
"""Instructs @neo4j/graphql to only include a field in the generated input types for the object type within which the directive is applied, but exclude it from the object type itself."""
directive @writeonly on FIELD_DEFINITION

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

input MovieCreateInput {
  id: ID
  movies: MovieMoviesFieldInput
}

input MovieOptions {
  sort: [MovieSort]
  limit: Int
  skip: Int
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
  id_MATCHES: String
  movies: MovieWhere
  movies_IN: [MovieWhere!]
  movies_NOT: MovieWhere
  movies_NOT_IN: [MovieWhere!]
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

input MovieMoviesDeleteInput {
  where: MovieWhere
  delete: MovieDeleteInput
}

input MovieDeleteInput {
  movies: [MovieMoviesDeleteInput!]
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
