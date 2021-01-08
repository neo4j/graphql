## Cypher directive

Tests for queries on cypher directives.

Schema:

```schema
type Actor {
    name: String
    movies(title: String): [Movie] @cypher(statement: """
        MATCH (m:Movie {title: $title})
        RETURN m
    """)
    randomNumber: Int @cypher(statement: """
        RETURN rand()
    """)
}

type Movie {
    id: ID
    title: String
    actors: [Actor] @cypher(statement: """
        MATCH (a:Actor)
        RETURN a
    """)
    topActor: Actor @cypher(statement: """
        MATCH (a:Actor)
        RETURN a
    """)
}
```

---

### Simple directive

**GraphQL input**

```graphql
{
    Movies {
        title
        topActor {
            name
        }
    }
}
```

**Expected Cypher output**

```cypher
MATCH (this:Movie)
RETURN this {
    .title,
    topActor: head([this_topActor IN apoc.cypher.runFirstColumn("MATCH (a:Actor) RETURN a", {this: this, jwt: $jwt}, false) | this_topActor {
        .name
    }])
} as this
```

**Expected Cypher params**

```cypher-params
{
    "jwt": {}
}
```

---

### Simple directive (primitive)

**GraphQL input**

```graphql
{
    Actors {
        randomNumber
    }
}
```

**Expected Cypher output**

```cypher
MATCH (this:Actor)
RETURN this {
    randomNumber: head([ apoc.cypher.runFirstColumn("RETURN rand()", {this: this, jwt: $jwt}, false) ])
} as this
```

**Expected Cypher params**

```cypher-params
{
    "jwt": {}
}
```

---

### Nested directive

**GraphQL input**

```graphql
{
    Movies {
        title
        topActor {
            name
            movies(title: "some title") {
                title
            }
        }
    }
}
```

**Expected Cypher output**

```cypher
MATCH (this:Movie)
RETURN this {
    .title,
    topActor: head([this_topActor IN apoc.cypher.runFirstColumn("MATCH (a:Actor) RETURN a", {this: this, jwt: $jwt}, false) | this_topActor {
        .name,
        movies: [this_topActor_movies IN apoc.cypher.runFirstColumn("MATCH (m:Movie {title: $title}) RETURN m", {this: this_topActor, jwt: $jwt, title: $this_topActor_movies_title}, true) | this_topActor_movies {
            .title
        }]
    }])
} as this
```

**Expected Cypher params**

```cypher-params
{
    "jwt": {},
    "this_topActor_movies_title": "some title"
}
```

---

### Super Nested directive

**GraphQL input**

```graphql
{
    Movies {
        title
        topActor {
            name
            movies(title: "some title") {
                title
                topActor {
                    name
                    movies(title: "another title") {
                        title
                    }
                }
            }
        }
    }
}
```

**Expected Cypher output**

```cypher
MATCH (this:Movie)
RETURN this {
    .title,
    topActor: head([this_topActor IN apoc.cypher.runFirstColumn("MATCH (a:Actor) RETURN a", {this: this, jwt: $jwt}, false) | this_topActor {
        .name,
        movies: [this_topActor_movies IN apoc.cypher.runFirstColumn("MATCH (m:Movie {title: $title}) RETURN m", {this: this_topActor, jwt: $jwt, title: $this_topActor_movies_title}, true) | this_topActor_movies {
            .title,
            topActor: head([this_topActor_movies_topActor IN apoc.cypher.runFirstColumn("MATCH (a:Actor) RETURN a", {this: this_topActor_movies, jwt: $jwt}, false) | this_topActor_movies_topActor {
                .name,
                movies: [this_topActor_movies_topActor_movies IN apoc.cypher.runFirstColumn("MATCH (m:Movie {title: $title}) RETURN m", {this: this_topActor_movies_topActor, jwt: $jwt, title: $this_topActor_movies_topActor_movies_title}, true) | this_topActor_movies_topActor_movies {
                     .title
                }]
            }])
        }]
    }])
} as this
```

**Expected Cypher params**

```cypher-params
{
    "this_topActor_movies_title": "some title",
    "this_topActor_movies_topActor_movies_title": "another title",
    "jwt": {}
}
```

---

### Nested directive with params

**GraphQL input**

```graphql
{
    Movies {
        title
        topActor {
            name
            movies(title: "some title") {
                title
            }
        }
    }
}
```

**Expected Cypher output**

```cypher
MATCH (this:Movie)
RETURN this {
    .title,
    topActor: head([this_topActor IN apoc.cypher.runFirstColumn("MATCH (a:Actor) RETURN a", {this: this, jwt: $jwt}, false) | this_topActor {
        .name,
        movies: [this_topActor_movies IN apoc.cypher.runFirstColumn("MATCH (m:Movie {title: $title}) RETURN m", {this: this_topActor, jwt: $jwt, title: $this_topActor_movies_title}, true) | this_topActor_movies {
            .title
        }]
    }])
} as this
```

**Expected Cypher params**

```cypher-params
{
    "jwt": {},
    "this_topActor_movies_title": "some title"
}
```

---
