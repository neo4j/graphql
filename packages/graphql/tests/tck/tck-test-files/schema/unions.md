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
    skip: Int
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

type Movie {
    id: ID
    searchNoDirective: Search
    search(
        options: QueryOptions
        Genre: GenreWhere
        Movie: MovieWhere
    ): [Search]
    searchConnection(where: MovieSearchConnectionWhere): MovieSearchConnection!
}

input MovieConnectInput {
    search_Genre: [MovieSearchConnectFieldInput!]
    search_Movie: [MovieSearchConnectFieldInput!]
}

input MovieCreateInput {
    id: ID
    search_Genre: MovieSearchGenreFieldInput
    search_Movie: MovieSearchMovieFieldInput
}

input MovieDeleteInput {
    search_Genre: [MovieSearchGenreDeleteFieldInput!]
    search_Movie: [MovieSearchMovieDeleteFieldInput!]
}

input MovieDisconnectInput {
    search_Genre: [MovieSearchGenreDisconnectFieldInput!]
    search_Movie: [MovieSearchMovieDisconnectFieldInput!]
}

input MovieOptions {
    """
    Specify one or more MovieSort objects to sort Movies by. The sorts will be applied in the order in which they are arranged in the array.
    """
    sort: [MovieSort]
    limit: Int
    skip: Int
}

input MovieRelationInput {
    search_Genre: [MovieSearchGenreCreateFieldInput!]
    search_Movie: [MovieSearchMovieCreateFieldInput!]
}

input MovieSearchConnectFieldInput {
    where: GenreWhere
}

type MovieSearchConnection {
    edges: [MovieSearchRelationship!]!
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

input MovieSearchGenreUpdateFieldInput {
    where: MovieSearchConnectionWhere
    update: GenreUpdateInput
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

input MovieSearchMovieUpdateFieldInput {
    where: MovieSearchConnectionWhere
    update: MovieUpdateInput
    connect: [MovieSearchConnectFieldInput!]
    disconnect: [MovieSearchMovieDisconnectFieldInput!]
    create: [MovieSearchMovieCreateFieldInput!]
    delete: [MovieSearchMovieDeleteFieldInput!]
}

type MovieSearchRelationship {
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
    search_Genre: [MovieSearchGenreUpdateFieldInput!]
    search_Movie: [MovieSearchMovieUpdateFieldInput!]
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

"""Globally-identifiable node (Relay)"""
interface Node {
    id: ID!
}

type Query {
    genres(where: GenreWhere, options: GenreOptions): [Genre!]!
    movies(where: MovieWhere, options: MovieOptions): [Movie!]!
    node(id: ID!): Node!
}

input QueryOptions {
    skip: Int
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
