## Schema Relationship

Tests that the provided typeDefs return the correct schema (with relationships).

---

### Single Relationship

**TypeDefs**

```typedefs-input
type Actor {
    name: String
}

type Movie {
    id: ID
    actors: [Actor]! @relationship(type: "ACTED_IN", direction: "IN")
}
```

**Output**

```schema-output
type Actor {
  name: String
}

type DeleteInfo {
  nodesDeleted: Int!
  relationshipsDeleted: Int!
}

input ActorAND {
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
  OR: [ActorOR]
  AND: [ActorAND]
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
  OR: [ActorOR]
  AND: [ActorAND]
}

enum ActorSort {
  name_DESC
  name_ASC
}

input ActorWhere {
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
  OR: [ActorOR]
  AND: [ActorAND]
}

input ActorConnectFieldInput {
  where: ActorWhere
}

input ActorDisconnectFieldInput {
  where: ActorWhere
}

type Movie {
  id: ID
  actors(where: ActorWhere, options: ActorOptions): [Actor]!
}

input MovieActorsFieldInput {
  connect: [ActorConnectFieldInput]
  create: [ActorCreateInput]
}

input MovieRelationInput {
  actors: [ActorCreateInput]
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
  actors: ActorWhere
  actors_NOT: ActorWhere
  actors_IN: [ActorWhere]
  actors_NOT_IN: [ActorWhere]
}

input MovieCreateInput {
  id: ID
  actors: MovieActorsFieldInput
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
  actors: ActorWhere
  actors_NOT: ActorWhere
  actors_IN: [ActorWhere]
  actors_NOT_IN: [ActorWhere]
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
  actors: ActorWhere
  actors_NOT: ActorWhere
  actors_IN: [ActorWhere]
  actors_NOT_IN: [ActorWhere]
}

input MovieUpdateInput {
  id: ID
  actors: [MovieActorsUpdateFieldInput]
}

input MovieActorsUpdateFieldInput {
  connect: [ActorConnectFieldInput]
  create: [ActorCreateInput]
  disconnect: [ActorDisconnectFieldInput]
  update: ActorUpdateInput
  where: ActorWhere
}

input MovieConnectInput {
  actors: [ActorConnectFieldInput]
}

input MovieDisconnectInput {
  actors: [ActorDisconnectFieldInput]
}

input ActorUpdateInput {
  name: String
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
  createMovies(input: [MovieCreateInput]!): CreateMoviesMutationResponse!
  deleteMovies(where: MovieWhere): DeleteInfo!
  deleteActors(where: ActorWhere): DeleteInfo!
  updateMovies(where: MovieWhere, update: MovieUpdateInput, connect: MovieConnectInput, disconnect: MovieDisconnectInput, create: MovieRelationInput): UpdateMoviesMutationResponse!
  updateActors(where: ActorWhere, update: ActorUpdateInput): UpdateActorsMutationResponse!
}

type Query {
  Actors(where: ActorWhere, options: ActorOptions): [Actor]!
  Movies(where: MovieWhere, options: MovieOptions): [Movie]!
}
```

---

### Multi Relationship

**TypeDefs**

```typedefs-input
type Actor {
    name: String
    movies: [Movie] @relationship(type: "ACTED_IN", direction: "OUT")
}

type Movie {
    id: ID
    actors: [Actor]! @relationship(type: "ACTED_IN", direction: "IN")
}
```

**Output**

```schema-output
type Actor {
  name: String
  movies(where: MovieWhere, options: MovieOptions): [Movie]
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
  movies: MovieWhere
  movies_NOT: MovieWhere
  movies_IN: [MovieWhere]
  movies_NOT_IN: [MovieWhere]
}

input ActorConnectFieldInput {
  where: ActorWhere
  connect: ActorConnectInput
}

input ActorConnectInput {
  movies: [MovieConnectFieldInput]
}

input ActorCreateInput {
  name: String
  movies: ActorMoviesFieldInput
}

input ActorRelationInput {
  movies: [MovieCreateInput]
}

input ActorDisconnectFieldInput {
  where: ActorWhere
  disconnect: ActorDisconnectInput
}

input ActorDisconnectInput {
  movies: [MovieDisconnectFieldInput]
}

input ActorMoviesFieldInput {
  create: [MovieCreateInput]
  connect: [MovieConnectFieldInput]
}

input ActorMoviesUpdateFieldInput {
  where: MovieWhere
  update: MovieUpdateInput
  connect: [MovieConnectFieldInput]
  create: [MovieCreateInput]
  disconnect: [MovieDisconnectFieldInput]
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
  movies: MovieWhere
  movies_NOT: MovieWhere
  movies_IN: [MovieWhere]
  movies_NOT_IN: [MovieWhere]
}

enum ActorSort {
  name_DESC
  name_ASC
}

input ActorUpdateInput {
  name: String
  movies: [ActorMoviesUpdateFieldInput]
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
  movies: MovieWhere
  movies_NOT: MovieWhere
  movies_IN: [MovieWhere]
  movies_NOT_IN: [MovieWhere]
}

type DeleteInfo {
  nodesDeleted: Int!
  relationshipsDeleted: Int!
}

type Movie {
  id: ID
  actors(where: ActorWhere, options: ActorOptions): [Actor]!
}

input MovieActorsFieldInput {
  create: [ActorCreateInput]
  connect: [ActorConnectFieldInput]
}

input MovieActorsUpdateFieldInput {
  where: ActorWhere
  update: ActorUpdateInput
  create: [ActorCreateInput]
  connect: [ActorConnectFieldInput]
  disconnect: [ActorDisconnectFieldInput]
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
  actors: ActorWhere
  actors_NOT: ActorWhere
  actors_IN: [ActorWhere]
  actors_NOT_IN: [ActorWhere]
}

input MovieConnectFieldInput {
  where: MovieWhere
  connect: MovieConnectInput
}

input MovieConnectInput {
  actors: [ActorConnectFieldInput]
}

input MovieCreateInput {
  id: ID
  actors: MovieActorsFieldInput
}

input MovieDisconnectFieldInput {
  where: MovieWhere
  disconnect: MovieDisconnectInput
}

input MovieDisconnectInput {
  actors: [ActorDisconnectFieldInput]
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
  actors: ActorWhere
  actors_NOT: ActorWhere
  actors_IN: [ActorWhere]
  actors_NOT_IN: [ActorWhere]
}

input MovieRelationInput {
  actors: [ActorCreateInput]
}

enum MovieSort {
  id_DESC
  id_ASC
}

input MovieUpdateInput {
  id: ID
  actors: [MovieActorsUpdateFieldInput]
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
  actors: ActorWhere
  actors_NOT: ActorWhere
  actors_IN: [ActorWhere]
  actors_NOT_IN: [ActorWhere]
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
  updateActors(
    where: ActorWhere
    update: ActorUpdateInput
    connect: ActorConnectInput
    disconnect: ActorDisconnectInput
    create: ActorRelationInput
  ): UpdateActorsMutationResponse!
  createMovies(input: [MovieCreateInput]!): CreateMoviesMutationResponse!
  deleteMovies(where: MovieWhere): DeleteInfo!
  updateMovies(
    where: MovieWhere
    update: MovieUpdateInput
    connect: MovieConnectInput
    disconnect: MovieDisconnectInput
    create: MovieRelationInput
  ): UpdateMoviesMutationResponse!
}

type Query {
  Actors(where: ActorWhere, options: ActorOptions): [Actor]!
  Movies(where: MovieWhere, options: MovieOptions): [Movie]!
}
```

---
