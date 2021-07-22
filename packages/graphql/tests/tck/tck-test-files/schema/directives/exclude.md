# Schema Cypher Directive

Tests that the provided typeDefs return the correct schema (with `@exclude` directives).

---

## Using `@exclude` directive to skip generation of Query

### TypeDefs

```graphql
type Actor @exclude(operations: [READ]) {
    name: String
}

type Movie {
    title: String
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

input ActorUpdateInput {
    name: String
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
}

type DeleteInfo {
    nodesDeleted: Int!
    relationshipsDeleted: Int!
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

type Movie {
    title: String
}

input MovieCreateInput {
    title: String
}

input MovieOptions {
    """
    Specify one or more MovieSort objects to sort Movies by. The sorts will be applied in the order in which they are arranged in the array.
    """
    sort: [MovieSort]
    limit: Int
    offset: Int
}

"""
Fields to sort Movies by. The order in which sorts are applied is not guaranteed when specifying many fields in one MovieSort object.
"""
input MovieSort {
    title: SortDirection
}

input MovieUpdateInput {
    title: String
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
    deleteActors(where: ActorWhere): DeleteInfo!
    updateActors(
        where: ActorWhere
        update: ActorUpdateInput
    ): UpdateActorsMutationResponse!
    createMovies(input: [MovieCreateInput!]!): CreateMoviesMutationResponse!
    deleteMovies(where: MovieWhere): DeleteInfo!
    updateMovies(
        where: MovieWhere
        update: MovieUpdateInput
    ): UpdateMoviesMutationResponse!
}

type Query {
    movies(where: MovieWhere, options: MovieOptions): [Movie!]!
    moviesCount(where: MovieWhere): Int!
}
```

---

## Using `@exclude` directive to skip generator of Mutation

### TypeDefs

```graphql
type Actor @exclude(operations: [CREATE]) {
    name: String
}
```

### Output

```graphql
type Actor {
    name: String
}

input ActorOptions {
    """
    Specify one or more ActorSort objects to sort Actors by. The sorts will be applied in the order in which they are arranged in the array.
    """
    sort: [ActorSort]
    limit: Int
    offset: Int
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
    name_IN: [String]
    name_NOT: String
    name_NOT_IN: [String]
    name_CONTAINS: String
    name_NOT_CONTAINS: String
    name_STARTS_WITH: String
    name_NOT_STARTS_WITH: String
    name_ENDS_WITH: String
    name_NOT_ENDS_WITH: String
}

type DeleteInfo {
    nodesDeleted: Int!
    relationshipsDeleted: Int!
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

type Mutation {
    deleteActors(where: ActorWhere): DeleteInfo!
    updateActors(
        where: ActorWhere
        update: ActorUpdateInput
    ): UpdateActorsMutationResponse!
}

type Query {
    actors(where: ActorWhere, options: ActorOptions): [Actor!]!
    actorsCount(where: ActorWhere): Int!
}
```

---

## Using `@exclude` directive with `"*"` skips generation of all Queries and Mutations and removes the type itself if not referenced elsewhere

### TypeDefs

```graphql
type Actor @exclude {
    name: String
}

type Movie {
    title: String
}
```

### Output

```graphql
type DeleteInfo {
    nodesDeleted: Int!
    relationshipsDeleted: Int!
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

type Movie {
    title: String
}

input MovieCreateInput {
    title: String
}

input MovieOptions {
    """
    Specify one or more MovieSort objects to sort Movies by. The sorts will be applied in the order in which they are arranged in the array.
    """
    sort: [MovieSort]
    limit: Int
    offset: Int
}

"""
Fields to sort Movies by. The order in which sorts are applied is not guaranteed when specifying many fields in one MovieSort object.
"""
input MovieSort {
    title: SortDirection
}

input MovieUpdateInput {
    title: String
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
}

type CreateMoviesMutationResponse {
    movies: [Movie!]!
}

type UpdateMoviesMutationResponse {
    movies: [Movie!]!
}

type Mutation {
    createMovies(input: [MovieCreateInput!]!): CreateMoviesMutationResponse!
    deleteMovies(where: MovieWhere): DeleteInfo!
    updateMovies(
        where: MovieWhere
        update: MovieUpdateInput
    ): UpdateMoviesMutationResponse!
}

type Query {
    movies(where: MovieWhere, options: MovieOptions): [Movie!]!
    moviesCount(where: MovieWhere): Int!
}
```

---

## Using `@exclude` directive with `"*"` skips generation of all Queries and Mutations but retains the type itself if referenced elsewhere

### TypeDefs

```graphql
type Actor @exclude {
    name: String
}

type Movie {
    title: String
}

type Query {
    customActorQuery: Actor
}
```

### Output

```graphql
type Actor {
    name: String
}

type DeleteInfo {
    nodesDeleted: Int!
    relationshipsDeleted: Int!
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

type Movie {
    title: String
}

input MovieCreateInput {
    title: String
}

input MovieOptions {
    """
    Specify one or more MovieSort objects to sort Movies by. The sorts will be applied in the order in which they are arranged in the array.
    """
    sort: [MovieSort]
    limit: Int
    offset: Int
}

"""
Fields to sort Movies by. The order in which sorts are applied is not guaranteed when specifying many fields in one MovieSort object.
"""
input MovieSort {
    title: SortDirection
}

input MovieUpdateInput {
    title: String
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
}

type CreateMoviesMutationResponse {
    movies: [Movie!]!
}

type UpdateMoviesMutationResponse {
    movies: [Movie!]!
}

type Mutation {
    createMovies(input: [MovieCreateInput!]!): CreateMoviesMutationResponse!
    deleteMovies(where: MovieWhere): DeleteInfo!
    updateMovies(
        where: MovieWhere
        update: MovieUpdateInput
    ): UpdateMoviesMutationResponse!
}

type Query {
    customActorQuery: Actor
    movies(where: MovieWhere, options: MovieOptions): [Movie!]!
    moviesCount(where: MovieWhere): Int!
}
```

---

## Using `@exclude` directive with `"*"` skips generation of all Queries and Mutations but retains the type itself if referenced in a `@relationship` directive

### TypeDefs

```graphql
type Actor @exclude {
    name: String
}

type Movie {
    title: String
    actors: [Actor] @relationship(type: "ACTED_IN", direction: IN)
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

input MovieActorsDeleteFieldInput {
    where: MovieActorsConnectionWhere
}

input MovieActorsDisconnectFieldInput {
    where: MovieActorsConnectionWhere
}

input ActorOptions {
    """
    Specify one or more ActorSort objects to sort Actors by. The sorts will be applied in the order in which they are arranged in the array.
    """
    sort: [ActorSort]
    limit: Int
    offset: Int
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

type CreateMoviesMutationResponse {
    movies: [Movie!]!
}

type DeleteInfo {
    nodesDeleted: Int!
    relationshipsDeleted: Int!
}

type Movie {
    title: String
    actors(where: ActorWhere, options: ActorOptions): [Actor]
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
    title: String
    actors: MovieActorsFieldInput
}

input MovieDeleteInput {
    actors: [MovieActorsDeleteFieldInput!]
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
    startCursor: String!
    endCursor: String!
}

type Query {
    movies(where: MovieWhere, options: MovieOptions): [Movie!]!
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

type UpdateMoviesMutationResponse {
    movies: [Movie!]!
}
```

---

## Ensure generation doesn't break if `@exclude` is provided with an empty array

### TypeDefs

```graphql
type Actor @exclude(operations: []) {
    name: String
}
```

### Output

```graphql
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

type Actor {
    name: String
}

input ActorCreateInput {
    name: String
}

input ActorOptions {
    """
    Specify one or more ActorSort objects to sort Actors by. The sorts will be applied in the order in which they are arranged in the array.
    """
    sort: [ActorSort]
    limit: Int
    offset: Int
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
    name_IN: [String]
    name_NOT: String
    name_NOT_IN: [String]
    name_CONTAINS: String
    name_NOT_CONTAINS: String
    name_STARTS_WITH: String
    name_NOT_STARTS_WITH: String
    name_ENDS_WITH: String
    name_NOT_ENDS_WITH: String
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

type Mutation {
    createActors(input: [ActorCreateInput!]!): CreateActorsMutationResponse!
    deleteActors(where: ActorWhere): DeleteInfo!
    updateActors(
        where: ActorWhere
        update: ActorUpdateInput
    ): UpdateActorsMutationResponse!
}

type Query {
    actors(where: ActorWhere, options: ActorOptions): [Actor!]!
    actorsCount(where: ActorWhere): Int!
}
```

---
