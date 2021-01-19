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
type Actor {
  name: String
}

input ActorAND {
  OR: [ActorOR]
  AND: [ActorAND]
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
  name_REGEX: String
}

input ActorCreateInput {
  name: String
}

input ActorOptions {
  sort: [ActorSort]
  limit: Int
  skip: Int
}

input ActorOR {
  OR: [ActorOR]
  AND: [ActorAND]
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
  name_REGEX: String
}

enum ActorSort {
  name_DESC
  name_ASC
}

input ActorUpdateInput {
  name: String
}

input ActorWhere {
  OR: [ActorOR]
  AND: [ActorAND]
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
  name_REGEX: String
}

type DeleteInfo {
  nodesDeleted: Int!
  relationshipsDeleted: Int!
}

type Movie {
  id: ID
  actors(title: String): [Actor]
}

input MovieAND {
  OR: [MovieOR]
  AND: [MovieAND]
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
  OR: [MovieOR]
  AND: [MovieAND]
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
}

enum MovieSort {
  id_DESC
  id_ASC
}

input MovieUpdateInput {
  id: ID
}

input MovieWhere {
  OR: [MovieOR]
  AND: [MovieAND]
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
  createActors(input: [ActorCreateInput]!): CreateActorsMutationResponse!
  deleteActors(where: ActorWhere): DeleteInfo!
  updateActors(where: ActorWhere, update: ActorUpdateInput): UpdateActorsMutationResponse!
  createMovies(input: [MovieCreateInput]!): CreateMoviesMutationResponse!
  deleteMovies(where: MovieWhere): DeleteInfo!
  updateMovies(where: MovieWhere, update: MovieUpdateInput): UpdateMoviesMutationResponse!
}

type Query {
  actors(where: ActorWhere, options: ActorOptions): [Actor]!
  movies(where: MovieWhere, options: MovieOptions): [Movie]!
}
```

---
