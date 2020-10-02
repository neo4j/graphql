## Cypher relationship

Tests for queries on cypher directives.

Schema:

```schema
type Actor {
    name: String
    movies(title: String): [Movie] @cypher(statement: """
        MATCH (m:Movie {title: $title})
        RETURN m
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
    topActor: head([this_topActor IN apoc.cypher.runFirstColumn("MATCH (a:Actor) RETURN a", {this: this}, true) | this_topActor { 
        .name
    }]) 
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
            movies {
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
    topActor: head([this_topActor IN apoc.cypher.runFirstColumn("MATCH (a:Actor) RETURN a", {this: this}, true) | this_topActor { 
        .name,
        movies: [this_topActor_movies IN apoc.cypher.runFirstColumn("MATCH (m:Movie {title: $title}) RETURN m", {this: this_topActor}, true) | this_topActor_movies {
            .title
        }]
    }]) 
} as this
```

**Expected Cypher params**

```cypher-params
{}
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
            movies {
                title
                topActor {
                    name
                    movies {
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
    .title, topActor: head([this_topActor IN apoc.cypher.runFirstColumn("MATCH (a:Actor) RETURN a", {this: this}, true) | this_topActor { 
        .name, 
        movies: [this_topActor_movies IN apoc.cypher.runFirstColumn("MATCH (m:Movie {title: $title}) RETURN m", {this: this_topActor}, true) | this_topActor_movies { 
            .title, 
            topActor: head([this_topActor_movies_topActor IN apoc.cypher.runFirstColumn("MATCH (a:Actor) RETURN a", {this: this_topActor_movies}, true) | this_topActor_movies_topActor { 
                .name, 
                movies: [this_topActor_movies_topActor_movies IN apoc.cypher.runFirstColumn("MATCH (m:Movie {title: $title}) RETURN m", {this: this_topActor_movies_topActor}, true) | this_topActor_movies_topActor_movies {
                     .title
                }] 
            }]) 
        }] 
    }]) 
} as this
```

**Expected Cypher params**

```cypher-params
{}
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
    topActor: head([this_topActor IN apoc.cypher.runFirstColumn("MATCH (a:Actor) RETURN a", {this: this}, true) | this_topActor { 
        .name,
        movies: [this_topActor_movies IN apoc.cypher.runFirstColumn("MATCH (m:Movie {title: $title}) RETURN m", {this: this_topActor, title: $title}, true) | this_topActor_movies {
            .title
        }]
    }]) 
} as this
```

**Expected Cypher params**

```cypher-params
{
    "title": "some title"
}
```

---