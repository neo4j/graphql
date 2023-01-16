# Relay First API

## Problem

The current API is inconsistent and not fit for more complex behaviour.

## Solution

To solve this, the GraphQL API will be redesign to be [Relay](https://relay.dev/graphql/) first. Some sugar syntax will be added as well to support simple behaviour with less verbosity.

Assuming the following types:

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

-   Backwards pagination - new feature

-   Filter operations: Equal for strings, eq for numbers
-   Optionally, replace cursor pagination by skip based pagination
-   Simple sugar syntax

## Simple API

### Pagination

Cursor based pagination does not fit within the simple API.

1. Disable pagination altogether
2. Only allow pagination if the user has configured limit based pagination
3. Add cursor (probably as `_cursor`) in the return type
4. Like it is now (limit pagination always available for simple API)

### Further discussion point

-   1-1 relationship types: should these follow "edges"?
-   Node aggregation vs edge aggregation
-   Sort by aggregations and 1-\* relationship
-   should nested relationships be named \*Connection?
-   Sugar syntax for top level edge
-   Union / interfaces
-   1-\* edges filter on edge

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
    moviesConnection(
        first: Int
        after: String
        last: Int
        before: String
        where: MovieConnectionWhere
        # phrase: String # Only available if fulltext is defined
        sort: [MovieConnectionSort]
    ): MoviesConnection!
    peopleConnection(
        first: Int
        after: String
        where: PersonConnectionWhere
        sort: [PersonConnectionSort]
    ): PeopleConnection!
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
    node: MovieNode! # Required by relay
}

type PersonEdge {
    cursor: String! # Required by relay
    node: PersonNode! # Required by relay
}

## "Node" Types
type MovieNode {
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

type PersonNode {
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
    node: PersonNode! # Required by Relay
    fields: ActedIn
}

type PersonMoviesEdge {
    cursor: String! # Required by Relay
    node: MovieNode! # Required by Relay
    fields: ActedIn
}

type PersonDirectedEdge {
    cursor: String! # Required by Relay
    node: MovieNode! # Required by Relay
}

type MovieDirectorEdge {
    cursor: String!
    node: PersonNode!
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
    node: MovieNodeWhere
}

input PersonEdgeWhere {
    AND: [PersonEdgeWhere!]
    OR: [PersonEdgeWhere!]
    NOT: PersonEdgeWhere
    node: PersonNodeWhere
}

## Basic fields where

input MovieNodeWhere {
    OR: [MovieNodeWhere!]
    AND: [MovieNodeWhere!]
    NOT: MovieNodeWhere
    title: StringWhere
    released: IntWhere
    actors: MovieActorsConnectionWhere
    director: MovieDirectorConnectionWhere
}

input PersonNodeWhere {
    OR: [PersonNodeWhere!]
    AND: [PersonNodeWhere!]
    NOT: PersonNodeWhere
    name: StringWhere
    movies: PersonMoviesConnectionWhere
    directed: PersonDirectedConnectionWhere
}

## Relationship Connection Where

input MovieActorsConnectionWhere {
    AND: [MovieActorsConnectionWhere!]
    OR: [MovieActorsConnectionWhere!]
    NOT: MovieActorsConnectionWhere
    edges: MovieActorsWhereFilters
    aggregation: MovieActorsAggregationEdgeWhere
}

input MovieActorsWhereFilters {
    AND: [MovieActorsWhereFilters!]
    OR: [MovieActorsWhereFilters!]
    NOT: MovieActorsWhereFilters
    all: MovieActorsEdgeWhere
    none: MovieActorsEdgeWhere
    single: MovieActorsEdgeWhere
    some: MovieActorsEdgeWhere
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
    edges: PersonMoviesWhereFilters
    aggregation: PersonMoviesAggregationEdgeWhere
}

input PersonMoviesWhereFilters {
    AND: [PersonMoviesWhereFilters!]
    OR: [PersonMoviesWhereFilters!]
    NOT: PersonMoviesWhereFilters
    all: PersonMoviesEdgeWhere
    none: PersonMoviesEdgeWhere
    single: PersonMoviesEdgeWhere
    some: PersonMoviesEdgeWhere
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
    node: PersonNodeWhere
    fields: ActedInWhere
}

input MovieDirectorEdgeWhere {
    AND: [MovieDirectorEdgeWhere!]
    OR: [MovieDirectorEdgeWhere!]
    NOT: MovieDirectorEdgeWhere
    node: PersonNodeWhere
    fields: ActedInWhere
}

input PersonMoviesEdgeWhere {
    AND: [PersonMoviesEdgeWhere!]
    OR: [PersonMoviesEdgeWhere!]
    NOT: PersonMoviesEdgeWhere
    node: MovieNodeWhere
    fields: ActedInWhere
}

input PersonDirectedEdgeWhere {
    AND: [PersonDirectedEdgeWhere!]
    OR: [PersonDirectedEdgeWhere!]
    NOT: PersonDirectedEdgeWhere
    node: MovieNodeWhere
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
    avg: Float
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
    avg: FloatWhere
    min: IntWhere
    max: IntWhere
    sum: IntWhere
}

input IntAggregateSelectionNonNullableWhere {
    avg: FloatWhere!
    min: IntWhere!
    max: IntWhere!
    sum: IntWhere!
}

input StringWhere {
    OR: [StringWhere!]
    AND: [StringWhere!]
    NOT: StringWhere
    equals: String
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
    eq: Float
    in: [Float]
    lt: Float
    lte: Float
    gt: Float
    gte: Float
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
