# Schema Interfaces

Tests that the provided typeDefs return the correct schema.

---

## Interfaces

### TypeDefs

```graphql
interface MovieNode @auth(rules: [{ allow: "*", operations: [READ] }]) {
    id: ID
    movies: [Movie] @relationship(type: "HAS_MOVIE", direction: OUT)
    customQuery: [Movie]
        @cypher(
            statement: """
            MATCH (m:Movie)
            RETURN m
            """
        )
}

type Movie implements MovieNode
    @auth(rules: [{ allow: "*", operations: [READ] }]) {
    id: ID
    nodes: [MovieNode]
    movies: [Movie] @relationship(type: "HAS_MOVIE", direction: OUT)
    customQuery: [Movie]
        @cypher(
            statement: """
            MATCH (m:Movie)
            RETURN m
            """
        )
}
```

### Output

```graphql
type CreateMoviesMutationResponse {
    movies: [Movie!]!
}

type DeleteInfo {
    nodesDeleted: Int!
    relationshipsDeleted: Int!
}

type Movie implements MovieNode {
    id: ID
    customQuery: [Movie]
    nodes: [MovieNode]
    movies(where: MovieWhere, options: MovieOptions): [Movie]
    moviesConnection(
        after: String
        first: Int
        where: MovieMoviesConnectionWhere
        sort: [MovieMoviesConnectionSort!]
    ): MovieMoviesConnection!
}

type MovieAggregateSelection {
    count: Int!
    id: IDAggregationSelection!
}

type IDAggregationSelection {
    max: ID!
    min: ID!
}

input MovieConnectInput {
    movies: [MovieMoviesConnectFieldInput!]
}

input MovieCreateInput {
    id: ID
    movies: MovieMoviesFieldInput
}

input MovieDeleteInput {
    movies: [MovieMoviesDeleteFieldInput!]
}

input MovieDisconnectInput {
    movies: [MovieMoviesDisconnectFieldInput!]
}

input MovieMoviesDeleteFieldInput {
    delete: MovieDeleteInput
    where: MovieMoviesConnectionWhere
}

input MovieMoviesDisconnectFieldInput {
    disconnect: MovieDisconnectInput
    where: MovieMoviesConnectionWhere
}

input MovieConnectWhere {
    node: MovieWhere!
}

input MovieMoviesConnectFieldInput {
    where: MovieConnectWhere
    connect: [MovieConnectInput!]
}

type MovieMoviesConnection {
    edges: [MovieMoviesRelationship!]!
    pageInfo: PageInfo!
    totalCount: Int!
}

input MovieMoviesConnectionSort {
    node: MovieSort
}

input MovieMoviesConnectionWhere {
    AND: [MovieMoviesConnectionWhere!]
    OR: [MovieMoviesConnectionWhere!]
    node: MovieWhere
    node_NOT: MovieWhere
}

input MovieMoviesCreateFieldInput {
    node: MovieCreateInput!
}

input MovieMoviesFieldInput {
    create: [MovieMoviesCreateFieldInput!]
    connect: [MovieMoviesConnectFieldInput!]
}

type MovieMoviesRelationship {
    cursor: String!
    node: Movie!
}

input MovieMoviesUpdateConnectionInput {
    node: MovieUpdateInput
}

input MovieMoviesUpdateFieldInput {
    where: MovieMoviesConnectionWhere
    update: MovieMoviesUpdateConnectionInput
    connect: [MovieMoviesConnectFieldInput!]
    disconnect: [MovieMoviesDisconnectFieldInput!]
    create: [MovieMoviesCreateFieldInput!]
    delete: [MovieMoviesDeleteFieldInput!]
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
    movies: [MovieMoviesCreateFieldInput!]
}

"""
Fields to sort Movies by. The order in which sorts are applied is not guaranteed when specifying many fields in one MovieSort object.
"""
input MovieSort {
    id: SortDirection
}

input MovieUpdateInput {
    id: ID
    movies: [MovieMoviesUpdateFieldInput!]
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
    movies: MovieWhere
    movies_NOT: MovieWhere
    moviesConnection: MovieMoviesConnectionWhere
    moviesConnection_NOT: MovieMoviesConnectionWhere
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

interface MovieNode {
    movies: [Movie]
    id: ID
    customQuery: [Movie]
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
    movies(where: MovieWhere, options: MovieOptions): [Movie!]!
    moviesAggregate(where: MovieWhere): MovieAggregateSelection!
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
