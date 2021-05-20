## Schema Relationship Properties

Tests that the provided typeDefs return the correct schema (with relationships).

---

### Relationship Properties

**TypeDefs**

```typedefs-input
type Actor {
    name: String!
    movies: [Movie] @relationship(type: "ACTED_IN", direction: OUT, properties: "ActedIn")
}

type Movie {
    title: String!
    actors: [Actor]! @relationship(type: "ACTED_IN", direction: IN, properties: "ActedIn")
}

interface ActedIn {
    screenTime: Int!
}
```

**Output**

```schema-output
interface ActedIn {
  screenTime: Int!
}

input ActedInCreateInput {
  screenTime: Int!
}

input ActedInUpdateInput {
  screenTime: Int
}

input ActedInSort {
  screenTime: SortDirection
}

input ActedInWhere {
  OR: [ActedInWhere!]
  AND: [ActedInWhere!]
  screenTime: Int
  screenTime_NOT: Int
  screenTime_IN: [Int]
  screenTime_NOT_IN: [Int]
  screenTime_LT: Int
  screenTime_LTE: Int
  screenTime_GT: Int
  screenTime_GTE: Int
}

type Actor {
  name: String!
  movies(where: MovieWhere, options: MovieOptions): [Movie]
  moviesConnection(
    where: ActorMoviesConnectionWhere
    options: ActorMoviesConnectionOptions
  ): ActorMoviesConnection!
}

input ActorConnectFieldInput {
  where: ActorWhere
  connect: ActorConnectInput
}

input ActorConnectInput {
  movies: [MovieConnectFieldInput!]
}

input ActorCreateInput {
  name: String!
  movies: ActorMoviesFieldInput
}

input ActorDeleteFieldInput {
  where: ActorWhere
  delete: ActorDeleteInput
}

input ActorDeleteInput {
  movies: [ActorMoviesDeleteFieldInput!]
}

input ActorDisconnectFieldInput {
  where: ActorWhere
  disconnect: ActorDisconnectInput
}

input ActorDisconnectInput {
  movies: [MovieDisconnectFieldInput!]
}

type ActorMoviesConnection {
  edges: [ActorMoviesRelationship!]!
}

input ActorMoviesConnectionOptions {
  sort: [ActorMoviesConnectionSort!]
}

input ActorMoviesConnectionSort {
  node: MovieSort
  relationship: ActedInSort
}

input ActorMoviesConnectionWhere {
  AND: [ActorMoviesConnectionWhere!]
  OR: [ActorMoviesConnectionWhere!]
  relationship: ActedInWhere
  relationship_NOT: ActedInWhere
  node: MovieWhere
  node_NOT: MovieWhere
}

input ActorMoviesCreateFieldInput {
  node: MovieCreateInput!
  properties: ActedInCreateInput!
}

input ActorMoviesDeleteFieldInput {
  where: MovieWhere
  delete: MovieDeleteInput
}

input ActorMoviesFieldInput {
  create: [ActorMoviesCreateFieldInput!]
  connect: [MovieConnectFieldInput!]
}

type ActorMoviesRelationship implements ActedIn {
  node: Movie!
  screenTime: Int!
}

input ActorMoviesUpdateFieldInput {
  properties: ActedInUpdateInput
  where: ActorMoviesConnectionWhere
  update: MovieUpdateInput
  connect: [MovieConnectFieldInput!]
  disconnect: [MovieDisconnectFieldInput!]
  create: [ActorMoviesCreateFieldInput!]
  delete: [MovieDeleteFieldInput!]
}

input ActorOptions {
  # Specify one or more ActorSort objects to sort Actors by. The sorts will be applied in the order in which they are arranged in the array.
  sort: [ActorSort]
  limit: Int
  skip: Int
}

input ActorRelationInput {
  movies: [ActorMoviesCreateFieldInput!]
}

# Fields to sort Actors by. The order in which sorts are applied is not guaranteed when specifying many fields in one ActorSort object.
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
  name_NOT: String
  name_IN: [String]
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
  title: String!
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
  relationship: ActedInSort
}

input MovieActorsConnectionWhere {
  AND: [MovieActorsConnectionWhere!]
  OR: [MovieActorsConnectionWhere!]
  relationship: ActedInWhere
  relationship_NOT: ActedInWhere
  node: ActorWhere
  node_NOT: ActorWhere
}

input MovieActorsCreateFieldInput {
  node: ActorCreateInput!
  properties: ActedInCreateInput!
}

input MovieActorsDeleteFieldInput {
  where: ActorWhere
  delete: ActorDeleteInput
}

input MovieActorsFieldInput {
  create: [MovieActorsCreateFieldInput!]
  connect: [ActorConnectFieldInput!]
}

type MovieActorsRelationship implements ActedIn {
  node: Actor!
  screenTime: Int!
}

input MovieActorsUpdateFieldInput {
  properties: ActedInUpdateInput
  where: MovieActorsConnectionWhere
  update: ActorUpdateInput
  connect: [ActorConnectFieldInput!]
  disconnect: [ActorDisconnectFieldInput!]
  create: [MovieActorsCreateFieldInput!]
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
  title: String!
  actors: MovieActorsFieldInput
}

input MovieDeleteFieldInput {
  where: MovieWhere
  delete: MovieDeleteInput
}

input MovieDeleteInput {
  actors: [MovieActorsDeleteFieldInput!]
}

input MovieDisconnectFieldInput {
  where: MovieWhere
  disconnect: MovieDisconnectInput
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
  title: SortDirection
}

input MovieUpdateInput {
  title: String
  actors: [MovieActorsUpdateFieldInput!]
}

input MovieWhere {
  OR: [MovieWhere!]
  AND: [MovieWhere!]
  title: String
  title_NOT: String
  title_IN: [String]
  title_NOT_IN: [String]
  title_CONTAINS: String
  title_NOT_CONTAINS: String
  title_STARTS_WITH: String
  title_NOT_STARTS_WITH: String
  title_ENDS_WITH: String
  title_NOT_ENDS_WITH: String
  actors: ActorWhere
  actors_NOT: ActorWhere
}

type Mutation {
  createActors(input: [ActorCreateInput!]!): CreateActorsMutationResponse!
  deleteActors(where: ActorWhere, delete: ActorDeleteInput): DeleteInfo!
  updateActors(
    where: ActorWhere
    update: ActorUpdateInput
    connect: ActorConnectInput
    disconnect: ActorDisconnectInput
    create: ActorRelationInput
    delete: ActorDeleteInput
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
