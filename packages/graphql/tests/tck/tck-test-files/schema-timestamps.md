## Schema TimeStamps

Tests that the provided typeDefs return the correct schema.

---

### TimeStamp

**TypeDefs**

```typedefs-input
type Movie {
    id: ID
    createdAt: DateTime! @autogenerate(operations: ["create"])
    updatedAt: DateTime! @autogenerate(operations: ["update"])
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

"""A date and time, represented as an ISO-8601 string"""
scalar DateTime

type Movie {
  id: ID
  createdAt: DateTime!
  updatedAt: DateTime!
}

type DeleteInfo {
  nodesDeleted: Int!
  relationshipsDeleted: Int!
}

input MovieCreateInput {
  id: ID
}

input MovieOptions {
  sort: [MovieSort]
  limit: Int
  skip: Int
}

enum MovieSort {
  id_DESC
  id_ASC
  createdAt_ASC
  createdAt_DESC
  updatedAt_ASC
  updatedAt_DESC
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
  createdAt: DateTime
  createdAt_NOT: DateTime
  createdAt_IN: [DateTime]
  createdAt_NOT_IN: [DateTime]
  createdAt_LT: DateTime
  createdAt_LTE: DateTime
  createdAt_GT: DateTime
  createdAt_GTE: DateTime
  updatedAt: DateTime
  updatedAt_NOT: DateTime
  updatedAt_IN: [DateTime]
  updatedAt_NOT_IN: [DateTime]
  updatedAt_LT: DateTime
  updatedAt_LTE: DateTime
  updatedAt_GT: DateTime
  updatedAt_GTE: DateTime
  OR: [MovieWhere!]
  AND: [MovieWhere!]
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
  createMovies(input: [MovieCreateInput!]!): CreateMoviesMutationResponse!
  deleteMovies(where: MovieWhere): DeleteInfo!
  updateMovies(where: MovieWhere, update: MovieUpdateInput): UpdateMoviesMutationResponse!
}

type Query {
  movies(where: MovieWhere, options: MovieOptions): [Movie]!
}
```

---
