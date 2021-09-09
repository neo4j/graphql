# Interface Relationships

Tests that the provided typeDefs return the correct schema.

---

## Interface Relationships

### TypeDefs

```graphql
interface Production {
    title: String!
}

type Movie implements Production {
    title: String!
    runtime: Int!
    actors: [Actor!]!
        @relationship(type: "ACTED_IN", direction: IN, properties: "ActedIn")
}

type Series implements Production {
    title: String!
    episodes: Int!
    actors: [Actor!]!
        @relationship(type: "ACTED_IN", direction: IN, properties: "ActedIn")
}

interface ActedIn @relationshipProperties {
    screenTime: Int!
}

type Actor {
    name: String!
    actedIn: [Production!]!
        @relationship(type: "ACTED_IN", direction: OUT, properties: "ActedIn")
}
```

### Output

```graphql
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
    AND: [ActedInWhere!]
    OR: [ActedInWhere!]
    screenTime: Int
    screenTime_GT: Int
    screenTime_GTE: Int
    screenTime_IN: [Int]
    screenTime_LT: Int
    screenTime_LTE: Int
    screenTime_NOT: Int
    screenTime_NOT_IN: [Int]
}

type Actor {
    actedIn(where: ProductionWhere): [Production!]!
    actedInConnection(
        where: ActorActedInConnectionWhere
    ): ActorActedInConnection!
    name: String!
}

input ActorActedInConnectFieldInput {
    edge: ActedInCreateInput!
    where: ProductionConnectWhere
}

type ActorActedInConnection {
    edges: [ActorActedInRelationship!]!
    pageInfo: PageInfo!
    totalCount: Int!
}

input ActorActedInConnectionWhere {
    AND: [ActorActedInConnectionWhere!]
    OR: [ActorActedInConnectionWhere!]
    edge: ActedInWhere
    edge_NOT: ActedInWhere
    node: ProductionWhere
    node_NOT: ProductionWhere
}

input ActorActedInCreateFieldInput {
    Movie: [ActorActedInMovieCreateFieldInput!]
    Series: [ActorActedInSeriesCreateFieldInput!]
}

input ActorActedInDeleteFieldInput {
    where: ActorActedInConnectionWhere
}

input ActorActedInDisconnectFieldInput {
    where: ActorActedInConnectionWhere
}

input ActorActedInMovieCreateFieldInput {
    edge: ActedInCreateInput!
    node: MovieCreateInput!
}

type ActorActedInRelationship implements ActedIn {
    cursor: String!
    node: Production!
    screenTime: Int!
}

input ActorActedInSeriesCreateFieldInput {
    edge: ActedInCreateInput!
    node: SeriesCreateInput!
}

input ActorConnectInput {
    actedIn: ActorActedInConnectFieldInput
}

input ActorConnectWhere {
    node: ActorWhere!
}

input ActorCreateInput {
    actedIn: ActorActedInCreateFieldInput
    name: String!
}

input ActorDeleteInput {
    actedIn: ActorActedInDeleteFieldInput
}

input ActorDisconnectInput {
    actedIn: ActorActedInDisconnectFieldInput
}

input ActorOptions {
    limit: Int
    offset: Int
    """
    Specify one or more ActorSort objects to sort Actors by. The sorts will be applied in the order in which they are arranged in the array.
    """
    sort: [ActorSort]
}

input ActorRelationInput {
    actedIn: ActorActedInCreateFieldInput
}

"""
Fields to sort Actors by. The order in which sorts are applied is not guaranteed when specifying many fields in one ActorSort object.
"""
input ActorSort {
    name: SortDirection
}

input ActorUpdateInput {
    name: String
}

input ActorWhere {
    AND: [ActorWhere!]
    OR: [ActorWhere!]
    actedInConnection: ActorActedInConnectionWhere
    actedInConnection_NOT: ActorActedInConnectionWhere
    name: String
    name_CONTAINS: String
    name_ENDS_WITH: String
    name_IN: [String]
    name_NOT: String
    name_NOT_CONTAINS: String
    name_NOT_ENDS_WITH: String
    name_NOT_IN: [String]
    name_NOT_STARTS_WITH: String
    name_STARTS_WITH: String
}

type CreateActorsMutationResponse {
    actors: [Actor!]!
    info: CreateInfo!
}

type CreateInfo {
    bookmark: String
    nodesCreated: Int!
    relationshipsCreated: Int!
}

type CreateMoviesMutationResponse {
    info: CreateInfo!
    movies: [Movie!]!
}

type CreateSeriesMutationResponse {
    info: CreateInfo!
    series: [Series!]!
}

type DeleteInfo {
    bookmark: String
    nodesDeleted: Int!
    relationshipsDeleted: Int!
}

type Movie implements Production {
    actors(options: ActorOptions, where: ActorWhere): [Actor!]!
    actorsConnection(
        after: String
        first: Int
        sort: [MovieActorsConnectionSort!]
        where: MovieActorsConnectionWhere
    ): MovieActorsConnection!
    runtime: Int!
    title: String!
}

input MovieActorsConnectFieldInput {
    connect: [ActorConnectInput!]
    edge: ActedInCreateInput!
    where: ActorConnectWhere
}

type MovieActorsConnection {
    edges: [MovieActorsRelationship!]!
    pageInfo: PageInfo!
    totalCount: Int!
}

input MovieActorsConnectionSort {
    edge: ActedInSort
    node: ActorSort
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
    edge: ActedInCreateInput!
    node: ActorCreateInput!
}

input MovieActorsDeleteFieldInput {
    delete: ActorDeleteInput
    where: MovieActorsConnectionWhere
}

input MovieActorsDisconnectFieldInput {
    disconnect: ActorDisconnectInput
    where: MovieActorsConnectionWhere
}

input MovieActorsFieldInput {
    connect: [MovieActorsConnectFieldInput!]
    create: [MovieActorsCreateFieldInput!]
}

type MovieActorsRelationship implements ActedIn {
    cursor: String!
    node: Actor!
    screenTime: Int!
}

input MovieActorsUpdateConnectionInput {
    edge: ActedInUpdateInput
    node: ActorUpdateInput
}

input MovieActorsUpdateFieldInput {
    connect: [MovieActorsConnectFieldInput!]
    create: [MovieActorsCreateFieldInput!]
    delete: [MovieActorsDeleteFieldInput!]
    disconnect: [MovieActorsDisconnectFieldInput!]
    update: MovieActorsUpdateConnectionInput
    where: MovieActorsConnectionWhere
}

input MovieConnectInput {
    actors: [MovieActorsConnectFieldInput!]
}

input MovieCreateInput {
    actors: MovieActorsFieldInput
    runtime: Int!
    title: String!
}

input MovieDeleteInput {
    actors: [MovieActorsDeleteFieldInput!]
}

input MovieDisconnectInput {
    actors: [MovieActorsDisconnectFieldInput!]
}

input MovieOptions {
    limit: Int
    offset: Int
    """
    Specify one or more MovieSort objects to sort Movies by. The sorts will be applied in the order in which they are arranged in the array.
    """
    sort: [MovieSort]
}

input MovieRelationInput {
    actors: [MovieActorsCreateFieldInput!]
}

"""
Fields to sort Movies by. The order in which sorts are applied is not guaranteed when specifying many fields in one MovieSort object.
"""
input MovieSort {
    runtime: SortDirection
    title: SortDirection
}

input MovieUpdateInput {
    actors: [MovieActorsUpdateFieldInput!]
    runtime: Int
    title: String
}

input MovieWhere {
    AND: [MovieWhere!]
    OR: [MovieWhere!]
    actors: ActorWhere
    actorsConnection: MovieActorsConnectionWhere
    actorsConnection_NOT: MovieActorsConnectionWhere
    actors_NOT: ActorWhere
    runtime: Int
    runtime_GT: Int
    runtime_GTE: Int
    runtime_IN: [Int]
    runtime_LT: Int
    runtime_LTE: Int
    runtime_NOT: Int
    runtime_NOT_IN: [Int]
    title: String
    title_CONTAINS: String
    title_ENDS_WITH: String
    title_IN: [String]
    title_NOT: String
    title_NOT_CONTAINS: String
    title_NOT_ENDS_WITH: String
    title_NOT_IN: [String]
    title_NOT_STARTS_WITH: String
    title_STARTS_WITH: String
}

"""
Pagination information (Relay)
"""
type PageInfo {
    endCursor: String
    hasNextPage: Boolean!
    hasPreviousPage: Boolean!
    startCursor: String
}

interface Production {
    title: String!
}

input ProductionConnectWhere {
    node: ProductionWhere!
}

input ProductionMovieWhere {
    AND: [MovieWhere!]
    OR: [MovieWhere!]
    runtime: Int
    runtime_GT: Int
    runtime_GTE: Int
    runtime_IN: [Int]
    runtime_LT: Int
    runtime_LTE: Int
    runtime_NOT: Int
    runtime_NOT_IN: [Int]
}

input ProductionSeriesWhere {
    AND: [SeriesWhere!]
    OR: [SeriesWhere!]
    episodes: Int
    episodes_GT: Int
    episodes_GTE: Int
    episodes_IN: [Int]
    episodes_LT: Int
    episodes_LTE: Int
    episodes_NOT: Int
    episodes_NOT_IN: [Int]
}

input ProductionWhere {
    AND: [ProductionWhere!]
    Movie: ProductionMovieWhere
    OR: [ProductionWhere!]
    Series: ProductionSeriesWhere
    title: String
    title_CONTAINS: String
    title_ENDS_WITH: String
    title_IN: [String]
    title_NOT: String
    title_NOT_CONTAINS: String
    title_NOT_ENDS_WITH: String
    title_NOT_IN: [String]
    title_NOT_STARTS_WITH: String
    title_STARTS_WITH: String
}

type Series implements Production {
    actors(options: ActorOptions, where: ActorWhere): [Actor!]!
    actorsConnection(
        after: String
        first: Int
        sort: [SeriesActorsConnectionSort!]
        where: SeriesActorsConnectionWhere
    ): SeriesActorsConnection!
    episodes: Int!
    title: String!
}

input SeriesActorsConnectFieldInput {
    connect: [ActorConnectInput!]
    edge: ActedInCreateInput!
    where: ActorConnectWhere
}

type SeriesActorsConnection {
    edges: [SeriesActorsRelationship!]!
    pageInfo: PageInfo!
    totalCount: Int!
}

input SeriesActorsConnectionSort {
    edge: ActedInSort
    node: ActorSort
}

input SeriesActorsConnectionWhere {
    AND: [SeriesActorsConnectionWhere!]
    OR: [SeriesActorsConnectionWhere!]
    edge: ActedInWhere
    edge_NOT: ActedInWhere
    node: ActorWhere
    node_NOT: ActorWhere
}

input SeriesActorsCreateFieldInput {
    edge: ActedInCreateInput!
    node: ActorCreateInput!
}

input SeriesActorsDeleteFieldInput {
    delete: ActorDeleteInput
    where: SeriesActorsConnectionWhere
}

input SeriesActorsDisconnectFieldInput {
    disconnect: ActorDisconnectInput
    where: SeriesActorsConnectionWhere
}

input SeriesActorsFieldInput {
    connect: [SeriesActorsConnectFieldInput!]
    create: [SeriesActorsCreateFieldInput!]
}

type SeriesActorsRelationship implements ActedIn {
    cursor: String!
    node: Actor!
    screenTime: Int!
}

input SeriesActorsUpdateConnectionInput {
    edge: ActedInUpdateInput
    node: ActorUpdateInput
}

input SeriesActorsUpdateFieldInput {
    connect: [SeriesActorsConnectFieldInput!]
    create: [SeriesActorsCreateFieldInput!]
    delete: [SeriesActorsDeleteFieldInput!]
    disconnect: [SeriesActorsDisconnectFieldInput!]
    update: SeriesActorsUpdateConnectionInput
    where: SeriesActorsConnectionWhere
}

input SeriesConnectInput {
    actors: [SeriesActorsConnectFieldInput!]
}

input SeriesCreateInput {
    actors: SeriesActorsFieldInput
    episodes: Int!
    title: String!
}

input SeriesDeleteInput {
    actors: [SeriesActorsDeleteFieldInput!]
}

input SeriesDisconnectInput {
    actors: [SeriesActorsDisconnectFieldInput!]
}

input SeriesOptions {
    limit: Int
    offset: Int
    """
    Specify one or more SeriesSort objects to sort Series by. The sorts will be applied in the order in which they are arranged in the array.
    """
    sort: [SeriesSort]
}

input SeriesRelationInput {
    actors: [SeriesActorsCreateFieldInput!]
}

"""
Fields to sort Series by. The order in which sorts are applied is not guaranteed when specifying many fields in one SeriesSort object.
"""
input SeriesSort {
    episodes: SortDirection
    title: SortDirection
}

input SeriesUpdateInput {
    actors: [SeriesActorsUpdateFieldInput!]
    episodes: Int
    title: String
}

input SeriesWhere {
    AND: [SeriesWhere!]
    OR: [SeriesWhere!]
    actors: ActorWhere
    actorsConnection: SeriesActorsConnectionWhere
    actorsConnection_NOT: SeriesActorsConnectionWhere
    actors_NOT: ActorWhere
    episodes: Int
    episodes_GT: Int
    episodes_GTE: Int
    episodes_IN: [Int]
    episodes_LT: Int
    episodes_LTE: Int
    episodes_NOT: Int
    episodes_NOT_IN: [Int]
    title: String
    title_CONTAINS: String
    title_ENDS_WITH: String
    title_IN: [String]
    title_NOT: String
    title_NOT_CONTAINS: String
    title_NOT_ENDS_WITH: String
    title_NOT_IN: [String]
    title_NOT_STARTS_WITH: String
    title_STARTS_WITH: String
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
    info: UpdateInfo!
}

type UpdateInfo {
    bookmark: String
    nodesCreated: Int!
    nodesDeleted: Int!
    relationshipsCreated: Int!
    relationshipsDeleted: Int!
}

type UpdateMoviesMutationResponse {
    info: UpdateInfo!
    movies: [Movie!]!
}

type UpdateSeriesMutationResponse {
    info: UpdateInfo!
    series: [Series!]!
}

type Query {
    actors(options: ActorOptions, where: ActorWhere): [Actor!]!
    actorsCount(where: ActorWhere): Int!
    movies(options: MovieOptions, where: MovieWhere): [Movie!]!
    moviesCount(where: MovieWhere): Int!
    series(options: SeriesOptions, where: SeriesWhere): [Series!]!
    seriesCount(where: SeriesWhere): Int!
}

type Mutation {
    createActors(input: [ActorCreateInput!]!): CreateActorsMutationResponse!
    createMovies(input: [MovieCreateInput!]!): CreateMoviesMutationResponse!
    createSeries(input: [SeriesCreateInput!]!): CreateSeriesMutationResponse!
    deleteActors(delete: ActorDeleteInput, where: ActorWhere): DeleteInfo!
    deleteMovies(delete: MovieDeleteInput, where: MovieWhere): DeleteInfo!
    deleteSeries(delete: SeriesDeleteInput, where: SeriesWhere): DeleteInfo!
    updateActors(
        connect: ActorConnectInput
        create: ActorRelationInput
        delete: ActorDeleteInput
        disconnect: ActorDisconnectInput
        update: ActorUpdateInput
        where: ActorWhere
    ): UpdateActorsMutationResponse!
    updateMovies(
        connect: MovieConnectInput
        create: MovieRelationInput
        delete: MovieDeleteInput
        disconnect: MovieDisconnectInput
        update: MovieUpdateInput
        where: MovieWhere
    ): UpdateMoviesMutationResponse!
    updateSeries(
        connect: SeriesConnectInput
        create: SeriesRelationInput
        delete: SeriesDeleteInput
        disconnect: SeriesDisconnectInput
        update: SeriesUpdateInput
        where: SeriesWhere
    ): UpdateSeriesMutationResponse!
}
```

---
