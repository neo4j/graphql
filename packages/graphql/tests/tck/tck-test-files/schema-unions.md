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
    search: [Search] @relationship(type: "SEARCH", direction: "OUT")
    searchNoDirective: Search
}
```

**Output**

```schema-output
union Search = Movie | Genre

type DeleteInfo {
  nodesDeleted: Int!
  relationshipsDeleted: Int!
}

type Genre {
  id: ID
}

input GenreConnectFieldInput {
  where: GenreWhere
}

input GenreCreateInput {
  id: ID
}

input GenreDisconnectFieldInput {
  where: GenreWhere
}

input GenreOptions {
  sort: [GenreSort]
  limit: Int
  skip: Int
}

enum GenreSort {
  id_DESC
  id_ASC
}

input GenreUpdateInput {
  id: ID
}

input GenreWhere {
  OR: [GenreWhere]
  AND: [GenreWhere]
  id: ID
  id_IN: [ID]
  id_NOT: ID
  id_NOT_IN: [ID]
  id_CONTAINS: ID
  id_NOT_CONTAINS: ID
  id_STARTS_WITH: ID
  id_NOT_STARTS_WITH: ID
  id_ENDS_WITH: ID
  id_NOT_ENDS_WITH: ID
  id_MATCHES: String
}

type Movie {
  id: ID
  search(options: QueryOptions, Genre: GenreWhere, Movie: MovieWhere): [Search]
  searchNoDirective: Search
}

input MovieConnectFieldInput {
  where: MovieWhere
  connect: MovieConnectInput
}

input MovieConnectInput {
  search_Genre: [GenreConnectFieldInput]
  search_Movie: [MovieConnectFieldInput]
}

input MovieCreateInput {
  id: ID
  search_Genre: MovieSearchGenreFieldInput
  search_Movie: MovieSearchMovieFieldInput
}

input MovieDisconnectFieldInput {
  where: MovieWhere
  disconnect: MovieDisconnectInput
}

input MovieDisconnectInput {
  search_Genre: [GenreDisconnectFieldInput]
  search_Movie: [MovieDisconnectFieldInput]
}

input MovieOptions {
  sort: [MovieSort]
  limit: Int
  skip: Int
}

input MovieRelationInput {
  search_Genre: [GenreCreateInput]
  search_Movie: [MovieCreateInput]
}

input MovieSearchGenreFieldInput {
  create: [GenreCreateInput]
  connect: [GenreConnectFieldInput]
}

input MovieSearchGenreUpdateFieldInput {
  where: GenreWhere
  update: GenreUpdateInput
  connect: [GenreConnectFieldInput]
  disconnect: [GenreDisconnectFieldInput]
  create: [GenreCreateInput]
  delete: [GenreDeleteFieldInput]
}

input MovieSearchMovieFieldInput {
  create: [MovieCreateInput]
  connect: [MovieConnectFieldInput]
}

input GenreDeleteFieldInput {
  where: GenreWhere
}

input MovieDeleteFieldInput {
  delete: MovieDeleteInput
  where: MovieWhere
}

input MovieSearchMovieUpdateFieldInput {
  where: MovieWhere
  update: MovieUpdateInput
  connect: [MovieConnectFieldInput]
  disconnect: [MovieDisconnectFieldInput]
  create: [MovieCreateInput]
  delete: [MovieDeleteFieldInput]
}

enum MovieSort {
  id_DESC
  id_ASC
}

input MovieUpdateInput {
  id: ID
  search_Genre: [MovieSearchGenreUpdateFieldInput]
  search_Movie: [MovieSearchMovieUpdateFieldInput]
}

input MovieSearchGenreDeleteInput {
  where: GenreWhere
}

input MovieSearchMovieDeleteInput {
  where: MovieWhere
  delete: MovieDeleteInput
}

input MovieDeleteInput {
  search_Genre: [MovieSearchGenreDeleteInput]
  search_Movie: [MovieSearchMovieDeleteInput]
}

input MovieWhere {
  OR: [MovieWhere]
  AND: [MovieWhere]
  id: ID
  id_IN: [ID]
  id_NOT: ID
  id_NOT_IN: [ID]
  id_CONTAINS: ID
  id_NOT_CONTAINS: ID
  id_STARTS_WITH: ID
  id_NOT_STARTS_WITH: ID
  id_ENDS_WITH: ID
  id_NOT_ENDS_WITH: ID
  id_MATCHES: String
}

type CreateMoviesMutationResponse {
  movies: [Movie!]!
}

type UpdateMoviesMutationResponse {
  movies: [Movie!]!
}

type CreateGenresMutationResponse {
  genres: [Genre!]!
}

type UpdateGenresMutationResponse {
  genres: [Genre!]!
}

type Mutation {
  createGenres(input: [GenreCreateInput]!): CreateGenresMutationResponse!
  deleteGenres(where: GenreWhere): DeleteInfo!
  updateGenres(where: GenreWhere, update: GenreUpdateInput): UpdateGenresMutationResponse!
  createMovies(input: [MovieCreateInput]!): CreateMoviesMutationResponse!
  deleteMovies(
    where: MovieWhere
    delete: MovieDeleteInput
  ): DeleteInfo!
  updateMovies(
    where: MovieWhere
    update: MovieUpdateInput
    connect: MovieConnectInput
    disconnect: MovieDisconnectInput
    create: MovieRelationInput
    delete: MovieDeleteInput
  ): UpdateMoviesMutationResponse!
}

type Query {
  genres(where: GenreWhere, options: GenreOptions): [Genre]!
  movies(where: MovieWhere, options: MovieOptions): [Movie]!
}

input QueryOptions {
  skip: Int
  limit: Int
}
```

---
