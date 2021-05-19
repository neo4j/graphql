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
    actors: [Actor]! @relationship(type: "ACTED_IN", direction: IN)
}
```

**Output**

```schema-output
type Actor {
  name: String
}

input ActorConnectFieldInput {
  where: ActorWhere
}

input ActorCreateInput {
  name: String
}

input ActorDeleteFieldInput {
  where: ActorWhere
}

input ActorDisconnectFieldInput {
  where: ActorWhere
}

input ActorOptions {
  # Specify one or more ActorSort objects to sort Actors by. The sorts will be applied in the order in which they are arranged in the array.
  sort: [ActorSort]
  limit: Int
  skip: Int
}

# Fields to sort Actors by. The order in which sorts are applied is not guaranteed when specifying many fields in one ActorSort object.
input ActorSort {
  name: SortDirection
}

input ActorUpdateInput {
  name: String
}

input ActorWhere {
  OR: [ActorWhere!]
  AND: [ActorWhere!]
  name: String
  name_NOT: String
  name_IN: [String]
  name_NOT_IN: [String]
  name_CONTAINS: String
  name_NOT_CONTAINS: String
  name_STARTS_WITH: String
  name_NOT_STARTS_WITH: String
  name_ENDS_WITH: String
  name_NOT_ENDS_WITH: String
}

type CreateActorsMutationResponse {
  actors: [Actor!]!
}

type CreateMoviesMutationResponse {
  movies: [Movie!]!
}

type DeleteInfo {
  nodesDeleted: Int!
  relationshipsDeleted: Int!
}

type Movie {
  id: ID
  actors(where: ActorWhere, options: ActorOptions): [Actor]!
  actorsConnection(
    where: MovieActorsConnectionWhere
    options: MovieActorsConnectionOptions
  ): MovieActorsConnection!
}

type MovieActorsConnection {
  edges: [MovieActorsRelationship!]!
}

input MovieActorsConnectionOptions {
  sort: [MovieActorsConnectionSort!]
}

input MovieActorsConnectionSort {
  node: ActorSort
}

input MovieActorsConnectionWhere {
  AND: [MovieActorsConnectionWhere!]
  OR: [MovieActorsConnectionWhere!]
  node: ActorWhere
  node_NOT: ActorWhere
}

input MovieActorsCreateFieldInput {
  node: ActorCreateInput!
}

input MovieActorsDeleteFieldInput {
  where: ActorWhere
}

input MovieActorsFieldInput {
  create: [MovieActorsCreateFieldInput!]
  connect: [ActorConnectFieldInput!]
}

type MovieActorsRelationship {
  node: Actor!
}

input MovieActorsUpdateFieldInput {
  where: ActorWhere
  update: ActorUpdateInput
  connect: [ActorConnectFieldInput!]
  disconnect: [ActorDisconnectFieldInput!]
  create: [MovieActorsCreateFieldInput!]
  delete: [ActorDeleteFieldInput!]
}

input MovieConnectInput {
  actors: [ActorConnectFieldInput!]
}

input MovieCreateInput {
  id: ID
  actors: MovieActorsFieldInput
}

input MovieDeleteInput {
  actors: [MovieActorsDeleteFieldInput!]
}

input MovieDisconnectInput {
  actors: [ActorDisconnectFieldInput!]
}

input MovieOptions {
  # Specify one or more MovieSort objects to sort Movies by. The sorts will be applied in the order in which they are arranged in the array.
  sort: [MovieSort]
  limit: Int
  skip: Int
}

input MovieRelationInput {
  actors: [MovieActorsCreateFieldInput!]
}

# Fields to sort Movies by. The order in which sorts are applied is not guaranteed when specifying many fields in one MovieSort object.
input MovieSort {
  id: SortDirection
}

input MovieUpdateInput {
  id: ID
  actors: [MovieActorsUpdateFieldInput!]
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
  actors: ActorWhere
  actors_NOT: ActorWhere
}

type Mutation {
  createActors(input: [ActorCreateInput!]!): CreateActorsMutationResponse!
  deleteActors(where: ActorWhere): DeleteInfo!
  updateActors(
    where: ActorWhere
    update: ActorUpdateInput
  ): UpdateActorsMutationResponse!
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

type Query {
  actors(where: ActorWhere, options: ActorOptions): [Actor]!
  movies(where: MovieWhere, options: MovieOptions): [Movie]!
}

enum SortDirection {
  # Sort by field values in ascending order.
  ASC

  # Sort by field values in descending order.
  DESC
}

type UpdateActorsMutationResponse {
  actors: [Actor!]!
}

type UpdateMoviesMutationResponse {
  movies: [Movie!]!
}
```

---

### Multi Relationship

**TypeDefs**

```typedefs-input
type Actor {
    name: String
    movies: [Movie] @relationship(type: "ACTED_IN", direction: OUT)
}

type Movie {
    id: ID
    actors: [Actor]! @relationship(type: "ACTED_IN", direction: IN)
}
```

**Output**

```schema-output
input ActorMoviesCreateFieldInput {
  node: MovieCreateInput!
}

enum SortDirection {
  """Sort by field values in ascending order."""
  ASC
  """Sort by field values in descending order."""
  DESC
}

type Actor {
  name: String
  movies(where: MovieWhere, options: MovieOptions): [Movie]
  moviesConnection(options: ActorMoviesConnectionOptions, where: ActorMoviesConnectionWhere): ActorMoviesConnection!
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
  movies: [ActorMoviesCreateFieldInput!]
}

input MovieActorsCreateFieldInput {
  node: ActorCreateInput!
}

input ActorDisconnectFieldInput {
  where: ActorWhere
  disconnect: ActorDisconnectInput
}

input ActorDisconnectInput {
  movies: [MovieDisconnectFieldInput!]
}

type ActorMoviesRelationship {
  node: Movie!
}

type ActorMoviesConnection {
  edges: [ActorMoviesRelationship!]!
}

input ActorMoviesConnectionOptions {
  sort: [ActorMoviesConnectionSort!]
}

input ActorMoviesConnectionSort {
  node: MovieSort
}

input ActorMoviesConnectionWhere {
  AND: [ActorMoviesConnectionWhere!]
  OR: [ActorMoviesConnectionWhere!]
  node: MovieWhere
  node_NOT: MovieWhere
}

input ActorMoviesFieldInput {
  create: [ActorMoviesCreateFieldInput!]
  connect: [MovieConnectFieldInput!]
}

input ActorMoviesUpdateFieldInput {
  where: MovieWhere
  update: MovieUpdateInput
  connect: [MovieConnectFieldInput!]
  create: [ActorMoviesCreateFieldInput!]
  disconnect: [MovieDisconnectFieldInput!]
  delete: [MovieDeleteFieldInput!]
}

input ActorOptions {
  """Specify one or more ActorSort objects to sort Actors by. The sorts will be applied in the order in which they are arranged in the array."""
sort: [ActorSort]
  limit: Int
  skip: Int
}

"""Fields to sort Actors by. The order in which sorts are applied is not guaranteed when specifying many fields in one ActorSort object."""
input ActorSort {
  name: SortDirection
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
  movies: MovieWhere
  movies_NOT: MovieWhere
}

type DeleteInfo {
  nodesDeleted: Int!
  relationshipsDeleted: Int!
}

type Movie {
  id: ID
  actors(where: ActorWhere, options: ActorOptions): [Actor]!
  actorsConnection(options: MovieActorsConnectionOptions, where: MovieActorsConnectionWhere): MovieActorsConnection!
}

type MovieActorsRelationship {
  node: Actor!
}

type MovieActorsConnection {
  edges: [MovieActorsRelationship!]!
}

input MovieActorsConnectionOptions {
  sort: [MovieActorsConnectionSort!]
}

input MovieActorsConnectionSort {
  node: ActorSort
}

input MovieActorsConnectionWhere {
  AND: [MovieActorsConnectionWhere!]
  OR: [MovieActorsConnectionWhere!]
  node: ActorWhere
  node_NOT: ActorWhere
}

input MovieActorsFieldInput {
  create: [MovieActorsCreateFieldInput!]
  connect: [ActorConnectFieldInput!]
}

input MovieActorsUpdateFieldInput {
  where: ActorWhere
  update: ActorUpdateInput
  create: [MovieActorsCreateFieldInput!]
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
  """Specify one or more MovieSort objects to sort Movies by. The sorts will be applied in the order in which they are arranged in the array."""
sort: [MovieSort]
  limit: Int
  skip: Int
}

input MovieRelationInput {
  actors: [MovieActorsCreateFieldInput!]
}

"""Fields to sort Movies by. The order in which sorts are applied is not guaranteed when specifying many fields in one MovieSort object."""
input MovieSort {
  id: SortDirection
}

input MovieActorsDeleteFieldInput {
  where: ActorWhere
  delete: ActorDeleteInput
}

input ActorMoviesDeleteFieldInput {
  where: MovieWhere
  delete: MovieDeleteInput
}

input MovieDeleteInput {
  actors: [MovieActorsDeleteFieldInput!]
}

input MovieDeleteFieldInput {
  where: MovieWhere
  delete: MovieDeleteInput
}

input ActorDeleteInput {
  movies: [ActorMoviesDeleteFieldInput!]
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
  actors: ActorWhere
  actors_NOT: ActorWhere
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
