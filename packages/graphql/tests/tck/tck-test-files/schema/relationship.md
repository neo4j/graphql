# Schema Relationship

Tests that the provided typeDefs return the correct schema (with relationships).

---

## Single Relationship

### TypeDefs

```graphql
type Actor {
    name: String
}

type Movie {
    id: ID
    actors: [Actor]! @relationship(type: "ACTED_IN", direction: IN)
}
```

### Output

```graphql
type Actor {
    name: String
}

input ActorCreateInput {
    name: String
}

input ActorOptions {
    limit: Int
    offset: Int
    """
    Specify one or more ActorSort objects to sort Actors by. The sorts will be applied in the order in which they are arranged in the array.
    """
    sort: [ActorSort]
}

type StringAggregationSelection {
    max: String!
    min: String!
}

type IDAggregationSelection {
    max: ID!
    min: ID!
}

type MovieAggregateSelection {
    count: Int!
    id: IDAggregationSelection!
}

type ActorAggregateSelection {
    count: Int!
    name: StringAggregationSelection!
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
        after: String
        first: Int
        sort: [MovieActorsConnectionSort!]
        where: MovieActorsConnectionWhere
    ): MovieActorsConnection!
}

input ActorConnectWhere {
    node: ActorWhere!
}

input MovieActorsConnectFieldInput {
    where: ActorConnectWhere
}

type MovieActorsConnection {
    edges: [MovieActorsRelationship!]!
    pageInfo: PageInfo!
    totalCount: Int!
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
    where: MovieActorsConnectionWhere
}

input MovieActorsDisconnectFieldInput {
    where: MovieActorsConnectionWhere
}

input MovieActorsFieldInput {
    create: [MovieActorsCreateFieldInput!]
    connect: [MovieActorsConnectFieldInput!]
}

type MovieActorsRelationship {
    cursor: String!
    node: Actor!
}

input MovieActorsUpdateConnectionInput {
    node: ActorUpdateInput
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
    id: ID
    actors: MovieActorsFieldInput
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
    actorsConnection: MovieActorsConnectionWhere
    actorsConnection_NOT: MovieActorsConnectionWhere
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
    actorsAggregate(where: ActorWhere): ActorAggregateSelection!
    movies(where: MovieWhere, options: MovieOptions): [Movie!]!
    moviesAggregate(where: MovieWhere): MovieAggregateSelection!
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

## Multi Relationship

### TypeDefs

```graphql
type Actor {
    name: String
    movies: [Movie] @relationship(type: "ACTED_IN", direction: OUT)
}

type Movie {
    id: ID
    actors: [Actor]! @relationship(type: "ACTED_IN", direction: IN)
}
```

### Output

```graphql
type Actor {
    name: String
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
    name: String
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
}

type ActorMoviesConnection {
    edges: [ActorMoviesRelationship!]!
    pageInfo: PageInfo!
    totalCount: Int!
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

input ActorMoviesCreateFieldInput {
    node: MovieCreateInput!
}

input ActorMoviesFieldInput {
    create: [ActorMoviesCreateFieldInput!]
    connect: [ActorMoviesConnectFieldInput!]
}

type ActorMoviesRelationship {
    cursor: String!
    node: Movie!
}

input ActorMoviesUpdateConnectionInput {
    node: MovieUpdateInput
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
    limit: Int
    offset: Int
    """
    Specify one or more ActorSort objects to sort Actors by. The sorts will be applied in the order in which they are arranged in the array.
    """
    sort: [ActorSort]
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
        after: String
        first: Int
        where: MovieActorsConnectionWhere
        sort: [MovieActorsConnectionSort!]
    ): MovieActorsConnection!
}

input ActorConnectWhere {
    node: ActorWhere!
}

input MovieActorsConnectFieldInput {
    where: ActorConnectWhere
    connect: [ActorConnectInput!]
}

type MovieActorsConnection {
    edges: [MovieActorsRelationship!]!
    pageInfo: PageInfo!
    totalCount: Int!
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
    delete: ActorDeleteInput
    where: MovieActorsConnectionWhere
}

input MovieActorsDisconnectFieldInput {
    disconnect: ActorDisconnectInput
    where: MovieActorsConnectionWhere
}

input MovieActorsFieldInput {
    create: [MovieActorsCreateFieldInput!]
    connect: [MovieActorsConnectFieldInput!]
}

type MovieActorsRelationship {
    cursor: String!
    node: Actor!
}

input MovieActorsUpdateConnectionInput {
    node: ActorUpdateInput
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
    id: ID
    actors: MovieActorsFieldInput
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
    actorsConnection: MovieActorsConnectionWhere
    actorsConnection_NOT: MovieActorsConnectionWhere
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

type MovieAggregateSelection {
    count: Int!
    id: IDAggregationSelection!
}

type ActorAggregateSelection {
    count: Int!
    name: StringAggregationSelection!
}

type StringAggregationSelection {
    max: String!
    min: String!
}

type IDAggregationSelection {
    max: ID!
    min: ID!
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
    actorsAggregate(where: ActorWhere): ActorAggregateSelection!
    movies(where: MovieWhere, options: MovieOptions): [Movie!]!
    moviesAggregate(where: MovieWhere): MovieAggregateSelection!
    actorsCount(where: ActorWhere): Int!
    moviesCount(where: MovieWhere): Int!
}
```

---
