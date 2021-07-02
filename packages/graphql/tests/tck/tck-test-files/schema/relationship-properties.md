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

input ActedInSort {
  screenTime: SortDirection
}

input ActedInUpdateInput {
  screenTime: Int
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
  moviesConnection(where: ActorMoviesConnectionWhere, options: ActorMoviesConnectionOptions): ActorMoviesConnection!
}

input ActorConnectInput {
  movies: [ActorMoviesConnectFieldInput!]
}

input ActorCreateInput {
  name: String!
  movies: ActorMoviesFieldInput
}

input ActorDeleteInput {
  movies: [ActorMoviesDeleteFieldInput!]
}

input ActorMoviesDeleteFieldInput {
  delete: MovieDeleteInput
  where: ActorMoviesConnectionWhere
}

input ActorMoviesDisconnectFieldInput {
  disconnect: MovieDisconnectInput
  where: ActorMoviesConnectionWhere
}

input ActorDisconnectInput {
  movies: [ActorMoviesDisconnectFieldInput!]
}

input MovieConnectWhere {
  node: MovieWhere!
}

input ActorMoviesConnectFieldInput {
  where: MovieConnectWhere
  connect: [MovieConnectInput!]
  properties: ActedInCreateInput!
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

input ActorMoviesFieldInput {
  create: [ActorMoviesCreateFieldInput!]
  connect: [ActorMoviesConnectFieldInput!]
}

type ActorMoviesRelationship implements ActedIn {
  node: Movie!
  screenTime: Int!
}

input ActorMoviesUpdateFieldInput {
  properties: ActedInUpdateInput
  where: ActorMoviesConnectionWhere
  update: MovieUpdateInput
  connect: [ActorMoviesConnectFieldInput!]
  disconnect: [ActorMoviesDisconnectFieldInput!]
  create: [ActorMoviesCreateFieldInput!]
  delete: [ActorMoviesDeleteFieldInput!]
}

input ActorOptions {
  """
  Specify one or more ActorSort objects to sort Actors by. The sorts will be applied in the order in which they are arranged in the array.
  """
  sort: [ActorSort]
  limit: Int
  skip: Int
}

input ActorRelationInput {
  movies: [ActorMoviesCreateFieldInput!]
}

"""
Fields to sort Actors by. The order in which sorts are applied is not guaranteed when specifying many fields in one ActorSort object.
"""
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

input ActorConnectWhere {
  node: ActorWhere!
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
  actorsConnection(where: MovieActorsConnectionWhere, options: MovieActorsConnectionOptions): MovieActorsConnection!
}

input MovieActorsConnectFieldInput {
  where: ActorConnectWhere
  connect: [ActorConnectInput!]
  properties: ActedInCreateInput!
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

input MovieActorsFieldInput {
  create: [MovieActorsCreateFieldInput!]
  connect: [MovieActorsConnectFieldInput!]
}

type MovieActorsRelationship implements ActedIn {
  node: Actor!
  screenTime: Int!
}

input MovieActorsUpdateFieldInput {
  properties: ActedInUpdateInput
  where: MovieActorsConnectionWhere
  update: ActorUpdateInput
  connect: [MovieActorsConnectFieldInput!]
  disconnect: [MovieActorsDisconnectFieldInput!]
  create: [MovieActorsCreateFieldInput!]
  delete: [MovieActorsDeleteFieldInput!]
}

input MovieConnectInput {
  actors: [MovieActorsConnectFieldInput!]
}

input MovieCreateInput {
  title: String!
  actors: MovieActorsFieldInput
}

input MovieDeleteInput {
  actors: [MovieActorsDeleteFieldInput!]
}

input MovieActorsDeleteFieldInput {
  delete: ActorDeleteInput
  where: MovieActorsConnectionWhere
}

input MovieActorsDisconnectFieldInput {
  disconnect: ActorDisconnectInput
  where: MovieActorsConnectionWhere
}

input MovieDisconnectInput {
  actors: [MovieActorsDisconnectFieldInput!]
}

input MovieOptions {
  """
  Specify one or more MovieSort objects to sort Movies by. The sorts will be applied in the order in which they are arranged in the array.
  """
  sort: [MovieSort]
  limit: Int
  skip: Int
}

input MovieRelationInput {
  actors: [MovieActorsCreateFieldInput!]
}

"""
Fields to sort Movies by. The order in which sorts are applied is not guaranteed when specifying many fields in one MovieSort object.
"""
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
  updateActors(where: ActorWhere, update: ActorUpdateInput, connect: ActorConnectInput, disconnect: ActorDisconnectInput, create: ActorRelationInput, delete: ActorDeleteInput): UpdateActorsMutationResponse!
  createMovies(input: [MovieCreateInput!]!): CreateMoviesMutationResponse!
  deleteMovies(where: MovieWhere, delete: MovieDeleteInput): DeleteInfo!
  updateMovies(where: MovieWhere, update: MovieUpdateInput, connect: MovieConnectInput, disconnect: MovieDisconnectInput, create: MovieRelationInput, delete: MovieDeleteInput): UpdateMoviesMutationResponse!
}

type Query {
  actors(where: ActorWhere, options: ActorOptions): [Actor!]!
  movies(where: MovieWhere, options: MovieOptions): [Movie!]!
}

enum SortDirection {
  """Sort by field values in ascending order."""
  ASC

  """Sort by field values in descending order."""
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
