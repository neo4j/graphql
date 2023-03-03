# Relay First API

# Problem

The current API is not consistent, making it harder to learn, understand and use.

For example, the following query mixes Relay spec (`node`, `edge`) with the simple API, as well as cursor and limit based pagination.

```graphql
query PeopleWithMovies {
    people(where: { name: "Keanu" }, options: { limit: 10 }) {
        name
        moviesConnection(where: { node: { title: "The Matrix" } }, first: 10) {
            edges {
                node {
                    title
                }
            }
        }
    }
}
```

# Solution

To solve this, the GraphQL API will be redesigned to be [Relay](https://relay.dev/graphql/connections.htm) first. Sugar syntax will be added to support simple operations with less verbosity.

We will use the following types for the examples:

```graphql
# Original types
type Movie @fulltext(indexes: [{ indexName: "MovieTitle", fields: ["title"] }]) {
    title: String!
    alternativeTitles: [String!]
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

## Connections API - Query

Query will be done with the following operations:

```graphql
type Query {
    moviesConnection(
        first: Int
        after: String
        where: MovieConnectionWhere
        sort: [MovieConnectionSort]
    ): MoviesConnection!
    peopleConnection(
        first: Int
        after: String
        where: PersonConnectionWhere
        sort: [PersonConnectionSort]
    ): PeopleConnection!
}
```

The `*Connection` types will be a Relay compliant [Connection Type](https://relay.dev/graphql/connections.htm#sec-Connection-Types). With the following fields:

```graphql
type MoviesConnection {
    pageInfo: PageInfo! # Required by relay
    edges: [MovieEdge!]! # Required by relay
    totalCount: Int!
    aggregation: MoviesAggregation
}
```

A simple query would look like:

```graphql
query MoviesTitles {
    moviesConnection {
        edges {
            node {
                title
            }
        }
    }
}
```

### Edges

The `*Edge` types will be a Relay [Edge Type](https://relay.dev/graphql/connections.htm#sec-Edge-Types). These fields will be used to traverse the API and hold the relationship properties, if any:

```graphql
type MovieActorsEdge {
    cursor: String! # Required by Relay
    node: PersonNode! # Required by Relay
    fields: ActedIn! # Fields of the relationship
}
```

There will be an Edge type per entity, as well as a different Edge type per relationship, relationship edges may contain the property `fields` that will hold the relationship properties.

A query following an edge and its properties would look like:

```graphql
query MoviesWithActors {
    moviesConnection {
        edges {
            node {
                title
                actors {
                    edges {
                        node {
                            name
                        }
                        fields {
                            year
                        }
                    }
                }
            }
        }
    }
}
```

In this example, we get the related Actor name, as well as the property `year` from the relationship.

### Nodes

The Entity (e.g. movies) properties for the projection will be defined in a `*Node` type:

```graphql
type MovieNode {
    title: String!
    released: Int
    alternativeTitles: [String!]!
    actors(
        where: MovieActorsConnectionNestedWhere
        first: Int
        after: String
        directed: Boolean = true
        sort: [MovieActorsConnectionSort!]
    ): MovieActorsConnection!
    director(where: MovieDirectorConnectionNestedWhere, directed: Boolean = true): MovieDirectorConnection!
}
```

Note that this type does **not** contain any operations in itself, it has the same properties as the user-defined entity, with the only difference being the result of the nested `actors` and `director` types, that support the top-level input and return a `*Connection`.

The `where` filters are of type `ConnectionNestedWhere` as these include edge filtering, but not aggregations.

### Filtering

Filtering follows the same structure as projections, following nodes and edges. The operations `AND`, `OR` and `NOT` are available at any level. Comparison operators are present inside each field.

```graphql
query MatrixMoviesFrom1999 {
    moviesConnection(
        where: { edges: { node: { AND: [{ title: { contains: "Matrix" } }, { released: { eq: 1999 } }] } } }
    ) {
        edges {
            node {
                title
            }
        }
    }
}
```

#### Filtering Relationships

For filtering edges, we can use the `fields` property and the array operators if needed:

```graphql
query PeopleAndMoviesActedAfter2001 {
  peopleConnection(
    where: {
      edges: { node: { movies: { some: { fields: { year: { gt: 1999 } } } } } }
    }
  ) {
    edges {
      node {
        name
        movies {
          edges {
            node {
              title
            }
          }
        }
      }
    }
  }
}
```

Both, arrays and relationships with many elements can use the operators `some`, `single`, `none` and `all` to filter.

#### Filter on nested connections

Nested relationships can be filtered in the same fashion as top level connections, in this case only applies to the nested elements:

```graphql
query PeopleAndMoviesWithNestedFilter {
    peopleConnection {
        edges {
            node {
                name
                movies(where: { edges: { node: { title: { equals: "The Matrix" } } } }) {
                    edges {
                        node {
                            title
                        }
                    }
                }
            }
        }
    }
}
```

### Sort And Pagination

Pagination, by default, will use `cursor` pagination, according to the Relay spec:

```graphql
query PaginatedMovies {
    moviesConnection(first: 10, after: "my-cursor", sort: { edges: { node: { title: DESC } } }) {
        edges {
            node {
                title
            }
            cursor
        }
        pageInfo {
            startCursor
            hasPreviousPage
            hasNextPage
            endCursor
        }
    }
}
```

Following Relay spec, every `*Connection` type has the `pageInfo` property, and each `edge` has a cursor.

#### Offset pagination

Offset pagination could be enabled in configuration, in this case the properties `limit` and `offset` would be used. Page info and cursor would not be returned in this case.

```graphql
query PaginatedMovies {
    moviesConnection(limit: 10, offset: 5, sort: { edges: { node: { title: DESC } } }) {
        edges {
            node {
                title
            }
            cursor
        }
    }
}
```

Note that if offset-based pagination is enabled instead of cursor based, the API will not be Relay compliant.

#### Back pagination

Following Relay spec, the fields `last` and `before` can be used instead of `first` and `after` to do backwards pagination, this could be toggled in the server configuration.

### Aggregation

Aggregations have been moved to be part of the projection on connection queries:

```graphql
query ShortestMovieTitleAndCount {
    moviesConnection {
        aggregation {
            nodes {
                title {
                    shortest
                }
                count
            }
        }
    }
}
```

This means that a projection can be returned along with the edges. Nested aggregations can be queried in the same fashion. `*Aggregation` types returned in a relationship will have the `node` and `fields` properties with the respective aggregation:

```graphql
query AggregateActorsPerMovie {
    moviesConnection {
        edges {
            node {
                actors {
                    aggregation {
                        nodes {
                            count
                        }
                        edges {
                            fields {
                                year {
                                    min
                                    max
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}
```

> Aggregations are not available for 1-1 relationships

### Fulltext

If fulltext is enable for an entity using the `@fulltext` directive, the `fulltext` input will be available, as well as the `score` fields and filters as a `Float`:

```graphql
query Query {
    moviesConnection(
        fulltext: { phrase: "Test", index: MovieTitle }
        where: { edges: { fulltext: { score: { gt: 5 } } } }
    ) {
        totalCount
        edges {
            fulltext {
                score
            }
        }
    }
}
```

> If there is a single index, the index field could be made optional

This approach allows the possibility of having nested fulltext:

```graphql
query Movies {
    peopleMoviesWithFulltext {
        edges {
            node {
                movies(
                    fulltext: { phrase: "Test", index: MovieTitle }
                    where: { edges: { fulltext: { score: { gt: 5 } } } }
                ) {
                    edges {
                        fulltext {
                            score
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
```

Fulltext can be sorted as a normal field:

```graphql
query TopLevelFulltext {
    moviesConnection(
        fulltext: { phrase: "Matrix", index: MovieTitle }
        sort: { edges: { fulltext: { score: DESC } } }
    ) {
        edges {
            node {
                title
            }
        }
    }
}
```

> Note that the plain `fulltext` option without `where` may still filter the results.

Following this approach, the field `fulltext { score }` will always be returned as optional, regardless of the input. Which may lead to a slightly more confusing API compared to having separate operations.

## Simple API - Query

Relay API, while complete and flexible, is verbose. This may affect onboarding and simple use cases. For this cases, a simplified API can be used. This API is more limited and **cannot** be used along with the Relay API.

The top level queries will be named after the types provided:

```graphql
type Query {
    movies(where: MovieWhere, sort: [MovieSortNode]): [Movie!]!
    people(where: PersonWhere, sort: [PersonSortNode]): [Person!]!
}
```

Instead of a custom `*Connection` type, these queries return the type provided by the user directly. This API can be queried as follows:

```graphql
query Movies {
    movies {
        title
    }
}
```

Nested queries are also supported:

```graphql
query Movies {
    movies {
        title
        actors {
            name
        }
    }
}
```

### Filtering

Filtering is supported with all of the operators available in the Connections API. Filtering over edges, aggregations or fulltext is not supported.

```graphql
query Movies {
    movies(
        where: { OR: [{ title: { equals: "The Matrix" } }, { actors: { some: { name: { contains: "Keanu" } } } }] }
    ) {
        title
        actors {
            name
        }
    }
}
```

### Sort and Pagination

Sort behaves in the same fashion as the Connections API. Cursor-based pagination, however, is not supported. The simple API uses _offset_ based pagination:

```graphql
query Movies {
    movies(sort: { title: DESC }, limit: 10, offset: 2) {
        title
    }
}
```

### Limitations

-   Edge fields cannot be queried or filtered
-   Aggregations are not available
-   Cursor based pagination is not supported
-   Fulltext is not supported

## Naming conventions

These are some loose conventions on type and input naming:

-   `Connection`: Types containing `edges` and following Relay spec.
-   `Edge`: Types containing `node` and, optionally, fields
-   `Where`: Filtering Types
-   `Aggregation`: Aggregation Types

*   Types in a relationship will follow the convention `[RootType][fieldName]` at the beginning.
*   Where possible, input types will mirror normal types. E.g. `PersonNode` will be filtered by `PersonNodeWhere`
*   Types ending in `*Connection` will follow Relay spec as these are reserved types according to the spec

### Further discussion points

-   `Fields` in edges vs having the fields directly on top-level
-   Uppercase operators (e.g. `AND: [{title: CONTAINS: "Matrix"}]`)
-   Remove top level edge from `where` and mutations
-   `fulltextScore` vs `fulltext { score }`
-   Connections may have a `nodes` fields as a shortcut without passing through `edges`
-   Sort by aggregations and 1-\* relationship
-   Union / interfaces
-   Nested [field]connection

## Examples

Below is an example of an augmented schema produced by this schema:

```graphql
# Original types
type Movie @fulltext(indexes: [{ indexName: "MovieTitle", fields: ["title"] }]) {
    title: String!
    alternativeTitles: [String!]
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

### Connection API

```graphql
type Query {
    moviesConnection(
        first: Int
        after: String
        last: Int
        before: String
        where: MovieConnectionWhere
        sort: [MovieConnectionSort]
        fulltext: MovieFulltext
    ): MoviesConnection!
    peopleConnection(
        first: Int
        after: String
        where: PersonConnectionWhere
        sort: [PersonConnectionSort]
    ): PeopleConnection!
    movies(where: MovieWhere, sort: [MovieSortNode], offset: Int, limit: Int): [Movie!]!
    people(where: PersonWhere, sort: [PersonSortNode], offset: Int, limit: Int): [Person!]!
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
    fulltext: Fulltext
}

type PersonEdge {
    cursor: String! # Required by relay
    node: PersonNode! # Required by relay
}

## "Node" Types
type MovieNode {
    title: String!
    id: ID
    released: Int
    alternativeTitles: [String!]
    actors(
        where: MovieActorsConnectionNestedWhere
        first: Int
        after: String
        last: Int
        before: String
        directed: Boolean = true
        sort: [MovieActorsConnectionSort!]
    ): MovieActorsConnection!
    director(
        where: MovieDirectorConnectionNestedWhere
        directed: Boolean = true # Cannot sort 1-1 relationship
    ): MovieDirectorConnection!
}

type PersonNode {
    name: String!
    movies(
        where: PersonMoviesConnectionNestedWhere
        first: Int
        after: String
        directed: Boolean = true
        sort: [PersonMoviesConnectionSort!]
        fulltext: MovieFulltext
    ): PersonMoviesConnection!
    directed(where: PersonDirectedConnectionNestedWhere, directed: Boolean = true): PersonDirectedConnection!
}

input MovieActorsConnectionNestedWhere { # TODO: improve this name
    AND: [MovieActorsConnectionNestedWhere!]
    OR: [MovieActorsConnectionNestedWhere!]
    NOT: MovieActorsConnectionNestedWhere
    edges: MovieActorsEdgeWhere
}
input PersonMoviesConnectionNestedWhere {
    AND: [PersonMoviesConnectionNestedWhere!]
    OR: [PersonMoviesConnectionNestedWhere!]
    NOT: PersonMoviesConnectionNestedWhere
    edges: PersonMoviesEdgeWhere
}

input PersonDirectedConnectionNestedWhere {
    AND: [PersonDirectedConnectionNestedWhere!]
    OR: [PersonDirectedConnectionNestedWhere!]
    NOT: PersonDirectedConnectionNestedWhere
    edges: PersonDirectedEdgeWhere
}

input MovieDirectorConnectionNestedWhere {
    AND: [MovieDirectorConnectionNestedWhere!]
    OR: [MovieDirectorConnectionNestedWhere!]
    NOT: MovieDirectorConnectionNestedWhere
    edges: MovieDirectorEdgeWhere
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
    fields: ActedIn!
    fulltext: Fulltext
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
    nodes: MoviesAggregationNode!
}

type PeopleAggregation {
    nodes: PeopleAggregationNode!
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
    nodes: PeopleAggregationNode!
    edges: MovieActorsEdgeAggregation!
}

type MovieActorsEdgeAggregation {
    fields: ActedInAggregation!
    count: Int!
}

type PersonMoviesAggregation {
    nodes: MoviesAggregationNode!
    edges: PersonMoviesEdgeAggregation!
}

type PersonMoviesEdgeAggregation {
    fields: ActedInAggregation!
    count: Int!
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
    fulltext: FulltextWhere
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
    id: StringWhere
    title: StringWhere
    released: IntWhere
    alternativeTitles: StringListWhere
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
    all: MovieActorsEdgeWhere
    none: MovieActorsEdgeWhere
    single: MovieActorsEdgeWhere
    some: MovieActorsEdgeWhere
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
    all: PersonMoviesEdgeWhere
    none: PersonMoviesEdgeWhere
    single: PersonMoviesEdgeWhere
    some: PersonMoviesEdgeWhere
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
    nodes: PeopleAggregationWhere
    fields: ActedInAggregationEdgeWhere
}

input PersonMoviesAggregationEdgeWhere {
    AND: [PersonMoviesAggregationEdgeWhere!]
    OR: [PersonMoviesAggregationEdgeWhere!]
    NOT: PersonMoviesAggregationEdgeWhere
    nodes: MoviesAggregationWhere
    edges: ActedInAggregationEdgeWhere
}

input ActedInAggregationEdgeWhere {
    fields: ActedInAggregationWhere
    # count: IntWhere # Count edges, not required for now
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
    fulltext: FulltextSort
}

input PersonSortEdge {
    node: PersonSortNode
}

input MovieSortNode {
    id: SortDirection
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
    fulltext: FulltextSort
}

input ActedInSort {
    year: SortDirection
}

## Fulltext Types

enum MovieFulltextIndex {
    MovieTitle
}

input MovieFulltext {
    phrase: String!
    index: MovieFulltextIndex!
}

## Common types (not based on user types)

enum SortDirection {
    ASC
    DESC
}

type Fulltext {
    score: Float! # Fulltext score
}

input FulltextWhere {
    score: FloatWhere!
}

input FulltextSort {
    score: SortDirection
}

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

#### Basic Where types

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

input StringListWhere {
    AND: [StringListWhere!]
    OR: [StringListWhere!]
    NOT: StringListWhere
    all: StringWhere
    none: StringWhere
    single: StringWhere
    some: StringWhere
}
```

### Simple API

The following are the specific types that are added when the simple API is enabled:

```graphql
type Movie {
    title: String!
    alternativeTitles: [String!]
    released: Int
    actors(where: PersonWhere, sort: [PersonSortNode], offset: Int, limit: Int, directed: Boolean = true): [Person!]!
    director(where: PersonWhere, sort: [PersonSortNode], offset: Int, limit: Int, directed: Boolean = true): Person!
}

type Person {
    name: String!
    movies(where: MovieWhere, sort: [MovieSortNode], offset: Int, limit: Int, directed: Boolean = true): [Movie!]!
    directed(where: MovieWhere, sort: [MovieSortNode], offset: Int, limit: Int, directed: Boolean = true): Movie
}

## Query

type Query {
    movies(where: MovieWhere, sort: [MovieSortNode], offset: Int, limit: Int): [Movie!]!
    people(where: PersonWhere, sort: [PersonSortNode], offset: Int, limit: Int): [Person!]!
}

## Where filtering

input MovieWhere {
    OR: [MovieWhere!]
    AND: [MovieWhere!]
    NOT: MovieWhere
    title: StringWhere # Optionally, this could be a string an only support equal
    alternativeTitles: StringListWhere
    released: IntWhere
    actors: PersonListWhere
    director: PersonWhere
}

input PersonListWhere { # Should this be reused across all Person/Movie types?
    AND: [PersonListWhere!]
    OR: [PersonListWhere!]
    NOT: PersonListWhere
    all: PersonWhere
    none: PersonWhere
    single: PersonWhere
    some: PersonWhere
}

input PersonWhere {
    OR: [PersonWhere!]
    AND: [PersonWhere!]
    NOT: PersonWhere
    name: StringWhere
    movies: MovieListWhere
    directed: PersonWhere
}

input MovieListWhere {
    AND: [MovieListWhere!]
    OR: [MovieListWhere!]
    NOT: MovieListWhere
    all: MovieWhere
    none: MovieWhere
    single: MovieWhere
    some: MovieWhere
}
```

### Example queries

The following are some example queries on the previous schema:

**Filtering**

```graphql
query MoviesWithAllActorsNamedKeanuReeves {
    moviesConnection(
        where: { edges: { node: { actors: { all: { node: { name: { equals: "Keanu Reeves" } } }  } } } }
    ) {
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
```

**Aggregations**

```graphql
query MoviesTitleAndAggregation {
    moviesConnection(where: { edges: { node: { title: { contains: "Matrix" } } } }) {
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
```

**Filter Aggregations**

```graphql
query MoviesWithMoreThan10ActorNodes {
    moviesConnection(where: { edges: { node: { actors: { aggregation: { nodes: { count: { gt: 10 } } } } } } }) {
        edges {
            node {
                actors {
                    edges {
                        node {
                            name
                        }
                    }
                    aggregation {
                        nodes {
                            count
                        }
                    }
                }
            }
        }
    }
}

query MoviesWithMoreThan10ActorEdges {
    moviesConnection(where: { edges: { node: { actors: { aggregation: { nodes: { count: { gt: 10 } } } } } } }) {
        edges {
            node {
                actors {
                    edges {
                        node {
                            name
                        }
                    }
                    aggregation {
                        nodes {
                            count
                        }
                    }
                }
            }
        }
    }
}
```

**Pagination**

```graphql
query GetMoviesPaginatedIn10 {
    moviesConnection(sort: { edges: { node: { title: DESC } } }, first: 10, after: "asdf") {
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
    moviesConnection(where: { edges: { node: { title: { equals: "The Matrix" } } } }) {
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

**Fulltext**

```graphql
query TopLevelFulltextAndAggregation {
    moviesConnection(
        fulltext: { phrase: "Matrix", index: MovieTitle }
        where: { edges: { node: { released: { eq: 2001 } }, fulltext: { score: { gt: 6 } } } }
        sort: { edges: { fulltext: { score: DESC } } }
        first: 10
    ) {
        edges {
            node {
                title
            }
            fulltext {
                score
            }
        }
        aggregation {
            node {
                count
            }
        }
    }
}

query NestedFulltext {
    peopleConnection {
        edges {
            node {
                name
                movies(
                    fulltext: { phrase: "Matrix", index: MovieTitle }
                    where: { edges: { node: { released: { eq: 2001 } }, fulltext: { score: { gt: 6 } } } }
                    sort: { edges: { fulltext: { score: DESC } } }
                    first: 10
                ) {
                    edges {
                        fulltext {
                            score
                        }
                    }
                }
            }
        }
    }
}
```
