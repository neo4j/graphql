# Schema

This an appendix to the [RFC for Relay implementation](relay.md). It is the full schema which would be output for the example type definitions, which is too large to be included in the main RFC document.

```graphql
interface Node {
    id: ID!
}

type Actor implements Node {
    id: ID!
    name: String!
    movies: [Movie!]!
    moviesConnection(first: Int, after: String): ActorMoviesConnection!
}

type Movie implements Node {
    id: ID!
    title: String!
    actors: [Actor!]!
    actorsConnection(first: Int, after: String): MovieActorsConnection!
}

interface ActedIn {
    screenTime: Int!
}

type ActorMovieRelationship implements ActedIn {
    cursor: String!
    node: Movie!
    screenTime: Int!
}

type MovieActorRelationship implements ActedIn {
    cursor: String!
    node: Actor!
    screenTime: Int!
}

type PageInfo {
    hasNextPage: Boolean!
    hasPreviousPage: Boolean!
    startCursor: String
    endCursor: String
}

type ActorMoviesConnection {
    edges: [ActorMovieRelationship!]!
    pageInfo: PageInfo!
}

type MovieActorsConnection {
    edges: [MovieActorRelationship!]!
    pageInfo: PageInfo!
}

input ActorWhere {
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
    actors: ActorWhere
    actors_NOT: ActorWhere
    actors_IN: [ActorWhere!]
    actors_NOT_IN: [ActorWhere!]
}

enum ActorSort {
    id_DESC
    id_ASC
    name_DESC
    name_ASC
}

input ActorOptions {
    sort: [ActorSort]
    limit: Int
    skip: Int
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
    title_MATCHES: String
    OR: [MovieWhere!]
    AND: [MovieWhere!]
    actors: ActorWhere
    actors_NOT: ActorWhere
    actors_IN: [ActorWhere!]
    actors_NOT_IN: [ActorWhere!]
}

enum MovieSort {
    id_DESC
    id_ASC
    title_DESC
    title_ASC
}

input MovieOptions {
    sort: [MovieSort]
    limit: Int
    skip: Int
}

input ActorMoviesDeleteInput {
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

input ActorDisconnectFieldInput {
    where: ActorWhere
    disconnect: ActorDisconnectInput
}

input ActorDisconnectInput {
    movies: [MovieDisconnectFieldInput!]
}

input MovieActorsDeleteInput {
    where: ActorWhere
    delete: ActorDeleteInput
}

input MovieDeleteInput {
    actors: [MovieActorsDeleteInput!]
}

input MovieDeleteFieldInput {
    where: MovieWhere
    delete: MovieDeleteInput
}

input MovieDisconnectFieldInput {
    where: MovieWhere
    disconnect: MovieDisconnectInput
}

input MovieDisconnectInput {
    actors: [ActorDisconnectFieldInput!]
}

input ActedInCreateInput {
    screenTime: Int!
}

input ActedInUpdateInput {
    screenTime: Int
}

input ActorCreateInput {
    id: ID!
    name: String
    movies: ActorMoviesFieldInput
}

input ActorMovieCreateInput {
    properties: ActedInCreateInput!
    node: MovieCreateInput!
}

input ActorMoviesFieldInput {
    create: [ActorMovieCreateInput!]
    connect: [MovieConnectFieldInput!]
}

input ActorConnectFieldInput {
    where: ActorWhere
    properties: ActedInCreateInput
    connect: ActorConnectInput
}

input ActorConnectInput {
    movies: [MovieConnectFieldInput!]
}

input MovieCreateInput {
    title: String
    actors: MovieActorsFieldInput
}

input MovieActorCreateInput {
    properties: ActedInCreateInput!
    node: ActorCreateInput!
}

input MovieActorsFieldInput {
    create: [MovieActorCreateInput!]
    connect: [ActorConnectFieldInput!]
}

input MovieConnectFieldInput {
    where: MovieWhere
    properties: ActedInCreateInput
    connect: MovieConnectInput
}

input MovieConnectInput {
    actors: [ActorConnectFieldInput!]
}

input ActorMoviesUpdateFieldInput {
    where: MovieWhere
    update: MovieUpdateInput
    create: [ActorMovieCreateInput!]
    connect: [MovieConnectFieldInput!]
    disconnect: [MovieDisconnectFieldInput!]
    delete: [MovieDeleteFieldInput!]
    updateConnection: [MovieUpdateConnectionFieldInput!]
}

input ActorUpdateInput {
    id: ID
    name: String
    movies: [ActorMoviesUpdateFieldInput!]
}

input MovieActorsUpdateFieldInput {
    where: ActorWhere
    update: ActorUpdateInput
    create: [MovieActorCreateInput!]
    connect: [ActorConnectFieldInput!]
    disconnect: [ActorDisconnectFieldInput!]
    delete: [ActorDeleteFieldInput!]
    updateConnection: [ActorUpdateConnectionFieldInput!]
}

input MovieUpdateInput {
    title: String
    actors: [MovieActorsUpdateFieldInput!]
}

input ActorRelationInput {
    movies: [ActorMovieCreateInput!]
}

input MovieRelationInput {
    actors: [MovieActorCreateInput!]
}

input MovieUpdateConnectionFieldInput {
    where: MovieWhere
    properties: ActedInUpdateInput
}

input ActorUpdateConnectionInput {
    movies: [MovieUpdateConnectionFieldInput!]
}

input ActorUpdateConnectionFieldInput {
    where: ActorWhere
    properties: ActedInUpdateInput
}

input MovieUpdateConnectionInput {
    actors: [ActorUpdateConnectionFieldInput!]
}

type DeleteInfo {
    nodesDeleted: Int!
    relationshipsDeleted: Int!
}

type CreateActorsMutationResponse {
    actors: [Actor!]!
}

type UpdateActorsMutationResponse {
    actors: [Actor!]!
}

type CreateMoviesMutationResponse {
    movies: [Movie!]!
}

type UpdateMoviesMutationResponse {
    movies: [Movie!]!
}

type Query {
    node(id: ID!): Node
    actors(where: ActorWhere, options: ActorOptions): [Actor]!
    movies(where: MovieWhere, options: MovieOptions): [Movie]!
}

type Mutation {
    createActors(input: [ActorCreateInput!]!): CreateActorsMutationResponse!
    deleteActors(where: ActorWhere, delete: ActorDeleteInput): DeleteInfo!
    updateActors(
        where: ActorWhere
        update: ActorUpdateInput
        connect: ActorConnectInput
        create: ActorRelationInput
        disconnect: ActorDisconnectInput
        delete: ActorDeleteInput
        updateConnection: ActorUpdateConnectionInput
    ): UpdateActorsMutationResponse!
    createMovies(input: [MovieCreateInput!]!): CreateMoviesMutationResponse!
    deleteMovies(where: MovieWhere, delete: MovieDeleteInput): DeleteInfo!
    updateMovies(
        where: MovieWhere
        update: MovieUpdateInput
        connect: MovieConnectInput
        create: MovieRelationInput
        disconnect: MovieDisconnectInput
        delete: MovieDeleteInput
        updateConnection: MovieUpdateConnectionInput
    ): UpdateMoviesMutationResponse!
}
```
