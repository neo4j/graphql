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
enum SortDirection {
  """Sort by field values in ascending order."""
  ASC
  """Sort by field values in descending order."""
  DESC
}

type Actor {
  name: String!
  movies(where: MovieWhere, options: MovieOptions): [Movie]
  moviesConnection(where: ActorMoviesConnectionWhere, options: ActorMoviesConnectionOptions): ActorMoviesConnection!
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
  title: String!
  actors(where: ActorWhere, options: ActorOptions): [Actor]!
  actorsConnection(where: MovieActorsConnectionWhere, options: MovieActorsConnectionOptions): MovieActorsConnection!
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
  title: String!
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
  actors: [ActorCreateInput!]
}

"""Fields to sort Movies by. The order in which sorts are applied is not guaranteed when specifying many fields in one MovieSort object."""
input MovieSort {
  title: SortDirection
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
  title: String
  actors: [MovieActorsUpdateFieldInput!]
}

input MovieWhere {
  OR: [MovieWhere!]
  AND: [MovieWhere!]
  title: String
  title_IN: [String]
  title_NOT: String
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

interface ActedIn {
  screenTime: Int!
}

input ActedInWhere {
  screenTime: Int
  screenTime_NOT: Int
  screenTime_LT: Int
  screenTime_LTE: Int
  screenTime_GT: Int
  screenTime_GTE: Int
  screenTime_IN: [Int]
  screenTime_NOT_IN: [Int]
  AND: [ActedInWhere!]
  OR: [ActedInWhere!]
}

input ActedInSort {
  screenTime: SortDirection
}

input ActorMoviesConnectionWhere {
  relationship: ActedInWhere
  relationship_NOT: ActedInWhere
  node: MovieWhere
  node_NOT: MovieWhere
  AND: [ActorMoviesConnectionWhere!]
  OR: [ActorMoviesConnectionWhere!]
}

input ActorMoviesConnectionSort {
  relationship: ActedInSort
  node: MovieSort
}

input ActorMoviesConnectionOptions {
  sort: [ActorMoviesConnectionSort!]
}

type ActorMoviesRelationship implements ActedIn {
  screenTime: Int!
  node: Movie!
}

type ActorMoviesConnection {
  edges: [ActorMoviesRelationship!]!
}

input MovieActorsConnectionWhere {
  relationship: ActedInWhere
  relationship_NOT: ActedInWhere
  node: ActorWhere
  node_NOT: ActorWhere
  AND: [MovieActorsConnectionWhere!]
  OR: [MovieActorsConnectionWhere!]
}

input MovieActorsConnectionSort {
  relationship: ActedInSort
  node: ActorSort
}

input MovieActorsConnectionOptions {
  sort: [MovieActorsConnectionSort!]
}

type MovieActorsRelationship implements ActedIn {
  screenTime: Int!
  node: Actor!
}

type MovieActorsConnection {
  edges: [MovieActorsRelationship!]!
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
