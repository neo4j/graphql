## Schema Cypher Directive

Tests that the provided typeDefs return the correct schema (with `@exclude` directives).

---

### Using `@exclude` directive to skip generation of Query

**TypeDefs**

```typedefs-input
type Actor @exclude(operations: ["read"]) {
  name: String
}

type Movie {
  title: String
}
```

**Output**

```schema-output

type Actor {
  name: String
}

input ActorCreateInput {
  name: String
}

input ActorUpdateInput {
  name: String
}

input ActorWhere {
  OR: [ActorWhere!]
  AND: [ActorWhere!]
  name: String
  name_IN: [String]
  name_NOT: String
  name_NOT_IN: [String]
  name_CONTAINS: String
  name_NOT_CONTAINS: String
  name_STARTS_WITH: String
  name_NOT_STARTS_WITH: String
  name_ENDS_WITH: String
  name_NOT_ENDS_WITH: String
  name_MATCHES: String
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

type Movie {
  title: String
}

input MovieCreateInput {
  title: String
}

input MovieOptions {
  """Specify one or more MovieSort objects to sort Movies by. The sorts will be applied in the order in which they are arranged in the array."""
sort: [MovieSort]
  limit: Int
  skip: Int
}

"""Fields to sort Movies by. The order in which sorts are applied is not guaranteed when specifying many fields in one MovieSort object."""
input MovieSort {
  title: SortDirection
}

input MovieUpdateInput {
  title: String
}

input MovieWhere {
  OR: [MovieWhere!]
  AND: [MovieWhere!]
  title: String
  title_IN: [String]
  title_NOT: String
  title_NOT_IN: [String]
  title_CONTAINS: String
  title_NOT_CONTAINS: String
  title_STARTS_WITH: String
  title_NOT_STARTS_WITH: String
  title_ENDS_WITH: String
  title_NOT_ENDS_WITH: String
  title_MATCHES: String
}

type CreateMoviesMutationResponse {
  movies: [Movie!]!
}

type UpdateMoviesMutationResponse {
  movies: [Movie!]!
}

type CreateActorsMutationResponse {
  actors: [Actor!]!
}

type UpdateActorsMutationResponse {
  actors: [Actor!]!
}

type Mutation {
  createActors(input: [ActorCreateInput!]!): CreateActorsMutationResponse!
  deleteActors(where: ActorWhere): DeleteInfo!
  updateActors(where: ActorWhere, update: ActorUpdateInput): UpdateActorsMutationResponse!
  createMovies(input: [MovieCreateInput!]!): CreateMoviesMutationResponse!
  deleteMovies(where: MovieWhere): DeleteInfo!
  updateMovies(where: MovieWhere, update: MovieUpdateInput): UpdateMoviesMutationResponse!
}

type Query {
  movies(where: MovieWhere, options: MovieOptions): [Movie]!
}
```

---

### Using `@exclude` directive to skip generator of Mutation

**TypeDefs**

```typedefs-input
type Actor @exclude(operations: ["create"]) {
  name: String
}
```

**Output**

```schema-output
type Actor {
  name: String
}

input ActorOptions {
  """Specify one or more ActorSort objects to sort Actors by. The sorts will be applied in the order in which they are arranged in the array."""
sort: [ActorSort]
  limit: Int
  skip: Int
}

"""Fields to sort Actors by. The order in which sorts are applied is not guaranteed when specifying many fields in one ActorSort object."""
input ActorSort {
  name: SortDirection
}

input ActorUpdateInput {
  name: String
}

input ActorWhere {
  OR: [ActorWhere!]
  AND: [ActorWhere!]
  name: String
  name_IN: [String]
  name_NOT: String
  name_NOT_IN: [String]
  name_CONTAINS: String
  name_NOT_CONTAINS: String
  name_STARTS_WITH: String
  name_NOT_STARTS_WITH: String
  name_ENDS_WITH: String
  name_NOT_ENDS_WITH: String
  name_MATCHES: String
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

type UpdateActorsMutationResponse {
  actors: [Actor!]!
}

type Mutation {
  deleteActors(where: ActorWhere): DeleteInfo!
  updateActors(where: ActorWhere, update: ActorUpdateInput): UpdateActorsMutationResponse!
}

type Query {
  actors(where: ActorWhere, options: ActorOptions): [Actor]!
}
```

---

### Using `@exclude` directive with `"*"` skips generation of all Queries and Mutations and removes the type itself if not referenced elsewhere

**TypeDefs**

```typedefs-input
type Actor @exclude(operations: "*") {
  name: String
}

type Movie {
  title: String
}
```

**Output**

```schema-output
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

type Movie {
  title: String
}

input MovieCreateInput {
  title: String
}

input MovieOptions {
  """Specify one or more MovieSort objects to sort Movies by. The sorts will be applied in the order in which they are arranged in the array."""
sort: [MovieSort]
  limit: Int
  skip: Int
}

"""Fields to sort Movies by. The order in which sorts are applied is not guaranteed when specifying many fields in one MovieSort object."""
input MovieSort {
  title: SortDirection
}

input MovieUpdateInput {
  title: String
}

input MovieWhere {
  OR: [MovieWhere!]
  AND: [MovieWhere!]
  title: String
  title_IN: [String]
  title_NOT: String
  title_NOT_IN: [String]
  title_CONTAINS: String
  title_NOT_CONTAINS: String
  title_STARTS_WITH: String
  title_NOT_STARTS_WITH: String
  title_ENDS_WITH: String
  title_NOT_ENDS_WITH: String
  title_MATCHES: String
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

### Using `@exclude` directive with `"*"` skips generation of all Queries and Mutations but retains the type itself if referenced elsewhere

**TypeDefs**

```typedefs-input
type Actor @exclude(operations: "*") {
  name: String
}

type Movie {
  title: String
}

type Query {
  customActorQuery: Actor
}
```

**Output**

```schema-output
type Actor {
  name: String
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

type Movie {
  title: String
}

input MovieCreateInput {
  title: String
}

input MovieOptions {
  """Specify one or more MovieSort objects to sort Movies by. The sorts will be applied in the order in which they are arranged in the array."""
sort: [MovieSort]
  limit: Int
  skip: Int
}

"""Fields to sort Movies by. The order in which sorts are applied is not guaranteed when specifying many fields in one MovieSort object."""
input MovieSort {
  title: SortDirection
}

input MovieUpdateInput {
  title: String
}

input MovieWhere {
  OR: [MovieWhere!]
  AND: [MovieWhere!]
  title: String
  title_IN: [String]
  title_NOT: String
  title_NOT_IN: [String]
  title_CONTAINS: String
  title_NOT_CONTAINS: String
  title_STARTS_WITH: String
  title_NOT_STARTS_WITH: String
  title_ENDS_WITH: String
  title_NOT_ENDS_WITH: String
  title_MATCHES: String
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
  customActorQuery: Actor
  movies(where: MovieWhere, options: MovieOptions): [Movie]!
}
```

---

### Using `@exclude` directive with `"*"` skips generation of all Queries and Mutations but retains the type itself if referenced in a `@relationship` directive

**TypeDefs**

```typedefs-input
type Actor @exclude(operations: "*") {
  name: String
}

type Movie {
  title: String
  actors: [Actor] @relationship(type: "ACTED_IN", direction: "IN")
}
```

**Output**

```schema-output
enum SortDirection {
  """Sort by field values in ascending order."""
  ASC
  """Sort by field values in descending order."""
  DESC
}

type Actor {
  name: String
}

input ActorConnectFieldInput {
  where: ActorWhere
}

input ActorCreateInput {
  name: String
}

input ActorDisconnectFieldInput {
  where: ActorWhere
}

input ActorOptions {
  """Specify one or more ActorSort objects to sort Actors by. The sorts will be applied in the order in which they are arranged in the array."""
sort: [ActorSort]
  limit: Int
  skip: Int
}

"""Fields to sort Actors by. The order in which sorts are applied is not guaranteed when specifying many fields in one ActorSort object."""
input ActorSort {
  name: SortDirection
}

input ActorUpdateInput {
  name: String
}

input ActorWhere {
  OR: [ActorWhere!]
  AND: [ActorWhere!]
  name: String
  name_IN: [String]
  name_NOT: String
  name_NOT_IN: [String]
  name_CONTAINS: String
  name_NOT_CONTAINS: String
  name_STARTS_WITH: String
  name_NOT_STARTS_WITH: String
  name_ENDS_WITH: String
  name_NOT_ENDS_WITH: String
  name_MATCHES: String
}

type DeleteInfo {
  nodesDeleted: Int!
  relationshipsDeleted: Int!
}

type Movie {
  title: String
  actors(options: ActorOptions, where: ActorWhere): [Actor]
}

input MovieActorsFieldInput {
  connect: [ActorConnectFieldInput!]
  create: [ActorCreateInput!]
}

input ActorDeleteFieldInput {
  where: ActorWhere
}

input MovieActorsUpdateFieldInput {
  connect: [ActorConnectFieldInput!]
  create: [ActorCreateInput!]
  disconnect: [ActorDisconnectFieldInput!]
  update: ActorUpdateInput
  where: ActorWhere
  delete: [ActorDeleteFieldInput!]
}

input MovieConnectInput {
  actors: [ActorConnectFieldInput!]
}

input MovieCreateInput {
  actors: MovieActorsFieldInput
  title: String
}

input MovieDisconnectInput {
  actors: [ActorDisconnectFieldInput!]
}

input MovieOptions {
  """Specify one or more MovieSort objects to sort Movies by. The sorts will be applied in the order in which they are arranged in the array."""
sort: [MovieSort]
  limit: Int
  skip: Int
}

input MovieRelationInput {
  actors: [ActorCreateInput!]
}

input MovieActorsDeleteInput {
  where: ActorWhere
}

input MovieDeleteInput {
  actors: [MovieActorsDeleteInput!]
}

"""Fields to sort Movies by. The order in which sorts are applied is not guaranteed when specifying many fields in one MovieSort object."""
input MovieSort {
  title: SortDirection
}

input MovieUpdateInput {
  actors: [MovieActorsUpdateFieldInput!]
  title: String
}

input MovieWhere {
  actors: ActorWhere
  actors_NOT: ActorWhere
  OR: [MovieWhere!]
  AND: [MovieWhere!]
  title: String
  title_IN: [String]
  title_NOT: String
  title_NOT_IN: [String]
  title_CONTAINS: String
  title_NOT_CONTAINS: String
  title_STARTS_WITH: String
  title_NOT_STARTS_WITH: String
  title_ENDS_WITH: String
  title_NOT_ENDS_WITH: String
  title_MATCHES: String
}

type CreateMoviesMutationResponse {
  movies: [Movie!]!
}

type UpdateMoviesMutationResponse {
  movies: [Movie!]!
}

type Mutation {
  createMovies(input: [MovieCreateInput!]!): CreateMoviesMutationResponse!
  deleteMovies(
    where: MovieWhere
    delete: MovieDeleteInput
  ): DeleteInfo!
  updateMovies(
    connect: MovieConnectInput
    create: MovieRelationInput
    disconnect: MovieDisconnectInput
    update: MovieUpdateInput
    where: MovieWhere
    delete: MovieDeleteInput
  ): UpdateMoviesMutationResponse!
}

type Query {
  movies(where: MovieWhere, options: MovieOptions): [Movie]!
}
```

---

### Ensure generation doesn't break if `@exclude` is provided with an empty array

**TypeDefs**

```typedefs-input
type Actor @exclude(operations: []) {
  name: String
}
```

**Output**

```schema-output
enum SortDirection {
  """Sort by field values in ascending order."""
  ASC
  """Sort by field values in descending order."""
  DESC
}

type Actor {
  name: String
}

input ActorCreateInput {
  name: String
}

input ActorOptions {
  """Specify one or more ActorSort objects to sort Actors by. The sorts will be applied in the order in which they are arranged in the array."""
sort: [ActorSort]
  limit: Int
  skip: Int
}

"""Fields to sort Actors by. The order in which sorts are applied is not guaranteed when specifying many fields in one ActorSort object."""
input ActorSort {
  name: SortDirection
}

input ActorUpdateInput {
  name: String
}

input ActorWhere {
  OR: [ActorWhere!]
  AND: [ActorWhere!]
  name: String
  name_IN: [String]
  name_NOT: String
  name_NOT_IN: [String]
  name_CONTAINS: String
  name_NOT_CONTAINS: String
  name_STARTS_WITH: String
  name_NOT_STARTS_WITH: String
  name_ENDS_WITH: String
  name_NOT_ENDS_WITH: String
  name_MATCHES: String
}

type DeleteInfo {
  nodesDeleted: Int!
  relationshipsDeleted: Int!
}

type CreateActorsMutationResponse {
  actors: [Actor!]!
}

type UpdateActorsMutationResponse {
  actors: [Actor!]!
}

type Mutation {
  createActors(input: [ActorCreateInput!]!): CreateActorsMutationResponse!
  deleteActors(where: ActorWhere): DeleteInfo!
  updateActors(where: ActorWhere, update: ActorUpdateInput): UpdateActorsMutationResponse!
}

type Query {
  actors(where: ActorWhere, options: ActorOptions): [Actor]!
}
```

---
