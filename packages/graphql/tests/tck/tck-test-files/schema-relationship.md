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
  name_MATCHES: String
  OR: [ActorWhere!]
  AND: [ActorWhere!]
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
  connect: [ActorConnectFieldInput!]
  create: [ActorCreateInput!]
}

input MovieRelationInput {
  actors: [ActorCreateInput!]
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
  OR: [MovieWhere!]
  AND: [MovieWhere!]
  actors: ActorWhere
  actors_NOT: ActorWhere
  actors_IN: [ActorWhere!]
  actors_NOT_IN: [ActorWhere!]
}

input MovieUpdateInput {
  id: ID
  actors: [MovieActorsUpdateFieldInput!]
}

input ActorDeleteFieldInput {
  where: ActorWhere
}

input MovieActorsUpdateFieldInput {
  connect: [ActorConnectFieldInput!]
  create: [ActorCreateInput!]
  disconnect: [ActorDisconnectFieldInput!]
  update: ActorUpdateInput
  where: ActorWhere
  delete: [ActorDeleteFieldInput!]
}

input MovieConnectInput {
  actors: [ActorConnectFieldInput!]
}

input MovieDisconnectInput {
  actors: [ActorDisconnectFieldInput!]
}

input ActorUpdateInput {
  name: String
}

type CreateMoviesMutationResponse {
  movies: [Movie!]!
}

input MovieActorsDeleteInput {
  where: ActorWhere
}

input MovieDeleteInput {
  actors: [MovieActorsDeleteInput!]
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
  createMovies(input: [MovieCreateInput!]!): CreateMoviesMutationResponse!
  deleteMovies(
    where: MovieWhere
    delete: MovieDeleteInput
  ): DeleteInfo!
  deleteActors(where: ActorWhere): DeleteInfo!
  updateMovies(where: MovieWhere, update: MovieUpdateInput, connect: MovieConnectInput, disconnect: MovieDisconnectInput, create: MovieRelationInput, delete: MovieDeleteInput): UpdateMoviesMutationResponse!
  updateActors(where: ActorWhere, update: ActorUpdateInput): UpdateActorsMutationResponse!
}

type Query {
  actors(where: ActorWhere, options: ActorOptions): [Actor]!
  movies(where: MovieWhere, options: MovieOptions): [Movie]!
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

input ActorConnectFieldInput {
  where: ActorWhere
  connect: ActorConnectInput
}

input ActorConnectInput {
  movies: [MovieConnectFieldInput!]
}

input ActorCreateInput {
  name: String
  movies: ActorMoviesFieldInput
}

input ActorRelationInput {
  movies: [MovieCreateInput!]
}

input ActorDisconnectFieldInput {
  where: ActorWhere
  disconnect: ActorDisconnectInput
}

input ActorDisconnectInput {
  movies: [MovieDisconnectFieldInput!]
}

input ActorMoviesFieldInput {
  create: [MovieCreateInput!]
  connect: [MovieConnectFieldInput!]
}

input ActorMoviesUpdateFieldInput {
  where: MovieWhere
  update: MovieUpdateInput
  connect: [MovieConnectFieldInput!]
  create: [MovieCreateInput!]
  disconnect: [MovieDisconnectFieldInput!]
  delete: [MovieDeleteFieldInput!]
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
  movies: [ActorMoviesUpdateFieldInput!]
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
  movies: MovieWhere
  movies_NOT: MovieWhere
  movies_IN: [MovieWhere!]
  movies_NOT_IN: [MovieWhere!]
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
  create: [ActorCreateInput!]
  connect: [ActorConnectFieldInput!]
}

input MovieActorsUpdateFieldInput {
  where: ActorWhere
  update: ActorUpdateInput
  create: [ActorCreateInput!]
  connect: [ActorConnectFieldInput!]
  disconnect: [ActorDisconnectFieldInput!]
  delete: [ActorDeleteFieldInput!]
}

input MovieConnectFieldInput {
  where: MovieWhere
  connect: MovieConnectInput
}

input MovieConnectInput {
  actors: [ActorConnectFieldInput!]
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
  actors: [ActorDisconnectFieldInput!]
}

input MovieOptions {
  sort: [MovieSort]
  limit: Int
  skip: Int
}

input MovieRelationInput {
  actors: [ActorCreateInput!]
}

enum MovieSort {
  id_DESC
  id_ASC
}

input MovieActorsDeleteInput {
  where: ActorWhere
  delete: ActorDeleteInput
}

input ActorMoviesDeleteInput {
  where: MovieWhere
  delete: MovieDeleteInput
}

input MovieDeleteInput {
  actors: [MovieActorsDeleteInput!]
}

input MovieDeleteFieldInput {
  where: MovieWhere
  delete: MovieDeleteInput
}

input ActorDeleteInput {
  movies: [ActorMoviesDeleteInput!]
}

input ActorDeleteFieldInput {
  where: ActorWhere
  delete: ActorDeleteInput
}

input MovieUpdateInput {
  id: ID
  actors: [MovieActorsUpdateFieldInput!]
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
  actors: ActorWhere
  actors_NOT: ActorWhere
  actors_IN: [ActorWhere!]
  actors_NOT_IN: [ActorWhere!]
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
  deleteActors(
    where: ActorWhere
    delete: ActorDeleteInput
  ): DeleteInfo!
  updateActors(
    where: ActorWhere
    update: ActorUpdateInput
    connect: ActorConnectInput
    disconnect: ActorDisconnectInput
    create: ActorRelationInput
    delete: ActorDeleteInput
  ): UpdateActorsMutationResponse!
  createMovies(input: [MovieCreateInput!]!): CreateMoviesMutationResponse!
  deleteMovies(
    where: MovieWhere
    delete: MovieDeleteInput
  ): DeleteInfo!
  updateMovies(
    where: MovieWhere
    update: MovieUpdateInput
    connect: MovieConnectInput
    disconnect: MovieDisconnectInput
    create: MovieRelationInput
    delete: MovieDeleteInput
  ): UpdateMoviesMutationResponse!
}

type Query {
  actors(where: ActorWhere, options: ActorOptions): [Actor]!
  movies(where: MovieWhere, options: MovieOptions): [Movie]!
}
```

---
