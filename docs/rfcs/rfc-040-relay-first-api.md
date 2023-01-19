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
        last: Int
        before: String
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
    fields: ActedIn # Fields of the relationship
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
        where: PersonConnectionWhere
        first: Int
        after: String
        last: Int
        before: String
        directed: Boolean = true
        sort: [MovieActorsConnectionSort!]
    ): MovieActorsConnection!
    director(where: MovieDirectorConnectionWhere, directed: Boolean = true): MovieDirectorConnection!
}
```

Note that this type does **not** contain any operations in itself, it has the same properties as the user-defined entity, with the only difference being the result of the nested `actors` and `director` types, that support the top-level input and return a `*Connection`.

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
    peopleConnection(where: { edges: { node: { movies: { edges: { some: { fields: { year: { gt: 1999 } } } } } } } }) {
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

Following Relay spec, every `*Connection` type has the `pageInfo` property, and each `edge` has a cursor. Note that if limit-based pagination is enabled instead of cursor based, the API will not be Relay compliant.

#### Back pagination

Following Relay spec, the fields `last` and `before` can be used instead of `first` and `after` to do backwards pagination.

### Aggregation

Aggregations have been moved to be part of the projection on connection queries:

```graphql
query ShortestMovieTitleAndCount {
    moviesConnection {
        aggregation {
            node {
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
                        node {
                            count
                        }
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

> If there is a single index, the index field could be made optional ignored

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

Sort behaves in the same fashion as the Connections API. Cursor-based pagination, however, is not supported. The simple API uses a _limit_ based pagination:

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

## Mutations

**Create**

```graphql
type Mutation {
    createMovies(edges: [MovieEdgeCreate!]!): MoviesMutationResponse!
    createPeople(edges: [PersonEdgeCreate!]!): PersonMutationResponse!
}

# Create

type MoviesMutationResponse {
    edges: [MovieMutationEdge!]!
    info: MutationInfo! 
}

type PersonMutationResponse {
    edges: [PersonMutationEdge!]!
    info: MutationInfo!
}

## Like MovieEdge but without pagination
type MovieMutationEdge {
    node: MovieMutationNode!
}

## Like PersonEdge but without pagination
type PersonMutationEdge {
    node: PersonMutationNode!
}

## Like MovieNode but without pagination
type MovieMutationNode {
    title: String!
    id: ID
    released: Int
    alternativeTitles: [String!]
    actors: MovieActorsMutationConnection!
    director: MovieDirectorMutationConnection!
}

## Like PersonNode but without pagination
type PersonMutationNode {
    name: String!
    movies: PersonMoviesMutationConnection!
    directed: PersonDirectedMutationConnection!
}

## Like MovieActorsConnection but without pagination
type MovieActorsMutationConnection {
    edges: [MovieActorsMutationEdge!]!
}

## Like MovieDirectorConnection but without pagination
type MovieDirectorMutationConnection {
    edges: [MovieDirectorMutationEdge!]!
}

## Like PersonMoviesConnection but without pagination
type PersonMoviesMutationConnection {
    edges: [PersonMoviesMutationEdge!]!
}

## Like PersonDirectedConnection but without pagination
type PersonDirectedMutationConnection {
    edges: [PersonDirectedMutationEdge!]!
}

## "Relationship" edges without pagination and fulltext

type MovieActorsMutationEdge {
    node: PersonMutationNode!
    fields: ActedIn
}

type MovieDirectorMutationEdge {
    node: PersonMutationNode!
}

type PersonMoviesMutationEdge {
    node: MovieMutationNode!
    fields: ActedIn!
}

type PersonDirectedMutationEdge {
    node: MovieMutationNode! 
}

## Generic Mutation Info

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
    alternativeTitles: [String!]
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
    where: MovieActorsEdgeWhere
    edges: MovieActorsEdgeConnect
}

input MovieActorsDisconnect {
    where: MovieActorsEdgeWhere
    edges: MovieActorsEdgeDisconnect
}

input MovieActorsDelete {
    where: MovieActorsEdgeWhere
    edges: MovieActorsEdgeDisconnect
}

input MovieDirectorConnect {
    where: MovieDirectorEdgeWhere
    edges: MovieDirectorEdgeConnect
}

input MovieDirectorDisconnect {
    where: MovieDirectorEdgeWhere
    edges: MovieDirectorEdgeDisconnect
}

input MovieDirectorDelete {
    where: MovieDirectorEdgeWhere
    edges: MovieDirectorEdgeDisconnect
}

input PersonMoviesConnect {
    where: PersonMoviesEdgeWhere
    edges: PersonMoviesEdgeConnect
}

input PersonMoviesConnectOrCreate {
    where: MoviesConnectOrCreateWhere
    edges: PersonMoviesEdgeConnect
}

input PersonDirectedConnectOrCreate {
    where: MoviesConnectOrCreateWhere
    edges: PersonDirectedEdgeConnect
}

input MoviesConnectOrCreateWhere {
    node: MovieUniqueWhere
}

input PersonMoviesDisconnect {
    where: PersonMoviesEdgeWhere
    edges: PersonMoviesEdgeDisconnect
}

input PersonMoviesDelete {
    where: PersonMoviesEdgeWhere
    edges: PersonMoviesEdgeDisconnect
}

input PersonDirectedConnect {
    where: PersonDirectedEdgeWhere
    edges: PersonDirectedEdgeConnect
}

input PersonDirectedDisconnect {
    where: PersonDirectedEdgeWhere
    edges: PersonDirectedEdgeDisconnect
}

input PersonDirectedDelete {
    where: PersonDirectedEdgeWhere
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

# ConnectOrCreate 
input MovieUniqueWhere {
    id: ID
}

# Relationship input types

input ActedInCreate {
    year: Int
}
```


**Update**

```graphql
type Mutation {
    updateMovies(where: MovieConnectionWhere, edges: [MovieEdgeUpdate!]!): MoviesMutationResponse!
    updatePeople(where: PersonConnectionWhere, edges: [PersonEdgeUpdate!]!): PersonMutationResponse!
}

# Update

## Update Input

input MovieEdgeUpdate {
    node: MovieUpdateNode
}

input PersonEdgeUpdate {
    node: PersonUpdateNode
}
# UpdateNodes

input MovieUpdateNode {
    title: String
    released: IntUpdateOperations
    alternativeTitles: StringListUpdateOperations
    actors: MovieActorsUpdateOperations
    director: MovieDirectorUpdateOperations
}

input IntUpdateOperations {
    set: Int
    increment: Int
    decrement: Int
}

input StringListUpdateOperations {
    set: Int
    pop: Int
    push: [String!]
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
    year: IntUpdateOperations
}

input PersonUpdateNode {
    name: String
    movies: PersonMoviesUpdateOperations
    directed: PersonDirectedUpdateOperations
}

input PersonMoviesUpdateOperations {
    create: PersonMoviesCreate
    update: PersonMoviesUpdate
    connect: PersonMoviesConnect
    connectOrCreate: PersonMoviesConnectOrCreate
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
    connectOrCreate: PersonDirectedConnectOrCreate
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
# Delete Mutaions

```graphql
# Delete operations

type Mutation {
    deleteMovies(where: MovieConnectionWhere, edges: [MovieEdgeDelete!]!): DeleteMutationResponse!
    deletePeople(where: PersonConnectionWhere, edges: [PersonEdgeDelete!]!): DeleteMutationResponse!
}

type DeleteMutationResponse {
    info: MutationInfo! 
}

input MovieEdgeDelete {
    node: MovieEdgeDeleteNode

}
input MovieEdgeDeleteNode {
    actors: MovieActorsDelete
    director: MovieDirectorDelete
}

input PersonEdgeDelete {
    node: PersonEdgeDeleteNode
}

input PersonEdgeDeleteNode {
    actors: MovieActorsDelete
    director: MovieDirectorDelete
}
```

### Mutations examples

```graphql
mutation CreateMovie {
    createMovies( edges: { node: { title: "The Matrix" } } ) {
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
    edges: {
      node: {
        title: { equals: "The Matrix" }
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
            where: { edges: { node: { name: { equals: "Keanu" } } } }
            edges: {
              fields: { year: 1999 }
              node: {
                movies: {
                  # create: {}
                  connect: {
                    where: {
                      edges: { node: { title: { equals: "The Matrix 2" } } }
                    }
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


## Naming conventions

These are some loose conventions on type and input naming:

-   `Connection`: Types containing `edges` and following Relay spec.
-   `Edge`: Types containing `node` and, optionally, fields
-   `Where`: Filtering Types
-   `Aggregation`: Aggregation Types

*   Types in a relationship will follow the convention `[RootType][fieldName]` at the beginning.
*   Where possible, input types will mirror normal types. E.g. `PersonNode` will be filtered by `PersonNodeWhere`

### Further discussion points

-   Connections may have a `nodes` fields as a shortcut without passing through `edges`
-   Node aggregation vs edge aggregation
-   Sort by aggregations and 1-\* relationship
-   Union / interfaces
-   Update operations
-   Mutations return "...Connection" types? cursor is returned in the Connection types, so maybe is worth having separated types
-   Sorting on mutation responses?
-   Same operations regardless of how you got through traversal in mutation
-   UpdateOrCreate / CreateOrUpdate
-   ConnectOrCreate missing in the nested Connect operation
-   Should ID types should belong to aggregation and reusing and share the same filtering operators as it is now?
-   Should ID types be modifiable? or not?
-   For the ConnectOrCreate purpose should the type MovieUniqueWhere be a generic type and not related to Movie?
-   As ConnectOrCreate works only based on the node uniqueness property, it has no sense to pass from the edges in the where condition, Although this is inconsistent with the input structure of the other operations.


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
        where: PersonConnectionWhere
        first: Int
        after: String
        last: Int
        before: String
        directed: Boolean = true
        sort: [MovieActorsConnectionSort!]
    ): MovieActorsConnection!
    director(
        where: MovieDirectorConnectionWhere
        directed: Boolean = true # Cannot sort 1-1 relationship
    ): MovieDirectorConnection!
}

type PersonNode {
    name: String!
    movies(
        where: MovieConnectionWhere
        first: Int
        after: String
        directed: Boolean = true
        sort: [PersonMoviesConnectionSort!]
        fulltext: MovieFulltext
    ): PersonMoviesConnection!
    directed(where: PersonDirectedConnectionWhere, directed: Boolean = true): PersonDirectedConnection!
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
    id: ID
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
    id: StringWhere
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
        where: { edges: { node: { actors: { edges: { all: { node: { name: { equals: "Keanu Reeves" } } } } } } } }
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
    moviesConnection(where: { edges: { node: { actors: { aggregation: { node: { count: { gt: 10 } } } } } } }) {
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
    moviesConnection(where: { edges: { node: { actors: { aggregation: { count: { gt: 10 } } } } } }) {
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
    moviesConnection(where: { edges: { node: { title: { equal: "The Matrix" } } } }) {
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
