## Schema Unions

Tests that the provided typeDefs return the correct schema.

---

### Unions

**TypeDefs**

```typedefs-input
union Search = Movie | Genre

type Genre {
    id: ID
}

type Movie {
    id: ID
    search: [Search] @relationship(type: "SEARCH", direction: OUT)
    searchNoDirective: Search
}
```

**Output**

```schema-output
type CreateGenresMutationResponse {
    genres: [Genre!]!
}

type CreateMoviesMutationResponse {
    movies: [Movie!]!
}

type DeleteInfo {
    nodesDeleted: Int!
    relationshipsDeleted: Int!
}

type Genre {
    id: ID
}

input GenreCreateInput {
    id: ID
}

input GenreOptions {
    """
    Specify one or more GenreSort objects to sort Genres by. The sorts will be applied in the order in which they are arranged in the array.
    """
    sort: [GenreSort]
    limit: Int
    offset: Int
}

"""
Fields to sort Genres by. The order in which sorts are applied is not guaranteed when specifying many fields in one GenreSort object.
"""
input GenreSort {
    id: SortDirection
}

input GenreUpdateInput {
    id: ID
}

input GenreWhere {
    OR: [GenreWhere!]
    AND: [GenreWhere!]
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
}

input SearchWhere {
    Genre: GenreWhere
    Movie: MovieWhere
}

type Movie {
    id: ID
    searchNoDirective: Search
    search(options: QueryOptions, where: SearchWhere): [Search]
    searchConnection(where: MovieSearchConnectionWhere): MovieSearchConnection!
}

input MovieConnectInput {
    search: MovieSearchConnectInput
}

input MovieCreateInput {
    id: ID
    search: MovieSearchCreateInput
}

input MovieDeleteInput {
    search: MovieSearchDeleteInput
}

input MovieDisconnectInput {
    search: MovieSearchDisconnectInput
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
    search: MovieSearchCreateInput
}

input GenreConnectWhere {
    node: GenreWhere!
}

input MovieSearchConnectFieldInput {
    where: GenreConnectWhere
}

type MovieSearchConnection {
    edges: [MovieSearchRelationship!]!
    pageInfo: PageInfo!
    totalCount: Int!
}

input MovieSearchConnectionWhere {
    AND: [MovieSearchConnectionWhere!]
    OR: [MovieSearchConnectionWhere!]
    Genre: GenreWhere
    Genre_NOT: GenreWhere
    Movie: MovieWhere
    Movie_NOT: MovieWhere
}

input MovieSearchGenreCreateFieldInput {
    node: GenreCreateInput!
}

input MovieSearchConnectInput {
    Genre: [MovieSearchConnectFieldInput!]
}

input MovieSearchCreateInput {
    Genre: MovieSearchGenreFieldInput
    Movie: MovieSearchMovieFieldInput
}

input MovieSearchDeleteInput {
    Genre: [MovieSearchGenreDeleteFieldInput!]
    Movie: [MovieSearchMovieDeleteFieldInput!]
}

input MovieSearchDisconnectInput {
    Genre: [MovieSearchGenreDisconnectFieldInput!]
    Movie: [MovieSearchMovieDisconnectFieldInput!]
}

input MovieSearchUpdateInput {
    Genre: [MovieSearchGenreUpdateFieldInput!]
    Movie: [MovieSearchMovieUpdateFieldInput!]
}

input MovieSearchGenreConnectionWhere {
    node: GenreWhere
    node_NOT: GenreWhere
    AND: [MovieSearchGenreConnectionWhere!]
    OR: [MovieSearchGenreConnectionWhere!]
}

input MovieSearchGenreDisconnectFieldInput {
    where: MovieSearchGenreConnectionWhere
}

input MovieSearchGenreDeleteFieldInput {
    where: MovieSearchGenreConnectionWhere
}

input MovieSearchGenreFieldInput {
    create: [MovieSearchGenreCreateFieldInput!]
    connect: [MovieSearchConnectFieldInput!]
}

input MovieSearchGenreUpdateConnectionInput {
    node: GenreUpdateInput
}

input MovieSearchGenreUpdateFieldInput {
    where: MovieSearchConnectionWhere
    update: MovieSearchGenreUpdateConnectionInput
    connect: [MovieSearchConnectFieldInput!]
    disconnect: [MovieSearchGenreDisconnectFieldInput!]
    create: [MovieSearchGenreCreateFieldInput!]
    delete: [MovieSearchGenreDeleteFieldInput!]
}

input MovieSearchMovieCreateFieldInput {
    node: MovieCreateInput!
}

input MovieSearchMovieConnectionWhere {
    node: MovieWhere
    node_NOT: MovieWhere
    AND: [MovieSearchMovieConnectionWhere!]
    OR: [MovieSearchMovieConnectionWhere!]
}

input MovieSearchMovieDisconnectFieldInput {
    where: MovieSearchMovieConnectionWhere
    disconnect: MovieDisconnectInput
}

input MovieSearchMovieDeleteFieldInput {
    where: MovieSearchMovieConnectionWhere
    delete: MovieDeleteInput
}

input MovieSearchMovieFieldInput {
    create: [MovieSearchMovieCreateFieldInput!]
    connect: [MovieSearchConnectFieldInput!]
}

input MovieSearchMovieUpdateConnectionInput {
    node: MovieUpdateInput
}

input MovieSearchMovieUpdateFieldInput {
    where: MovieSearchConnectionWhere
    update: MovieSearchMovieUpdateConnectionInput
    connect: [MovieSearchConnectFieldInput!]
    disconnect: [MovieSearchMovieDisconnectFieldInput!]
    create: [MovieSearchMovieCreateFieldInput!]
    delete: [MovieSearchMovieDeleteFieldInput!]
}

type MovieSearchRelationship {
    cursor: String!
    node: Search!
}

"""
Fields to sort Movies by. The order in which sorts are applied is not guaranteed when specifying many fields in one MovieSort object.
"""
input MovieSort {
    id: SortDirection
}

input MovieUpdateInput {
    id: ID
    search: MovieSearchUpdateInput
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
}

type Mutation {
    createGenres(input: [GenreCreateInput!]!): CreateGenresMutationResponse!
    deleteGenres(where: GenreWhere): DeleteInfo!
    updateGenres(
        where: GenreWhere
        update: GenreUpdateInput
    ): UpdateGenresMutationResponse!
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
    genres(where: GenreWhere, options: GenreOptions): [Genre!]!
    movies(where: MovieWhere, options: MovieOptions): [Movie!]!
}

input QueryOptions {
    offset: Int
    limit: Int
}

union Search = Movie | Genre

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

type UpdateGenresMutationResponse {
    genres: [Genre!]!
}

type UpdateMoviesMutationResponse {
    movies: [Movie!]!
}
```

---
