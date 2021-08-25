# Schema Relationship Properties

Tests that the provided typeDefs return the correct schema (with relationships).

---

## Relationship Properties

### TypeDefs

```graphql
type Actor {
    name: String!
    movies: [Movie]
        @relationship(type: "ACTED_IN", direction: OUT, properties: "ActedIn")
}

type Movie {
    title: String!
    actors: [Actor]!
        @relationship(type: "ACTED_IN", direction: IN, properties: "ActedIn")
}

interface ActedIn @relationshipProperties {
    screenTime: Int!
    startDate: Date!
    leadRole: Boolean!
}
```

### Output

```graphql
"""
A date, represented as a 'yyyy-mm-dd' string
"""
scalar Date

interface ActedIn {
    screenTime: Int!
    startDate: Date!
    leadRole: Boolean!
}

input ActedInCreateInput {
    screenTime: Int!
    startDate: Date!
    leadRole: Boolean!
}

input ActedInSort {
    screenTime: SortDirection
    startDate: SortDirection
    leadRole: SortDirection
}

input ActedInUpdateInput {
    screenTime: Int
    startDate: Date
    leadRole: Boolean
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
    startDate: Date
    startDate_NOT: Date
    startDate_IN: [Date]
    startDate_NOT_IN: [Date]
    startDate_LT: Date
    startDate_LTE: Date
    startDate_GT: Date
    startDate_GTE: Date
    leadRole: Boolean
    leadRole_NOT: Boolean
}

type Actor {
    name: String!
    movies(where: MovieWhere, options: MovieOptions): [Movie]
    moviesConnection(
        after: String
        first: Int
        where: ActorMoviesConnectionWhere
        sort: [ActorMoviesConnectionSort!]
    ): ActorMoviesConnection!
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
    edge: ActedInCreateInput!
}

type ActorMoviesConnection {
    edges: [ActorMoviesRelationship!]!
    pageInfo: PageInfo!
    totalCount: Int!
}

input ActorMoviesConnectionSort {
    node: MovieSort
    edge: ActedInSort
}

input ActorMoviesConnectionWhere {
    AND: [ActorMoviesConnectionWhere!]
    OR: [ActorMoviesConnectionWhere!]
    edge: ActedInWhere
    edge_NOT: ActedInWhere
    node: MovieWhere
    node_NOT: MovieWhere
}

input ActorMoviesCreateFieldInput {
    node: MovieCreateInput!
    edge: ActedInCreateInput!
}

input ActorMoviesFieldInput {
    create: [ActorMoviesCreateFieldInput!]
    connect: [ActorMoviesConnectFieldInput!]
}

type ActorMoviesRelationship implements ActedIn {
    cursor: String!
    node: Movie!
    screenTime: Int!
    startDate: Date!
    leadRole: Boolean!
}

input ActorMoviesUpdateConnectionInput {
    node: MovieUpdateInput
    edge: ActedInUpdateInput
}

input ActorMoviesUpdateFieldInput {
    where: ActorMoviesConnectionWhere
    update: ActorMoviesUpdateConnectionInput
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
    offset: Int
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
    moviesConnection: ActorMoviesConnectionWhere
    moviesConnection_NOT: ActorMoviesConnectionWhere
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
    actorsConnection(
        after: String
        first: Int
        where: MovieActorsConnectionWhere
        sort: [MovieActorsConnectionSort!]
    ): MovieActorsConnection!
}

input MovieActorsConnectFieldInput {
    where: ActorConnectWhere
    connect: [ActorConnectInput!]
    edge: ActedInCreateInput!
}

type MovieActorsConnection {
    edges: [MovieActorsRelationship!]!
    pageInfo: PageInfo!
    totalCount: Int!
}

input MovieActorsConnectionSort {
    node: ActorSort
    edge: ActedInSort
}

input MovieActorsConnectionWhere {
    AND: [MovieActorsConnectionWhere!]
    OR: [MovieActorsConnectionWhere!]
    edge: ActedInWhere
    edge_NOT: ActedInWhere
    node: ActorWhere
    node_NOT: ActorWhere
}

input MovieActorsCreateFieldInput {
    node: ActorCreateInput!
    edge: ActedInCreateInput!
}

input MovieActorsFieldInput {
    create: [MovieActorsCreateFieldInput!]
    connect: [MovieActorsConnectFieldInput!]
}

type MovieActorsRelationship implements ActedIn {
    cursor: String!
    node: Actor!
    screenTime: Int!
    startDate: Date!
    leadRole: Boolean!
}

input MovieActorsUpdateConnectionInput {
    node: ActorUpdateInput
    edge: ActedInUpdateInput
}

input MovieActorsUpdateFieldInput {
    where: MovieActorsConnectionWhere
    update: MovieActorsUpdateConnectionInput
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
    offset: Int
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
    actorsConnection: MovieActorsConnectionWhere
    actorsConnection_NOT: MovieActorsConnectionWhere
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

"""
Pagination information (Relay)
"""
type PageInfo {
    hasNextPage: Boolean!
    hasPreviousPage: Boolean!
    startCursor: String
    endCursor: String
}

type Query {
    actors(where: ActorWhere, options: ActorOptions): [Actor!]!
    movies(where: MovieWhere, options: MovieOptions): [Movie!]!
    moviesCount(where: MovieWhere): Int!
    actorsCount(where: ActorWhere): Int!
}

enum SortDirection {
    """
    Sort by field values in ascending order.
    """
    ASC

    """
    Sort by field values in descending order.
    """
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
