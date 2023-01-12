# Relay First API

## Problem

The current API is inconsistent and not fit for more complex behaviour.

## Solution

To solve this, the GraphQL API will be redesign to be [Relay](https://relay.dev/graphql/) first. Some sugar syntax will be added as well to support simple behaviour with less verbosity.

### Further discussion point

-   Implement backwards pagination (last, before)
-   Should edges have the relationship fields directly or under "fields" property?
-   Should aggregations have `edge` on top?
-   Should input where use `edge` or `edges`?
-   \_EQUAL vs \_EQ - Equal for string and eq for numbers
-   1-1 relationship types: should these follow "edges"?
-   "Base" types do not match user types - We should generate new types
-   Aggregation types: Should be plural or singular? (MovieAggregationNode vs MoviesAggregationNode)
-   How to add skip based pagination
-   Aggregations for edges vs nodes
-   TODO: Remove aggregations from operations and move them to connection result
-   How to support granular filter operations?
-   Update operations
-   Mutations return "...Connection" types?
-   Sorting on mutation responses?

## Type naming conventions

These are some loose conventions on type and input naming:

-   Connection: Types containing `edges`
-   Edge: Types containing `node` and, optionally, fields
-   Where: Filtering Types
-   Aggregation: Aggregation Types
-   Operations: Contains Operations (`connect`, `create`...)

> Below there is a working example of the proposed API

## Example Augmented Schema

### Original types

```graphql
# Original types
type Movie @fulltext(indexes: [{ indexName: "MovieTitle", fields: ["title"] }]) {
    title: String!
    released: Int
    actors: [Person!]! @relationship(type: "ACTED_IN", direction: IN, properties: "ActedIn")
    director: Person! @relationship(type: "DIRECTED", direction: IN)
}

type Person {
    name: String!
    movies: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT, properties: "ActedIn")
    directed: Movie @relationship(type: "DIRECTED", direction: OUT)
}

interface ActedIn @relationshipProperties {
    year: Int
}
```

### Query

```graphql
type Query {
    movies(
        first: Int
        after: String
        last: Int
        before: String
        where: MovieConnectionWhere
        # phrase: String # Only available if fulltext is defined
        sort: [MovieConnectionSort]
    ): MoviesConnection!
    people(first: Int, after: String, where: PersonConnectionWhere, sort: [PersonConnectionSort]): PeopleConnection!
}

## "Top Level" Connection Types

type MoviesConnection {
    pageInfo: PageInfo! # Required by relay
    edges: [MovieEdge!]! # Required by relay
    totalCount: Int!
    aggregation: MoviesAggregation
}

type PeopleConnection {
    pageInfo: PageInfo! # Required by relay
    edges: [PersonEdge!]! # Required by relay
    totalCount: Int!
    aggregation: PeopleAggregation
}

## Edge Types
# Edge types contain "node", "cursor" and fields if needed

type MovieEdge {
    cursor: String! # Required by relay
    node: Movie! # Required by relay
}

type PersonEdge {
    cursor: String! # Required by relay
    node: Person! # Required by relay
}

## "Basic" Types
type Movie {
    title: String!
    released: Int
    actors(
        where: MovieActorsConnectionWhere
        first: Int
        after: String
        last: Int
        before: String
        directed: Boolean = true
        sort: [MovieActorsConnectionSort!]
    ): MovieActorsConnection!
    director(
        where: MovieDirectorConnectionWhere
        directed: Boolean = true # sort: [MovieDirectorConnectionSort!] # Cannot sort 1-1 relationship
    ): MovieDirectorConnection!
}

type Person {
    name: String!
    movies(
        where: PersonMoviesConnectionWhere
        first: Int
        after: String
        directed: Boolean = true
        sort: [PersonMoviesConnectionSort!]
    ): PersonMoviesConnection!
    directed(
        where: PersonDirectedConnectionWhere
        directed: Boolean = true # sort: [PersonDirectedConnectionSort!] # Cannot sort 1-1 relationship
    ): PersonDirectedConnection!
}

## "Relationship" Connection Types
# One field per relationship

type MovieActorsConnection {
    edges: [MovieActorsEdge!]!
    pageInfo: PageInfo!
    totalCount: Int!
    aggregation: MovieActorsAggregation
}

type MovieDirectorConnection {
    edges: [MovieDirectorEdge!]!
    totalCount: Int!
    pageInfo: PageInfo!
    # aggregation: MovieDirectorAggregation # Director is single element, aggregation should not be here
}

type PersonMoviesConnection {
    edges: [PersonMoviesEdge!]!
    pageInfo: PageInfo!
    totalCount: Int!
    aggregation: PersonMoviesAggregation
}

type PersonDirectedConnection {
    edges: [PersonDirectedEdge!]!
    pageInfo: PageInfo!
    totalCount: Int!
}

## "Relationship" edges

type MovieActorsEdge {
    cursor: String! # Required by Relay
    node: Person! # Required by Relay
    fields: ActedIn
}

type PersonMoviesEdge {
    cursor: String! # Required by Relay
    node: Movie! # Required by Relay
    fields: ActedIn
}

type PersonDirectedEdge {
    cursor: String! # Required by Relay
    node: Movie! # Required by Relay
}

type MovieDirectorEdge {
    cursor: String!
    node: Person!
}

## Relationship fields

interface ActedIn {
    year: Int
}

## Aggregation

### "Top Level" aggregation

type MoviesAggregation {
    node: MoviesAggregationNode!
}

type PeopleAggregation {
    node: PeopleAggregationNode!
}

### "Node" aggregation
type MoviesAggregationNode {
    count: Int!
    title: StringAggregateSelectionNonNullable!
    released: IntAggregateSelectionNullable!
}

type PeopleAggregationNode {
    count: Int!
    name: StringAggregateSelectionNonNullable!
}

### "Relationship" aggregations

type MovieActorsAggregation {
    node: PeopleAggregationNode!
    fields: ActedInAggregation!
}

type PersonMoviesAggregation {
    node: MoviesAggregationNode!
    fields: ActedInAggregation!
}

type ActedInAggregation {
    year: IntAggregateSelectionNullable!
}

# "Top Level" Filtering

input MovieConnectionWhere {
    AND: [MovieConnectionWhere!]
    OR: [MovieConnectionWhere!]
    NOT: MovieConnectionWhere
    edges: MovieEdgeWhere
    # fulltext
}

input PersonConnectionWhere {
    AND: [PersonConnectionWhere!]
    OR: [PersonConnectionWhere!]
    NOT: PersonConnectionWhere
    edges: PersonEdgeWhere
}

## "Top Level" Filtering Edge

input MovieEdgeWhere {
    AND: [MovieEdgeWhere!]
    OR: [MovieEdgeWhere!]
    NOT: MovieEdgeWhere
    node: MovieWhere
}

input PersonEdgeWhere {
    AND: [PersonEdgeWhere!]
    OR: [PersonEdgeWhere!]
    NOT: PersonEdgeWhere
    node: PersonWhere
}

## Basic fields where

input MovieWhere {
    OR: [MovieWhere!]
    AND: [MovieWhere!]
    NOT: MovieWhere
    title: StringWhere
    released: IntWhere
    actors: MovieActorsWhere
    director: MovieDirectorConnectionWhere
}

input PersonWhere {
    OR: [PersonWhere!]
    AND: [PersonWhere!]
    NOT: PersonWhere
    name: StringWhere
    movies: MovieActorsConnectionWhere
    directed: PersonDirectedConnectionWhere
}

## Relationship Connection Where

input MovieActorsWhere {
    AND: [MovieActorsWhere!]
    OR: [MovieActorsWhere!]
    NOT: MovieActorsWhere
    all: MovieActorsConnectionWhere
    none: MovieActorsConnectionWhere
    single: MovieActorsConnectionWhere
    some: MovieActorsConnectionWhere
    aggregation: MovieActorsAggregationEdgeWhere
}

input MovieActorsConnectionWhere {
    AND: [MovieActorsConnectionWhere!]
    OR: [MovieActorsConnectionWhere!]
    NOT: MovieActorsConnectionWhere
    edges: MovieActorsEdgeWhere
    aggregation: MovieActorsAggregationEdgeWhere
}

input MovieDirectorConnectionWhere {
    AND: [MovieDirectorConnectionWhere!]
    OR: [MovieDirectorConnectionWhere!]
    NOT: MovieDirectorConnectionWhere
    edges: MovieDirectorEdgeWhere
}

input PersonMoviesConnectionWhere {
    AND: [PersonMoviesConnectionWhere!]
    OR: [PersonMoviesConnectionWhere!]
    NOT: PersonMoviesConnectionWhere
    edges: PersonMoviesEdgeWhere
    aggregation: PersonMoviesAggregationEdgeWhere
}

input PersonDirectedConnectionWhere {
    AND: [PersonDirectedConnectionWhere!]
    OR: [PersonDirectedConnectionWhere!]
    NOT: PersonDirectedConnectionWhere
    edges: PersonDirectedEdgeWhere
}

## Relationship Edge Where

input MovieActorsEdgeWhere {
    AND: [MovieActorsEdgeWhere!]
    OR: [MovieActorsEdgeWhere!]
    NOT: MovieActorsEdgeWhere
    node: PersonWhere
    fields: ActedInWhere
}

input MovieDirectorEdgeWhere {
    AND: [MovieDirectorEdgeWhere!]
    OR: [MovieDirectorEdgeWhere!]
    NOT: MovieDirectorEdgeWhere
    node: PersonWhere
    fields: ActedInWhere
}

input PersonMoviesEdgeWhere {
    AND: [PersonMoviesEdgeWhere!]
    OR: [PersonMoviesEdgeWhere!]
    NOT: PersonMoviesEdgeWhere
    node: MovieWhere
    fields: ActedInWhere
}

input PersonDirectedEdgeWhere {
    AND: [PersonDirectedEdgeWhere!]
    OR: [PersonDirectedEdgeWhere!]
    NOT: PersonDirectedEdgeWhere
    node: MovieWhere
}

## Relationship fields where

input ActedInWhere {
    OR: [ActedInWhere!]
    AND: [ActedInWhere!]
    NOT: ActedInWhere
    year: IntWhere
}

## Aggregation filters

input MovieActorsAggregationEdgeWhere {
    AND: [MovieActorsAggregationEdgeWhere!]
    OR: [MovieActorsAggregationEdgeWhere!]
    NOT: MovieActorsAggregationEdgeWhere
    count: IntWhere
    node: PeopleAggregationWhere
    fields: ActedInAggregationWhere
}

input PersonMoviesAggregationEdgeWhere {
    AND: [PersonMoviesAggregationEdgeWhere!]
    OR: [PersonMoviesAggregationEdgeWhere!]
    NOT: PersonMoviesAggregationEdgeWhere
    count: IntWhere
    node: MoviesAggregationWhere
    fields: ActedInAggregationWhere
}

input MoviesAggregationWhere {
    AND: [MoviesAggregationWhere!]
    OR: [MoviesAggregationWhere!]
    NOT: MoviesAggregationWhere
    count: IntWhere # Count nodes
    title: StringAggregateSelectionNonNullableWhere!
    released: IntAggregateSelectionNullableWhere!
}

input PeopleAggregationWhere {
    AND: [PeopleAggregationWhere!]
    OR: [PeopleAggregationWhere!]
    NOT: PeopleAggregationWhere
    count: IntWhere
    name: StringAggregateSelectionNonNullableWhere
}

input ActedInAggregationWhere {
    AND: [ActedInAggregationWhere!]
    OR: [ActedInAggregationWhere!]
    NOT: ActedInAggregationWhere
    year: IntAggregateSelectionNullableWhere
}

## Pagination

input MovieConnectionSort {
    edges: MovieSortEdge
}

input PersonConnectionSort {
    edges: PersonSortEdge
}

input MovieSortEdge {
    node: MovieSortNode
}

input PersonSortEdge {
    node: PersonSortNode
}

input MovieSortNode {
    title: SortDirection
    released: SortDirection
}

input PersonSortNode {
    name: SortDirection
}

### Relationship Pagination

input MovieActorsConnectionSort {
    edges: MovieActorsSortEdge
}

input PersonMoviesConnectionSort {
    edges: PersonMoviesSortEdge
}

input MovieActorsSortEdge {
    node: PersonSortNode
    fields: ActedInSort
}

input PersonMoviesSortEdge {
    node: MovieSortNode
    fields: ActedInSort
}

input ActedInSort {
    year: SortDirection
}

## Common types (not based on user types)

enum SortDirection {
    ASC
    DESC
}

# type FulltextResult {
#     score: Float! # Fulltext score
# }

type PageInfo {
    hasNextPage: Boolean!
    hasPreviousPage: Boolean!
    startCursor: String
    endCursor: String
}

### Common aggregation fields

type IntAggregateSelectionNullable {
    max: Int
    min: Int
    average: Float
    sum: Int
}

type StringAggregateSelectionNonNullable {
    shortest: String!
    longest: String!
}

#### Aggregation where types

input StringAggregateSelectionNonNullableWhere {
    shortest: StringWhere!
    longest: StringWhere!
}

input IntAggregateSelectionNullableWhere {
    average: FloatWhere
    min: IntWhere
    max: IntWhere
    sum: IntWhere
}

input IntAggregateSelectionNonNullableWhere {
    average: FloatWhere!
    min: IntWhere!
    max: IntWhere!
    sum: IntWhere!
}

input StringWhere {
    OR: [StringWhere!]
    AND: [StringWhere!]
    NOT: StringWhere
    equal: String
    in: [String!]
    matches: String
    contains: String
    startsWith: String
    endsWith: String
}

input IntWhere {
    OR: [IntWhere!]
    AND: [IntWhere!]
    NOT: IntWhere
    eq: Int
    in: [Int]
    lt: Int
    lte: Int
    gt: Int
    gte: Int
}

input FloatWhere {
    OR: [FloatWhere!]
    AND: [FloatWhere!]
    NOT: FloatWhere
    equal: Float
    in: [Float]
    lt: Float
    lte: Float
    gt: Float
    gte: Float
}
```

### Mutations

**Create**

```graphql
type Mutation {
    createMovies(edges: [MovieEdgeCreate!]!): CreateMoviesMutationResponse!
    createPeople(edges: [PersonEdgeCreate!]!): CreatePeopleMutationResponse!
}

# Create

type CreateMoviesMutationResponse {
    edges: [MovieMutationEdge!]!
    info: MutationInfo! # Maybe a more generic meta?
}

type CreatePeopleMutationResponse {
    edges: [PeopleMutationEdge!]!
    info: MutationInfo!
}

type MovieMutationEdge {
    node: Movie!
}

type PeopleMutationEdge {
    node: Movie!
}

type MutationInfo {
    bookmark: String
    nodesCreated: Int!
    nodesDeleted: Int!
    relationshipsCreated: Int!
    relationshipsDeleted: Int!
}

## Create Input

input MovieEdgeCreate {
    node: MovieCreateNode
}

input PersonEdgeCreate {
    node: PersonCreateNode
}

# CreateNodes

input MovieCreateNode {
    title: String!
    released: Int
    actors: MovieActorsCreateOperations
    director: MovieDirectorCreateOperations
}

input PersonCreateNode {
    name: String!
    movies: PersonMoviesCreateOperations
    directed: PersonDirectedCreateOperations
}

# ConnectionOperations
input MovieActorsCreateOperations {
    create: MovieActorsCreate
    connect: MovieActorsConnect
    # TODO: update
}

input MovieDirectorCreateOperations {
    create: MovieDirectorCreate
    connect: MovieDirectorConnect
}

input PersonMoviesCreateOperations {
    create: PersonMoviesCreate
    connect: PersonMoviesConnect
}

input PersonDirectedCreateOperations {
    create: PersonDirectedCreate
    connect: PersonDirectedConnect
}

# "Nested" create
input MovieActorsCreate {
    edges: [MovieActorsEdgeCreate!]
}

input MovieDirectorCreate {
    edges: [MovieDirectorEdgeCreate!]
}

input PersonMoviesCreate {
    edges: [PersonMoviesEdgeCreate!]
}

input PersonDirectedCreate {
    edges: [PersonDirectedEdgeCreate!]
}

# "Nested" Edge Create

input MovieActorsEdgeCreate {
    node: PersonCreateNode!
    fields: ActedInCreate
}

input MovieDirectorEdgeCreate {
    node: PersonCreateNode!
}

input PersonMoviesEdgeCreate {
    node: MovieCreateNode!
    fields: ActedInCreate
}

input PersonDirectedEdgeCreate {
    node: MovieCreateNode!
}

# "Nested" connect

input MovieActorsConnect {
    where: PersonConnectionWhere
    edges: MovieActorsEdgeConnect
}

input MovieActorsDisconnect {
    where: PersonConnectionWhere
    edges: MovieActorsEdgeDisconnect
}

input MovieActorsDelete {
    where: PersonConnectionWhere
    edges: MovieActorsEdgeDisconnect
}

input MovieDirectorConnect {
    where: PersonConnectionWhere
    edges: MovieDirectorEdgeConnect
}

input MovieDirectorDisconnect {
    where: PersonConnectionWhere
    edges: MovieDirectorEdgeDisconnect
}

input MovieDirectorDelete {
    where: PersonConnectionWhere
    edges: MovieDirectorEdgeDisconnect
}

input PersonMoviesConnect {
    where: MovieConnectionWhere
    edges: PersonMoviesEdgeConnect
}

input PersonMoviesDisconnect {
    where: MovieConnectionWhere
    edges: PersonMoviesEdgeDisconnect
}

input PersonMoviesDelete {
    where: MovieConnectionWhere
    edges: PersonMoviesEdgeDisconnect
}

input PersonDirectedConnect {
    where: MovieConnectionWhere
    edges: PersonDirectedEdgeConnect
}

input PersonDirectedDisconnect {
    where: MovieConnectionWhere
    edges: PersonDirectedEdgeDisconnect
}

input PersonDirectedDelete {
    where: MovieConnectionWhere
    edges: PersonDirectedEdgeDisconnect
}

# Nested Edge Connect
input MovieActorsEdgeConnect {
    fields: ActedInCreate
    node: [PersonConnectNode!]
}

input MovieActorsEdgeDisconnect {
    node: [PersonConnectNode!]
}

input MovieDirectorEdgeConnect {
    node: [PersonConnectNode!]
}

input MovieDirectorEdgeDisconnect {
    node: [PersonConnectNode!]
}

input PersonMoviesEdgeConnect {
    fields: ActedInCreate
    node: [MovieConnectNode!]
}

input PersonMoviesEdgeDisconnect {
    node: [MovieConnectNode!]
}

input PersonDirectedEdgeConnect {
    node: [MovieConnectNode!]
}

input PersonDirectedEdgeDisconnect {
    node: [MovieConnectNode!]
}

# ConnectNodes
## Maybe these could be the same as UpdateNode

input MovieConnectNode {
    actors: MovieActorsCreateOperations
    director: MovieDirectorCreateOperations
}

input PersonConnectNode {
    movies: PersonMoviesCreateOperations
    directed: PersonDirectedCreateOperations
}

# Relationship input types

input ActedInCreate {
    year: Int
}
```

**Update**

```graphql
type Mutation {
    updateMovies(where: MovieConnectionWhere, edges: [MovieEdgeUpdate!]!): UpdateMoviesMutationResponse!

    # updateMovies(
    #     where: MovieWhere
    #     update: MovieUpdateInput
    #     connect: MovieConnectInput
    #     disconnect: MovieDisconnectInput
    #     create: MovieRelationInput
    #     delete: MovieDeleteInput
    # ): UpdateMoviesMutationResponse!
}

# Update

type UpdateMoviesMutationResponse {
    edges: [MovieMutationEdge!]!
    info: MutationInfo!
}

## Update Input

input MovieEdgeUpdate {
    node: MovieUpdateNode
}

# UpdateNodes

input MovieUpdateNode {
    title: String
    released: Int
    released_INCREMENT: Int
    released_DECREMENT: Int
    actors: MovieActorsUpdateOperations
    director: MovieDirectorUpdateOperations
}

input MovieActorsUpdateOperations {
    create: MovieActorsCreate
    connect: MovieActorsConnect
    update: MovieActorsUpdate
    disconnect: MovieActorsDisconnect
    delete: MovieActorsDelete
}

input MovieDirectorUpdateOperations {
    create: MovieDirectorCreate
    connect: MovieDirectorConnect
    update: MovieDirectorUpdate
    disconnect: MovieDirectorDisconnect
    delete: MovieDirectorDelete
}

input MovieActorsUpdate {
    edges: MovieActorsEdgeUpdate
}

input MovieDirectorUpdate {
    edges: MovieDirectorEdgeUpdate
}

input MovieActorsEdgeUpdate {
    node: PersonUpdateNode
    fields: ActedInUpdate
}

input MovieDirectorEdgeUpdate {
    node: PersonUpdateNode
}

input ActedInUpdate {
    year: Int
    year_INCREMENT: Int
    year_DECREMENT: Int
}

input PersonUpdateNode {
    name: String
    movies: PersonMoviesUpdateOperations
    directed: PersonDirectedUpdateOperations
}

input PersonMoviesUpdateOperations {
    create: PersonMoviesCreate
    connect: PersonMoviesConnect
    update: PersonMoviesUpdate
    disconnect: PersonMoviesDisconnect
    delete: PersonMoviesDelete
}
input PersonMoviesUpdate {
    edges: PersonMoviesEdgeUpdate
}

input PersonMoviesEdgeUpdate {
    node: MovieUpdateNode
    fields: ActedInUpdate
}

input PersonDirectedUpdateOperations {
    create: PersonDirectedCreate
    connect: PersonDirectedConnect
    update: PersonDirectedUpdate
    disconnect: PersonDirectedDisconnect
    delete: PersonDirectedDelete
}

input PersonDirectedUpdate {
    edges: PersonDirectedEdgeUpdate
}

input PersonDirectedEdgeUpdate {
    node: MovieUpdateNode
}
```

### Example queries

```graphql
query MoviesTitleAndAggregation {
    movies(where: { edges: { node: { title: { contains: "Matrix" } } } }) {
        edges {
            node {
                title
            }
        }
        aggregation {
            node {
                title {
                    longest
                }
            }
        }
    }
}

# Aggregation
query MoviesWithMoreThan10ActorNodes {
    movies(where: { edges: { node: { actors: { aggregation: { node: { count: { gt: 10 } } } } } } }) {
        edges {
            node {
                actors {
                    edges {
                        node {
                            name
                        }
                    }
                    aggregation {
                        node {
                            count
                        }
                    }
                }
            }
        }
    }
}

query MoviesWithMoreThan10ActorEdges {
    movies(where: { edges: { node: { actors: { aggregation: { count: { gt: 10 } } } } } }) {
        edges {
            node {
                actors {
                    edges {
                        node {
                            name
                        }
                    }
                    aggregation {
                        node {
                            count
                        }
                    }
                }
            }
        }
    }
}

# Pagination

query GetMoviesPaginatedIn10 {
    movies(sort: { edges: { node: { title: DESC } } }, first: 10, after: "asdf") {
        edges {
            node {
                title
            }
            cursor
        }
        pageInfo {
            hasNextPage
        }
    }
}

query PaginateActorsInMovie {
    movies(where: { edges: { node: { title: { equal: "The Matrix" } } } }) {
        edges {
            node {
                actors(sort: [{ edges: { fields: { year: DESC } } }, { edges: { node: { name: ASC } } }], first: 20) {
                    pageInfo {
                        endCursor
                        hasNextPage
                    }
                }
            }
        }
    }
}
```

### Example mutations

```graphql
mutation CreateMovie {
    createMovies(input: { edges: { node: { title: "The Matrix" } } }) {
        info {
            nodesCreated
        }
        edges {
            node {
                title
            }
        }
    }
}

mutation CreateMovieAndActors {
    createMovies(
        input: {
            edges: {
                node: {
                    title: "The Matrix"
                    actors: {
                        create: {
                            edges: [
                                { node: { name: "Keanu" }, fields: { year: 1999 } }
                                { node: { name: "Anne" }, fields: { year: 1999 } }
                            ]
                        }
                    }
                }
            }
        }
    ) {
        info {
            nodesCreated
        }
        edges {
            node {
                title
                actors {
                    edges {
                        node {
                            name
                        }
                    }
                }
            }
        }
    }
}

mutation CreateMovieAndConnectToActors {
    createMovies(
        input: {
            edges: {
                node: {
                    title: "The Matrix"
                    actors: {
                        connect: {
                            where: { edges: { node: { name: { contains: "Keanu" } } } }
                            edges: { fields: { year: 1999 } }
                        }
                    }
                }
            }
        }
    ) {
        info {
            nodesCreated
        }
        edges {
            node {
                title
                actors {
                    edges {
                        fields {
                            year
                        }
                        node {
                            name
                        }
                    }
                }
            }
        }
    }
}

mutation CreateMovieAndConnectToActors {
    createMovies(
        edges: {
            node: {
                title: "The Matrix"
                actors: {
                    connect: {
                        where: { edges: { node: { name: { contains: "Keanu" } } } }
                        edges: { fields: { year: 1999 } }
                    }
                }
            }
        }
    ) {
        info {
            nodesCreated
        }
        edges {
            node {
                title
                actors {
                    edges {
                        fields {
                            year
                        }
                        node {
                            name
                        }
                    }
                }
            }
        }
    }
}

# Create with deeply nested
mutation CreateMoviesAndDeeplyNestedCreateMovies {
    createMovies(
        edges: {
            node: {
                title: "The Matrix"
                actors: {
                    create: {
                        edges: {
                            fields: { year: 1999 }
                            node: {
                                name: "Keanu"
                                movies: {
                                    create: { edges: { fields: { year: 2001 }, node: { title: "The Matrix 2" } } }
                                }
                            }
                        }
                    }
                }
            }
        }
    ) {
        info {
            nodesCreated
        }
        edges {
            node {
                title
                actors {
                    edges {
                        fields {
                            year
                        }
                        node {
                            name
                            movies {
                                edges {
                                    fields {
                                        year
                                    }
                                    node {
                                        title
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

mutation CreateMoviesWithDeeplyNestedConnect {
    createMovies(
        edges: {
            node: {
                title: "The Matrix"
                actors: {
                    connect: {
                        where: { edges: { node: { name: { equal: "Keanu" } } } }
                        edges: {
                            fields: { year: 1999 }
                            node: {
                                movies: {
                                    # create: {}
                                    connect: {
                                        where: { edges: { node: { title: { equal: "The Matrix 2" } } } }
                                        edges: { fields: { year: 2001 } }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    ) {
        info {
            nodesCreated
        }
        edges {
            node {
                title
            }
        }
    }
}
```
