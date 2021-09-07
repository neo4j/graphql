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
}

type Series implements Production {
    title: String!
    episodes: Int!
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

type ActorActedInRelationship implements ActedIn {
    cursor: String!
    node: Production!
    screenTime: Int!
}

input ActorConnectInput

input ActorCreateInput {
    name: String!
}

input ActorDeleteInput

input ActorDisconnectInput

input ActorOptions {
    limit: Int
    offset: Int
    """
    Specify one or more ActorSort objects to sort Actors by. The sorts will be applied in the order in which they are arranged in the array.
    """
    sort: [ActorSort]
}

input ActorRelationInput

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
    runtime: Int!
    title: String!
}

input MovieCreateInput {
    runtime: Int!
    title: String!
}

input MovieOptions {
    limit: Int
    offset: Int
    """
    Specify one or more MovieSort objects to sort Movies by. The sorts will be applied in the order in which they are arranged in the array.
    """
    sort: [MovieSort]
}

"""
Fields to sort Movies by. The order in which sorts are applied is not guaranteed when specifying many fields in one MovieSort object.
"""
input MovieSort {
    runtime: SortDirection
    title: SortDirection
}

input MovieUpdateInput {
    runtime: Int
    title: String
}

input MovieWhere {
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
    OR: [ProductionWhere!]
    Movie: ProductionMovieWhere
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
    episodes: Int!
    title: String!
}

input SeriesCreateInput {
    episodes: Int!
    title: String!
}

input SeriesOptions {
    limit: Int
    offset: Int
    """
    Specify one or more SeriesSort objects to sort Series by. The sorts will be applied in the order in which they are arranged in the array.
    """
    sort: [SeriesSort]
}

"""
Fields to sort Series by. The order in which sorts are applied is not guaranteed when specifying many fields in one SeriesSort object.
"""
input SeriesSort {
    episodes: SortDirection
    title: SortDirection
}

input SeriesUpdateInput {
    episodes: Int
    title: String
}

input SeriesWhere {
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
    deleteMovies(where: MovieWhere): DeleteInfo!
    deleteSeries(where: SeriesWhere): DeleteInfo!
    updateActors(
        connect: ActorConnectInput
        create: ActorRelationInput
        delete: ActorDeleteInput
        disconnect: ActorDisconnectInput
        update: ActorUpdateInput
        where: ActorWhere
    ): UpdateActorsMutationResponse!
    updateMovies(
        update: MovieUpdateInput
        where: MovieWhere
    ): UpdateMoviesMutationResponse!
    updateSeries(
        update: SeriesUpdateInput
        where: SeriesWhere
    ): UpdateSeriesMutationResponse!
}
```

---
