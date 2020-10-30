## Schema Generation

Tests that the provided typeDefs return the correct schema.

---

### Simple

**TypeDefs**

```typedefs-input
type Movie {
    id: ID
}
```

**Output**

```schema-output
type Movie {
  id: ID
}

type DeleteInfo {
  nodesDeleted: Int!
  relationshipsDeleted: Int!
}

input MovieAND {
  id: ID
  id_IN: [ID]
  OR: [MovieOR]
  AND: [MovieAND]
}

input MovieCreateInput {
  id: ID
}

input MovieOptions {
  sort: [MovieSort]
  limit: Int
  skip: Int
}

input MovieOR {
  id: ID
  id_IN: [ID]
  OR: [MovieOR]
  AND: [MovieAND]
}

enum MovieSort {
  id_DESC
  id_ASC
}

input MovieWhere {
  id: ID
  id_IN: [ID]
  OR: [MovieOR]
  AND: [MovieAND]
}

type Mutation {
  createMovies(input: [MovieCreateInput]!): [Movie]!
  deleteMovies(where: MovieWhere): DeleteInfo!
}

type Query {
  Movies(where: MovieWhere, options: MovieOptions): [Movie]!
}
```

---

### Single Relationship

**TypeDefs**

```typedefs-input
type Actor {
    name: String
}
    
type Movie {
    id: ID
    actors: [Actor]! @relationship(type: "ACTED_IN", direction: "IN")
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

input ActorAND {
  name: String
  name_IN: [String]
  OR: [ActorOR]
  AND: [ActorAND]
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
  name: String
  name_IN: [String]
  OR: [ActorOR]
  AND: [ActorAND]
}

enum ActorSort {
  name_DESC
  name_ASC
}

input ActorWhere {
  name: String
  name_IN: [String]
  OR: [ActorOR]
  AND: [ActorAND]
}

type Movie {
  id: ID
  actors(where: ActorWhere, options: ActorOptions): [Actor]!
}

input MovieActorsFieldInput {
  create: [ActorCreateInput]
}

input MovieAND {
  id: ID
  id_IN: [ID]
  OR: [MovieOR]
  AND: [MovieAND]
}

input MovieCreateInput {
  id: ID
  actors: MovieActorsFieldInput
}

input MovieOptions {
  sort: [MovieSort]
  limit: Int
  skip: Int
}

input MovieOR {
  id: ID
  id_IN: [ID]
  OR: [MovieOR]
  AND: [MovieAND]
}

enum MovieSort {
  id_DESC
  id_ASC
}

input MovieWhere {
  id: ID
  id_IN: [ID]
  OR: [MovieOR]
  AND: [MovieAND]
}

type Mutation {
  createActors(input: [ActorCreateInput]!): [Actor]!
  createMovies(input: [MovieCreateInput]!): [Movie]!
  deleteMovies(where: MovieWhere): DeleteInfo!
  deleteActors(where: ActorWhere): DeleteInfo!
}

type Query {
  Actors(where: ActorWhere, options: ActorOptions): [Actor]!
  Movies(where: MovieWhere, options: MovieOptions): [Movie]!
}
```

---

### Multi Relationship

**TypeDefs**

```typedefs-input
type Actor {
    name: String
    movies: [Movie] @relationship(type: "ACTED_IN", direction: "OUT")
}
    
type Movie {
    id: ID
    actors: [Actor]! @relationship(type: "ACTED_IN", direction: "IN")
}
```

**Output**

```schema-output
type Actor {
  name: String
  movies(where: MovieWhere, options: MovieOptions): [Movie]
}

type DeleteInfo {
  nodesDeleted: Int!
  relationshipsDeleted: Int!
}

input ActorAND {
  name: String
  name_IN: [String]
  OR: [ActorOR]
  AND: [ActorAND]
}

input ActorConnectFieldInput {
  where: ActorWhere
  connect: ActorConnectInput
}

input ActorConnectInput {
  movies: [MovieConnectFieldInput]
}

input ActorCreateInput {
  name: String
  movies: ActorMoviesFieldInput
}

input ActorMoviesFieldInput {
  create: [MovieCreateInput]
  connect: [MovieConnectFieldInput]
}

input ActorOptions {
  sort: [ActorSort]
  limit: Int
  skip: Int
}

input ActorOR {
  name: String
  name_IN: [String]
  OR: [ActorOR]
  AND: [ActorAND]
}

enum ActorSort {
  name_DESC
  name_ASC
}

input ActorWhere {
  name: String
  name_IN: [String]
  OR: [ActorOR]
  AND: [ActorAND]
}

type Movie {
  id: ID
  actors(where: ActorWhere, options: ActorOptions): [Actor]!
}

input MovieActorsFieldInput {
  create: [ActorCreateInput]
  connect: [ActorConnectFieldInput]
}

input MovieAND {
  id: ID
  id_IN: [ID]
  OR: [MovieOR]
  AND: [MovieAND]
}

input MovieConnectFieldInput {
  where: MovieWhere
  connect: MovieConnectInput
}

input MovieConnectInput {
  actors: [ActorConnectFieldInput]
}

input MovieCreateInput {
  id: ID
  actors: MovieActorsFieldInput
}

input MovieOptions {
  sort: [MovieSort]
  limit: Int
  skip: Int
}

input MovieOR {
  id: ID
  id_IN: [ID]
  OR: [MovieOR]
  AND: [MovieAND]
}

enum MovieSort {
  id_DESC
  id_ASC
}

input MovieWhere {
  id: ID
  id_IN: [ID]
  OR: [MovieOR]
  AND: [MovieAND]
}

type Mutation {
  createActors(input: [ActorCreateInput]!): [Actor]!
  createMovies(input: [MovieCreateInput]!): [Movie]!
  deleteMovies(where: MovieWhere): DeleteInfo!
  deleteActors(where: ActorWhere): DeleteInfo!
}

type Query {
  Actors(where: ActorWhere, options: ActorOptions): [Actor]!
  Movies(where: MovieWhere, options: MovieOptions): [Movie]!
}
```

---

### Custom Directive Simple

**TypeDefs**

```typedefs-input
type Actor {
  name: String
}

type Movie {
    id: ID
    actors(title: String): [Actor] @cypher(statement: """
      MATCH (a:Actor {title: $title})
      RETURN a
      LIMIT 1
    """)
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

input ActorAND {
  name: String
  name_IN: [String]
  OR: [ActorOR]
  AND: [ActorAND]
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
  name: String
  name_IN: [String]
  OR: [ActorOR]
  AND: [ActorAND]
}

enum ActorSort {
  name_DESC
  name_ASC
}

input ActorWhere {
  name: String
  name_IN: [String]
  OR: [ActorOR]
  AND: [ActorAND]
}

type Movie {
  id: ID
  actors(title: String): [Actor]
}

input MovieAND {
  id: ID
  id_IN: [ID]
  OR: [MovieOR]
  AND: [MovieAND]
}

input MovieCreateInput {
  id: ID
}

input MovieOptions {
  sort: [MovieSort]
  limit: Int
  skip: Int
}

input MovieOR {
  id: ID
  id_IN: [ID]
  OR: [MovieOR]
  AND: [MovieAND]
}

enum MovieSort {
  id_DESC
  id_ASC
}

input MovieWhere {
  id: ID
  id_IN: [ID]
  OR: [MovieOR]
  AND: [MovieAND]
}

type Mutation {
  createActors(input: [ActorCreateInput]!): [Actor]!
  createMovies(input: [MovieCreateInput]!): [Movie]!
  deleteMovies(where: MovieWhere): DeleteInfo!
  deleteActors(where: ActorWhere): DeleteInfo!
}

type Query {
  Actors(where: ActorWhere, options: ActorOptions): [Actor]!
  Movies(where: MovieWhere, options: MovieOptions): [Movie]!
}
```

---