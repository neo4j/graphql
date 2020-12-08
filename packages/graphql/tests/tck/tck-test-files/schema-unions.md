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

input GenreAND {
  OR: [GenreOR]
  AND: [GenreAND]
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
  id_REGEX: String
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

input GenreOR {
  OR: [GenreOR]
  AND: [GenreAND]
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
  id_REGEX: String
}

enum GenreSort {
  id_DESC
  id_ASC
}

input GenreUpdateInput {
  id: ID
}

input GenreWhere {
  OR: [GenreOR]
  AND: [GenreAND]
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
  id_REGEX: String
}

type Movie {
  id: ID
  search(options: QueryOptions, Genre: GenreWhere, Movie: MovieWhere): [Search]
  searchNoDirective: Search
}

input MovieAND {
  OR: [MovieOR]
  AND: [MovieAND]
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
  id_REGEX: String
  search_Genre: GenreWhere
  search_Genre_NOT: GenreWhere
  search_Genre_IN: [GenreWhere]
  search_Genre_NOT_IN: [GenreWhere]
  search_Movie: MovieWhere
  search_Movie_NOT: MovieWhere
  search_Movie_IN: [MovieWhere]
  search_Movie_NOT_IN: [MovieWhere]
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

input MovieOR {
  OR: [MovieOR]
  AND: [MovieAND]
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
  id_REGEX: String
  search_Genre: GenreWhere
  search_Genre_NOT: GenreWhere
  search_Genre_IN: [GenreWhere]
  search_Genre_NOT_IN: [GenreWhere]
  search_Movie: MovieWhere
  search_Movie_NOT: MovieWhere
  search_Movie_IN: [MovieWhere]
  search_Movie_NOT_IN: [MovieWhere]
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
}

input MovieSearchMovieFieldInput {
  create: [MovieCreateInput]
  connect: [MovieConnectFieldInput]
}

input MovieSearchMovieUpdateFieldInput {
  where: MovieWhere
  update: MovieUpdateInput
  connect: [MovieConnectFieldInput]
  disconnect: [MovieDisconnectFieldInput]
  create: [MovieCreateInput]
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

input MovieWhere {
  OR: [MovieOR]
  AND: [MovieAND]
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
  id_REGEX: String
  search_Genre: GenreWhere
  search_Genre_NOT: GenreWhere
  search_Genre_IN: [GenreWhere]
  search_Genre_NOT_IN: [GenreWhere]
  search_Movie: MovieWhere
  search_Movie_NOT: MovieWhere
  search_Movie_IN: [MovieWhere]
  search_Movie_NOT_IN: [MovieWhere]
}

type Mutation {
  createGenres(input: [GenreCreateInput]!): [Genre]!
  deleteGenres(where: GenreWhere): DeleteInfo!
  updateGenres(where: GenreWhere, update: GenreUpdateInput): [Genre]!
  createMovies(input: [MovieCreateInput]!): [Movie]!
  deleteMovies(where: MovieWhere): DeleteInfo!
  updateMovies(
    where: MovieWhere
    update: MovieUpdateInput
    connect: MovieConnectInput
    disconnect: MovieDisconnectInput
    create: MovieRelationInput
  ): [Movie]!
}

type Query {
  Genres(where: GenreWhere, options: GenreOptions): [Genre]!
  Movies(where: MovieWhere, options: MovieOptions): [Movie]!
}

input QueryOptions {
  skip: Int
  limit: Int
}
```

---



