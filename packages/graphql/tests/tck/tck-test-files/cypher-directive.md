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
    FindMany_Movie {
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
    topActor: head([this_topActor IN apoc.cypher.runFirstColumn("MATCH (a:Actor) RETURN a", {this: this}, false) | this_topActor { 
        .name
    }]) 
} as this
```

**Expected Cypher params**

```cypher-params
{}
```

---

### Simple directive (primitive)

**GraphQL input**

```graphql
{
    FindMany_Actor {
        randomNumber
    }
}
```

**Expected Cypher output**

```cypher
MATCH (this:Actor) 
RETURN this { 
    randomNumber: head([this_randomNumber IN apoc.cypher.runFirstColumn("RETURN rand()", {this: this}, false) ]) 
} as this
```

**Expected Cypher params**

```cypher-params
{}
```

---

### Nested directive

**GraphQL input**

```graphql
{
    FindMany_Movie {
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
    topActor: head([this_topActor IN apoc.cypher.runFirstColumn("MATCH (a:Actor) RETURN a", {this: this}, false) | this_topActor { 
        .name,
        movies: [this_topActor_movies IN apoc.cypher.runFirstColumn("MATCH (m:Movie {title: $title}) RETURN m", {this: this_topActor, title: $this_topActor_movies_title}, true) | this_topActor_movies {
            .title
        }]
    }]) 
} as this
```

**Expected Cypher params**

```cypher-params
{
    "this_topActor_movies_title": "some title"
}
```

---

### Super Nested directive

**GraphQL input**

```graphql
{
    FindMany_Movie {
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
    topActor: head([this_topActor IN apoc.cypher.runFirstColumn("MATCH (a:Actor) RETURN a", {this: this}, false) | this_topActor { 
        .name, 
        movies: [this_topActor_movies IN apoc.cypher.runFirstColumn("MATCH (m:Movie {title: $title}) RETURN m", {this: this_topActor, title: $this_topActor_movies_title}, true) | this_topActor_movies { 
            .title, 
            topActor: head([this_topActor_movies_topActor IN apoc.cypher.runFirstColumn("MATCH (a:Actor) RETURN a", {this: this_topActor_movies}, false) | this_topActor_movies_topActor { 
                .name, 
                movies: [this_topActor_movies_topActor_movies IN apoc.cypher.runFirstColumn("MATCH (m:Movie {title: $title}) RETURN m", {this: this_topActor_movies_topActor, title: $this_topActor_movies_topActor_movies_title}, true) | this_topActor_movies_topActor_movies {
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
    "this_topActor_movies_topActor_movies_title": "another title"
}
```

---

### Nested directive with params

**GraphQL input**

```graphql
{
    FindMany_Movie {
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
    topActor: head([this_topActor IN apoc.cypher.runFirstColumn("MATCH (a:Actor) RETURN a", {this: this}, false) | this_topActor { 
        .name,
        movies: [this_topActor_movies IN apoc.cypher.runFirstColumn("MATCH (m:Movie {title: $title}) RETURN m", {this: this_topActor, title: $this_topActor_movies_title}, true) | this_topActor_movies { 
            .title
        }]
    }]) 
} as this
```

**Expected Cypher params**

```cypher-params
{
    "this_topActor_movies_title": "some title"
}
```

---