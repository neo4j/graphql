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

input GenreConnectWhere {
  node: GenreWhere!
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

type Movie {
  id: ID
  searchNoDirective: Search
  search(options: QueryOptions, where: SearchWhere): [Search]
  searchConnection(where: MovieSearchConnectionWhere): MovieSearchConnection!
}

input MovieConnectInput {
  search: MovieSearchConnectInput
}

input MovieConnectWhere {
  node: MovieWhere!
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
  search: MovieSearchCreateFieldInput
}

input MovieSearchConnectInput {
  Genre: [MovieSearchGenreConnectFieldInput!]
  Movie: [MovieSearchMovieConnectFieldInput!]
}

type MovieSearchConnection {
  edges: [MovieSearchRelationship!]!
  totalCount: Int!
  pageInfo: PageInfo!
}

input MovieSearchConnectionGenreWhere {
  OR: [MovieSearchConnectionGenreWhere]
  AND: [MovieSearchConnectionGenreWhere]
  node: GenreWhere
  node_NOT: GenreWhere
}

input MovieSearchConnectionMovieWhere {
  OR: [MovieSearchConnectionMovieWhere]
  AND: [MovieSearchConnectionMovieWhere]
  node: MovieWhere
  node_NOT: MovieWhere
}

input MovieSearchConnectionWhere {
  Genre: MovieSearchConnectionGenreWhere
  Movie: MovieSearchConnectionMovieWhere
}

input MovieSearchCreateFieldInput {
  Genre: [MovieSearchGenreCreateFieldInput!]
  Movie: [MovieSearchMovieCreateFieldInput!]
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

input MovieSearchGenreConnectFieldInput {
  where: GenreConnectWhere
}

input MovieSearchGenreConnectionWhere {
  node: GenreWhere
  node_NOT: GenreWhere
  AND: [MovieSearchGenreConnectionWhere!]
  OR: [MovieSearchGenreConnectionWhere!]
}

input MovieSearchGenreCreateFieldInput {
  node: GenreCreateInput!
}

input MovieSearchGenreDeleteFieldInput {
  where: MovieSearchGenreConnectionWhere
}

input MovieSearchGenreDisconnectFieldInput {
  where: MovieSearchGenreConnectionWhere
}

input MovieSearchGenreFieldInput {
  create: [MovieSearchGenreCreateFieldInput!]
  connect: [MovieSearchGenreConnectFieldInput!]
}

input MovieSearchGenreUpdateConnectionInput {
  node: GenreUpdateInput
}

input MovieSearchGenreUpdateFieldInput {
  where: MovieSearchGenreConnectionWhere
  update: MovieSearchGenreUpdateConnectionInput
  connect: [MovieSearchGenreConnectFieldInput!]
  disconnect: [MovieSearchGenreDisconnectFieldInput!]
  create: [MovieSearchGenreCreateFieldInput!]
  delete: [MovieSearchGenreDeleteFieldInput!]
}

input MovieSearchMovieConnectFieldInput {
  where: MovieConnectWhere
  connect: [MovieConnectInput!]
}

input MovieSearchMovieConnectionWhere {
  node: MovieWhere
  node_NOT: MovieWhere
  AND: [MovieSearchMovieConnectionWhere!]
  OR: [MovieSearchMovieConnectionWhere!]
}

input MovieSearchMovieCreateFieldInput {
  node: MovieCreateInput!
}

input MovieSearchMovieDeleteFieldInput {
  where: MovieSearchMovieConnectionWhere
  delete: MovieDeleteInput
}

input MovieSearchMovieDisconnectFieldInput {
  where: MovieSearchMovieConnectionWhere
  disconnect: MovieDisconnectInput
}

input MovieSearchMovieFieldInput {
  create: [MovieSearchMovieCreateFieldInput!]
  connect: [MovieSearchMovieConnectFieldInput!]
}

input MovieSearchMovieUpdateConnectionInput {
  node: MovieUpdateInput
}

input MovieSearchMovieUpdateFieldInput {
  where: MovieSearchMovieConnectionWhere
  update: MovieSearchMovieUpdateConnectionInput
  connect: [MovieSearchMovieConnectFieldInput!]
  disconnect: [MovieSearchMovieDisconnectFieldInput!]
  create: [MovieSearchMovieCreateFieldInput!]
  delete: [MovieSearchMovieDeleteFieldInput!]
}

type MovieSearchRelationship {
  cursor: String!
  node: Search!
}

input MovieSearchUpdateInput {
  Genre: [MovieSearchGenreUpdateFieldInput!]
  Movie: [MovieSearchMovieUpdateFieldInput!]
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
  updateGenres(where: GenreWhere, update: GenreUpdateInput): UpdateGenresMutationResponse!
  createMovies(input: [MovieCreateInput!]!): CreateMoviesMutationResponse!
  deleteMovies(where: MovieWhere, delete: MovieDeleteInput): DeleteInfo!
  updateMovies(where: MovieWhere, update: MovieUpdateInput, connect: MovieConnectInput, disconnect: MovieDisconnectInput, create: MovieRelationInput, delete: MovieDeleteInput): UpdateMoviesMutationResponse!
}

"""Pagination information (Relay)"""
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

input SearchWhere {
  Movie: MovieWhere
  Genre: GenreWhere
}

enum SortDirection {
  """Sort by field values in ascending order."""
  ASC

  """Sort by field values in descending order."""
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
