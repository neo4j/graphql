## Schema Simple

Tests that the provided typeDefs return the correct schema.

---

### Simple

**TypeDefs**

```typedefs-input
"A custom scalar."
scalar CustomScalar

"An enumeration of movie genres."
enum Genre {
  ACTION
  DRAMA
  ROMANCE
}

"""
A type describing a movie.
"""
type Movie {
  id: ID
  "The number of actors who acted in the movie."
  actorCount: Int
  """
  The average rating for the movie.
  """
  averageRating: Float
  """
  Is the movie active?

  This is measured based on annual profit.
  """
  isActive: Boolean
  genre: Genre
  customScalar: CustomScalar
}
```

**Output**

```schema-output
"""A custom scalar."""
scalar CustomScalar

"""An enumeration of movie genres."""
enum Genre {
  ACTION
  DRAMA
  ROMANCE
}

"""A type describing a movie."""
type Movie {
  id: ID
  """The number of actors who acted in the movie."""
  actorCount: Int
  """The average rating for the movie."""
  averageRating: Float
  """
  Is the movie active?

  This is measured based on annual profit.
  """
  isActive: Boolean
  customScalar: CustomScalar
  genre: Genre
}

type DeleteInfo {
  nodesDeleted: Int!
  relationshipsDeleted: Int!
}

enum SortDirection {
  """Sort by field values in ascending order."""
  ASC
  """Sort by field values in descending order."""
  DESC
}

input MovieCreateInput {
  id: ID
  actorCount: Int
  averageRating: Float
  isActive: Boolean
  customScalar: CustomScalar
  genre: Genre
}

input MovieOptions {
  """Specify one or more MovieSort objects to sort Movies by. The sorts will be applied in the order in which they are arranged in the array."""
sort: [MovieSort]
  limit: Int
  skip: Int
}

"""Fields to sort Movies by. The order in which sorts are applied is not guaranteed when specifying many fields in one MovieSort object."""
input MovieSort {
  id: SortDirection
  actorCount: SortDirection
  averageRating: SortDirection
  customScalar: SortDirection
  genre: SortDirection
  isActive: SortDirection
}

input MovieWhere {
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
  actorCount: Int
  actorCount_IN: [Int]
  actorCount_NOT: Int
  actorCount_NOT_IN: [Int]
  actorCount_LT: Int
  actorCount_LTE: Int
  actorCount_GT: Int
  actorCount_GTE: Int
  averageRating: Float
  averageRating_IN: [Float]
  averageRating_NOT: Float
  averageRating_NOT_IN: [Float]
  customScalar: CustomScalar
  genre: Genre
  genre_IN: [Genre]
  genre_NOT: Genre
  genre_NOT_IN: [Genre]
  averageRating_LT: Float
  averageRating_LTE: Float
  averageRating_GT: Float
  averageRating_GTE: Float
  isActive: Boolean
  isActive_NOT: Boolean
  OR: [MovieWhere!]
  AND: [MovieWhere!]
}

input MovieUpdateInput {
  id: ID
  actorCount: Int
  averageRating: Float
  isActive: Boolean
  customScalar: CustomScalar
  genre: Genre
}

type CreateMoviesMutationResponse {
  movies: [Movie!]!
}

type UpdateMoviesMutationResponse {
  movies: [Movie!]!
}

type Mutation {
  createMovies(input: [MovieCreateInput!]!): CreateMoviesMutationResponse!
  deleteMovies(where: MovieWhere): DeleteInfo!
  updateMovies(where: MovieWhere, update: MovieUpdateInput): UpdateMoviesMutationResponse!
}

type Query {
  movies(where: MovieWhere, options: MovieOptions): [Movie]!
}
```

---
