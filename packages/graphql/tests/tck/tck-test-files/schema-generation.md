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

input MovieAND {
  id: ID
  id_IN: [ID]
  OR: [MovieOR]
  AND: [MovieAND]
}

input MovieOR {
  id: ID
  id_IN: [ID]
  OR: [MovieOR]
  AND: [MovieAND]
}

enum Movie_SORT {
  id_DESC
  id_ASC
}

input MovieOptions {
  sort: [Movie_SORT]
  limit: Int
  skip: Int
}

input MovieQuery {
  id: ID
  id_IN: [ID]
  OR: [MovieOR]
  AND: [MovieAND]
}

type Query {
  FindOne_Movie(query: MovieQuery): Movie
  FindMany_Movie(query: MovieQuery, options: MovieOptions): [Movie]!
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

input ActorAND {
  name: String
  name_IN: [String]
  OR: [ActorOR]
  AND: [ActorAND]
}

enum Actor_SORT {
  name_DESC
  name_ASC
}

input ActorOR {
  name: String
  name_IN: [String]
  OR: [ActorOR]
  AND: [ActorAND]
}


input ActorOptions {
  sort: [Actor_SORT]
  limit: Int
  skip: Int
}

input ActorQuery {
  name: String
  name_IN: [String]
  OR: [ActorOR]
  AND: [ActorAND]
}

type Movie {
  id: ID
  actors(query: ActorQuery, options: ActorOptions): [Actor]!
}

input MovieAND {
  id: ID
  id_IN: [ID]
  OR: [MovieOR]
  AND: [MovieAND]
}

input MovieOR {
  id: ID
  id_IN: [ID]
  OR: [MovieOR]
  AND: [MovieAND]
}

enum Movie_SORT {
  id_DESC
  id_ASC
}

input MovieOptions {
  sort: [Movie_SORT]
  limit: Int
  skip: Int
}

input MovieQuery {
  id: ID
  id_IN: [ID]
  OR: [MovieOR]
  AND: [MovieAND]
}

type Query {
  FindOne_Actor(query: ActorQuery): Actor
  FindMany_Actor(query: ActorQuery, options: ActorOptions): [Actor]!
  FindOne_Movie(query: MovieQuery): Movie
  FindMany_Movie(query: MovieQuery, options: MovieOptions): [Movie]!
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
  movies(query: MovieQuery, options: MovieOptions): [Movie]
}

input ActorAND {
  name: String
  name_IN: [String]
  OR: [ActorOR]
  AND: [ActorAND]
}

enum Actor_SORT {
  name_DESC
  name_ASC
}

input ActorOR {
  name: String
  name_IN: [String]
  OR: [ActorOR]
  AND: [ActorAND]
}


input ActorOptions {
  sort: [Actor_SORT]
  limit: Int
  skip: Int
}

input ActorQuery {
  name: String
  name_IN: [String]
  OR: [ActorOR]
  AND: [ActorAND]
}

type Movie {
  id: ID
  actors(query: ActorQuery, options: ActorOptions): [Actor]!
}

input MovieAND {
  id: ID
  id_IN: [ID]
  OR: [MovieOR]
  AND: [MovieAND]
}

input MovieOR {
  id: ID
  id_IN: [ID]
  OR: [MovieOR]
  AND: [MovieAND]
}

enum Movie_SORT {
  id_DESC
  id_ASC
}

input MovieOptions {
  sort: [Movie_SORT]
  limit: Int
  skip: Int
}

input MovieQuery {
  id: ID
  id_IN: [ID]
  OR: [MovieOR]
  AND: [MovieAND]
}

type Query {
  FindOne_Actor(query: ActorQuery): Actor
  FindMany_Actor(query: ActorQuery, options: ActorOptions): [Actor]!
  FindOne_Movie(query: MovieQuery): Movie
  FindMany_Movie(query: MovieQuery, options: MovieOptions): [Movie]!
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

input ActorAND {
  name: String
  name_IN: [String]
  OR: [ActorOR]
  AND: [ActorAND]
}

enum Actor_SORT {
  name_DESC
  name_ASC
}

input ActorOR {
  name: String
  name_IN: [String]
  OR: [ActorOR]
  AND: [ActorAND]
}


input ActorOptions {
  sort: [Actor_SORT]
  limit: Int
  skip: Int
}

input ActorQuery {
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

input MovieOR {
  id: ID
  id_IN: [ID]
  OR: [MovieOR]
  AND: [MovieAND]
}

enum Movie_SORT {
  id_DESC
  id_ASC
}

input MovieOptions {
  sort: [Movie_SORT]
  limit: Int
  skip: Int
}

input MovieQuery {
  id: ID
  id_IN: [ID]
  OR: [MovieOR]
  AND: [MovieAND]
}

type Query {
  FindOne_Actor(query: ActorQuery): Actor
  FindMany_Actor(query: ActorQuery, options: ActorOptions): [Actor]!
  FindOne_Movie(query: MovieQuery): Movie
  FindMany_Movie(query: MovieQuery, options: MovieOptions): [Movie]!
}
```

---