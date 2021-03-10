## Schema Cypher Directive

Tests that the provided typeDefs return the correct schema (with cypher directives).

---

### Custom Directive Simple

**TypeDefs**

```typedefs-input
type Actor {
  name: String
}

type Movie {
    id: ID
    actors(title: String): [Actor] @cypher(statement: """
      MATCH (a:Actor {title: $title})
      RETURN a
      LIMIT 1
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

type Actor {
  name: String
}

input ActorCreateInput {
  name: String
}

input ActorOptions {
  sort: [ActorSort]
  limit: Int
  skip: Int
}

enum ActorSort {
  name_DESC
  name_ASC
}

input ActorUpdateInput {
  name: String
}

input ActorWhere {
  OR: [ActorWhere!]
  AND: [ActorWhere!]
  name: String
  name_IN: [String]
  name_NOT: String
  name_NOT_IN: [String]
  name_CONTAINS: String
  name_NOT_CONTAINS: String
  name_STARTS_WITH: String
  name_NOT_STARTS_WITH: String
  name_ENDS_WITH: String
  name_NOT_ENDS_WITH: String
  name_MATCHES: String
}

type DeleteInfo {
  nodesDeleted: Int!
  relationshipsDeleted: Int!
}

type Movie {
  id: ID
  actors(title: String): [Actor]
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
}

input MovieUpdateInput {
  id: ID
}

input MovieWhere {
  OR: [MovieWhere!]
  AND: [MovieWhere!]
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
}

type CreateMoviesMutationResponse {
  movies: [Movie!]!
}

type UpdateMoviesMutationResponse {
  movies: [Movie!]!
}

type CreateActorsMutationResponse {
  actors: [Actor!]!
}

type UpdateActorsMutationResponse {
  actors: [Actor!]!
}

type Mutation {
  createActors(input: [ActorCreateInput!]!): CreateActorsMutationResponse!
  deleteActors(where: ActorWhere): DeleteInfo!
  updateActors(where: ActorWhere, update: ActorUpdateInput): UpdateActorsMutationResponse!
  createMovies(input: [MovieCreateInput!]!): CreateMoviesMutationResponse!
  deleteMovies(where: MovieWhere): DeleteInfo!
  updateMovies(where: MovieWhere, update: MovieUpdateInput): UpdateMoviesMutationResponse!
}

type Query {
  actors(where: ActorWhere, options: ActorOptions): [Actor]!
  movies(where: MovieWhere, options: MovieOptions): [Movie]!
}
```

---
