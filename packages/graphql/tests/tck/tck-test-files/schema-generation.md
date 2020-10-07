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

input Movie_AND {
  id: ID
  id_IN: [ID]
  _OR: [Movie_OR]
  _AND: [Movie_AND]
}

input Movie_OR {
  id: ID
  id_IN: [ID]
  _OR: [Movie_OR]
  _AND: [Movie_AND]
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
  _OR: [Movie_OR]
  _AND: [Movie_AND]
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

input Actor_AND {
  name: String
  name_IN: [String]
  _OR: [Actor_OR]
  _AND: [Actor_AND]
}

enum Actor_SORT {
  name_DESC
  name_ASC
}

input Actor_OR {
  name: String
  name_IN: [String]
  _OR: [Actor_OR]
  _AND: [Actor_AND]
}


input ActorOptions {
  sort: [Actor_SORT]
  limit: Int
  skip: Int
}

input ActorQuery {
  name: String
  name_IN: [String]
  _OR: [Actor_OR]
  _AND: [Actor_AND]
}

type Movie {
  id: ID
  actors(query: ActorQuery, options: ActorOptions): [Actor]!
}

input Movie_AND {
  id: ID
  id_IN: [ID]
  _OR: [Movie_OR]
  _AND: [Movie_AND]
}

input Movie_OR {
  id: ID
  id_IN: [ID]
  _OR: [Movie_OR]
  _AND: [Movie_AND]
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
  _OR: [Movie_OR]
  _AND: [Movie_AND]
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

input Actor_AND {
  name: String
  name_IN: [String]
  _OR: [Actor_OR]
  _AND: [Actor_AND]
}

enum Actor_SORT {
  name_DESC
  name_ASC
}

input Actor_OR {
  name: String
  name_IN: [String]
  _OR: [Actor_OR]
  _AND: [Actor_AND]
}


input ActorOptions {
  sort: [Actor_SORT]
  limit: Int
  skip: Int
}

input ActorQuery {
  name: String
  name_IN: [String]
  _OR: [Actor_OR]
  _AND: [Actor_AND]
}

type Movie {
  id: ID
  actors(query: ActorQuery, options: ActorOptions): [Actor]!
}

input Movie_AND {
  id: ID
  id_IN: [ID]
  _OR: [Movie_OR]
  _AND: [Movie_AND]
}

input Movie_OR {
  id: ID
  id_IN: [ID]
  _OR: [Movie_OR]
  _AND: [Movie_AND]
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
  _OR: [Movie_OR]
  _AND: [Movie_AND]
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

input Actor_AND {
  name: String
  name_IN: [String]
  _OR: [Actor_OR]
  _AND: [Actor_AND]
}

enum Actor_SORT {
  name_DESC
  name_ASC
}

input Actor_OR {
  name: String
  name_IN: [String]
  _OR: [Actor_OR]
  _AND: [Actor_AND]
}


input ActorOptions {
  sort: [Actor_SORT]
  limit: Int
  skip: Int
}

input ActorQuery {
  name: String
  name_IN: [String]
  _OR: [Actor_OR]
  _AND: [Actor_AND]
}

type Movie {
  id: ID
  actors(title: String): [Actor]
}

input Movie_AND {
  id: ID
  id_IN: [ID]
  _OR: [Movie_OR]
  _AND: [Movie_AND]
}

input Movie_OR {
  id: ID
  id_IN: [ID]
  _OR: [Movie_OR]
  _AND: [Movie_AND]
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
  _OR: [Movie_OR]
  _AND: [Movie_AND]
}

type Query {
  FindOne_Actor(query: ActorQuery): Actor
  FindMany_Actor(query: ActorQuery, options: ActorOptions): [Actor]!
  FindOne_Movie(query: MovieQuery): Movie
  FindMany_Movie(query: MovieQuery, options: MovieOptions): [Movie]!
}
```

---