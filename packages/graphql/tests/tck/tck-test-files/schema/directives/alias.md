# Schema Alias Directive

Tests that the provided typeDefs return the correct schema (with alias directives).

---

## Custom Directive Simple

### TypeDefs

```graphql
type Actor {
    name: String!
    city: String @alias(property: "cityPropInDb")
    actedIn: [Movie]
        @relationship(
            direction: OUT
            type: "ACTED_IN"
            properties: "ActorActedInProps"
        )
}

type Movie {
    title: String!
    rating: Float @alias(property: "ratingPropInDb")
}

interface ActorActedInProps {
    character: String! @alias(property: "characterPropInDb")
    screenTime: Int
}
```

### Output

```graphql
schema {
    query: Query
    mutation: Mutation
}

type Actor {
    actedIn(options: MovieOptions, where: MovieWhere): [Movie]
    actedInConnection(
        after: String
        first: Int
        sort: [ActorActedInConnectionSort!]
        where: ActorActedInConnectionWhere
    ): ActorActedInConnection!
    city: String
    name: String!
}

input ActorActedInConnectFieldInput {
    edge: ActorActedInPropsCreateInput!
    where: MovieConnectWhere
}

type ActorActedInConnection {
    edges: [ActorActedInRelationship!]!
    pageInfo: PageInfo!
    totalCount: Int!
}

input ActorActedInConnectionSort {
    edge: ActorActedInPropsSort
    node: MovieSort
}

input ActorActedInConnectionWhere {
    AND: [ActorActedInConnectionWhere!]
    OR: [ActorActedInConnectionWhere!]
    edge: ActorActedInPropsWhere
    edge_NOT: ActorActedInPropsWhere
    node: MovieWhere
    node_NOT: MovieWhere
}

input ActorActedInCreateFieldInput {
    edge: ActorActedInPropsCreateInput!
    node: MovieCreateInput!
}

input ActorActedInDeleteFieldInput {
    where: ActorActedInConnectionWhere
}

input ActorActedInDisconnectFieldInput {
    where: ActorActedInConnectionWhere
}

input ActorActedInFieldInput {
    connect: [ActorActedInConnectFieldInput!]
    create: [ActorActedInCreateFieldInput!]
}

interface ActorActedInProps {
    character: String!
    screenTime: Int
}

input ActorActedInPropsCreateInput {
    character: String!
    screenTime: Int
}

input ActorActedInPropsSort {
    character: SortDirection
    screenTime: SortDirection
}

input ActorActedInPropsUpdateInput {
    character: String
    screenTime: Int
}

input ActorActedInPropsWhere {
    AND: [ActorActedInPropsWhere!]
    OR: [ActorActedInPropsWhere!]
    character: String
    character_CONTAINS: String
    character_ENDS_WITH: String
    character_IN: [String]
    character_NOT: String
    character_NOT_CONTAINS: String
    character_NOT_ENDS_WITH: String
    character_NOT_IN: [String]
    character_NOT_STARTS_WITH: String
    character_STARTS_WITH: String
    screenTime: Int
    screenTime_GT: Int
    screenTime_GTE: Int
    screenTime_IN: [Int]
    screenTime_LT: Int
    screenTime_LTE: Int
    screenTime_NOT: Int
    screenTime_NOT_IN: [Int]
}

type ActorActedInRelationship implements ActorActedInProps {
    character: String!
    cursor: String!
    node: Movie!
    screenTime: Int
}

input ActorActedInUpdateConnectionInput {
    edge: ActorActedInPropsUpdateInput
    node: MovieUpdateInput
}

input ActorActedInUpdateFieldInput {
    connect: [ActorActedInConnectFieldInput!]
    create: [ActorActedInCreateFieldInput!]
    delete: [ActorActedInDeleteFieldInput!]
    disconnect: [ActorActedInDisconnectFieldInput!]
    update: ActorActedInUpdateConnectionInput
    where: ActorActedInConnectionWhere
}

input ActorConnectInput {
    actedIn: [ActorActedInConnectFieldInput!]
}

input ActorCreateInput {
    actedIn: ActorActedInFieldInput
    city: String
    name: String!
}

input ActorDeleteInput {
    actedIn: [ActorActedInDeleteFieldInput!]
}

input ActorDisconnectInput {
    actedIn: [ActorActedInDisconnectFieldInput!]
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
    actedIn: [ActorActedInCreateFieldInput!]
}

"""
Fields to sort Actors by. The order in which sorts are applied is not guaranteed when specifying many fields in one ActorSort object.
"""
input ActorSort {
    city: SortDirection
    name: SortDirection
}

input ActorUpdateInput {
    actedIn: [ActorActedInUpdateFieldInput!]
    city: String
    name: String
}

input ActorWhere {
    AND: [ActorWhere!]
    OR: [ActorWhere!]
    actedIn: MovieWhere
    actedInConnection: ActorActedInConnectionWhere
    actedInConnection_NOT: ActorActedInConnectionWhere
    actedIn_NOT: MovieWhere
    city: String
    city_CONTAINS: String
    city_ENDS_WITH: String
    city_IN: [String]
    city_NOT: String
    city_NOT_CONTAINS: String
    city_NOT_ENDS_WITH: String
    city_NOT_IN: [String]
    city_NOT_STARTS_WITH: String
    city_STARTS_WITH: String
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
}

type CreateMoviesMutationResponse {
    movies: [Movie!]!
}

type DeleteInfo {
    nodesDeleted: Int!
    relationshipsDeleted: Int!
}

type Movie {
    rating: Float
    title: String!
}

input MovieConnectWhere {
    node: MovieWhere!
}

input MovieCreateInput {
    rating: Float
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
    rating: SortDirection
    title: SortDirection
}

input MovieUpdateInput {
    rating: Float
    title: String
}

input MovieWhere {
    AND: [MovieWhere!]
    OR: [MovieWhere!]
    rating: Float
    rating_GT: Float
    rating_GTE: Float
    rating_IN: [Float]
    rating_LT: Float
    rating_LTE: Float
    rating_NOT: Float
    rating_NOT_IN: [Float]
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

type Mutation {
    createActors(input: [ActorCreateInput!]!): CreateActorsMutationResponse!
    createMovies(input: [MovieCreateInput!]!): CreateMoviesMutationResponse!
    deleteActors(delete: ActorDeleteInput, where: ActorWhere): DeleteInfo!
    deleteMovies(where: MovieWhere): DeleteInfo!
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

type Query {
    actors(options: ActorOptions, where: ActorWhere): [Actor!]!
    actorsCount(where: ActorWhere): Int!
    movies(options: MovieOptions, where: MovieWhere): [Movie!]!
    moviesCount(where: MovieWhere): Int!
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
