## Schema Cypher Directive

Tests that the provided typeDefs return the correct schema (with `@ignored` directives).

---

### Using `@ignored` directive to skip generation of Query

**TypeDefs**

```typedefs-input
type Actor @ignored(resolvers: ["read"]) {
  name: String!
}

type Movie {
  title: String!
}
```

**Output**

```schema-output
type Actor {
  name: String
}

input ActorAND {
  OR: [ActorOR]
  AND: [ActorAND]
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
  name_REGEX: String
}

input ActorCreateInput {
  name: String
}

input ActorOptions {
  sort: [ActorSort]
  limit: Int
  skip: Int
}

input ActorOR {
  OR: [ActorOR]
  AND: [ActorAND]
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
  name_REGEX: String
}

enum ActorSort {
  name_DESC
  name_ASC
}

input ActorUpdateInput {
  name: String
}

input ActorWhere {
  OR: [ActorOR]
  AND: [ActorAND]
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
  name_REGEX: String
}

type DeleteInfo {
  nodesDeleted: Int!
  relationshipsDeleted: Int!
}

type Movie {
  title: String
  actors(title: String): [Actor]
}

input MovieAND {
  OR: [MovieOR]
  AND: [MovieAND]
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
  title_REGEX: String
}

input MovieCreateInput {
  title: String
}

input MovieOptions {
  sort: [MovieSort]
  limit: Int
  skip: Int
}

input MovieOR {
  OR: [MovieOR]
  AND: [MovieAND]
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
  title_REGEX: String
}

enum MovieSort {
  title_DESC
  title_ASC
}

input MovieUpdateInput {
  title: String
}

input MovieWhere {
  OR: [MovieOR]
  AND: [MovieAND]
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
  title_REGEX: String
}

type Mutation {
  createActors(input: [ActorCreateInput]!): [Actor]!
  deleteActors(where: ActorWhere): DeleteInfo!
  updateActors(where: ActorWhere, update: ActorUpdateInput): [Actor]!
  createMovies(input: [MovieCreateInput]!): [Movie]!
  deleteMovies(where: MovieWhere): DeleteInfo!
  updateMovies(where: MovieWhere, update: MovieUpdateInput): [Movie]!
}

type Query {
  Movies(where: MovieWhere, options: MovieOptions): [Movie]!
}
```

---

### Using `@ignored` directive to skip generator of Mutation

**TypeDefs**

```typedefs-input
type Actor @ignored(resolvers: ["create"]) {
  name: String!
}
```

**Output**

```schema-output
type Actor {
  name: String
}

input ActorAND {
  OR: [ActorOR]
  AND: [ActorAND]
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
  name_REGEX: String
}

input ActorOptions {
  sort: [ActorSort]
  limit: Int
  skip: Int
}

input ActorOR {
  OR: [ActorOR]
  AND: [ActorAND]
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
  name_REGEX: String
}

enum ActorSort {
  name_DESC
  name_ASC
}

input ActorUpdateInput {
  name: String
}

input ActorWhere {
  OR: [ActorOR]
  AND: [ActorAND]
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
  name_REGEX: String
}

type DeleteInfo {
  nodesDeleted: Int!
  relationshipsDeleted: Int!
}

type Mutation {
  deleteActors(where: ActorWhere): DeleteInfo!
  updateActors(where: ActorWhere, update: ActorUpdateInput): [Actor]!
}

type Query {
  Actors(where: ActorWhere, options: ActorOptions): [Actor]!
}
```

---

### Using `@ignored` directive to skip generation of all Queries and Mutations using asterisk

**TypeDefs**

```typedefs-input
type Actor @ignored(resolvers: "*") {
  name: String!
}

type Movie {
  title: String!
}
```

**Output**

```schema-output
type Actor {
  name: String
}

input ActorAND {
  OR: [ActorOR]
  AND: [ActorAND]
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
  name_REGEX: String
}

input ActorOptions {
  sort: [ActorSort]
  limit: Int
  skip: Int
}

input ActorOR {
  OR: [ActorOR]
  AND: [ActorAND]
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
  name_REGEX: String
}

enum ActorSort {
  name_DESC
  name_ASC
}

input ActorWhere {
  OR: [ActorOR]
  AND: [ActorAND]
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
  name_REGEX: String
}

type DeleteInfo {
  nodesDeleted: Int!
  relationshipsDeleted: Int!
}

type Movie {
  title: String
  actors(title: String): [Actor]
}

input MovieAND {
  OR: [MovieOR]
  AND: [MovieAND]
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
  title_REGEX: String
}

input MovieCreateInput {
  title: String
}

input MovieOptions {
  sort: [MovieSort]
  limit: Int
  skip: Int
}

input MovieOR {
  OR: [MovieOR]
  AND: [MovieAND]
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
  title_REGEX: String
}

enum MovieSort {
  title_DESC
  title_ASC
}

input MovieUpdateInput {
  title: String
}

input MovieWhere {
  OR: [MovieOR]
  AND: [MovieAND]
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
  title_REGEX: String
}

type Mutation {
  createMovies(input: [MovieCreateInput]!): [Movie]!
  deleteMovies(where: MovieWhere): DeleteInfo!
  updateMovies(where: MovieWhere, update: MovieUpdateInput): [Movie]!
}

type Query {
  Movies(where: MovieWhere, options: MovieOptions): [Movie]!
}
```

---

### Ensure generation doesn't break if `@ignored` is provided with an empty array

**TypeDefs**

```typedefs-input
type Actor @ignored(resolvers: []) {
  name: String!
}
```

**Output**

```schema-output
type Actor {
  name: String
}

input ActorAND {
  OR: [ActorOR]
  AND: [ActorAND]
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
  name_REGEX: String
}

input ActorCreateInput {
  name: String
}

input ActorOptions {
  sort: [ActorSort]
  limit: Int
  skip: Int
}

input ActorOR {
  OR: [ActorOR]
  AND: [ActorAND]
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
  name_REGEX: String
}

enum ActorSort {
  name_DESC
  name_ASC
}

input ActorUpdateInput {
  name: String
}

input ActorWhere {
  OR: [ActorOR]
  AND: [ActorAND]
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
  name_REGEX: String
}

type DeleteInfo {
  nodesDeleted: Int!
  relationshipsDeleted: Int!
}

type Mutation {
  createActors(input: [ActorCreateInput]!): [Actor]!
  deleteActors(where: ActorWhere): DeleteInfo!
  updateActors(where: ActorWhere, update: ActorUpdateInput): [Actor]!
}

type Query {
  Actors(where: ActorWhere, options: ActorOptions): [Actor]!
}
```

---
