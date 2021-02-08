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
    movies {
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
    topActor: head([this_topActor IN apoc.cypher.runFirstColumn("MATCH (a:Actor) RETURN a", {this: this, auth: $auth}, false) | this_topActor {
        .name
    }])
} as this
```

**Expected Cypher params**

```cypher-params
{
    "auth": {
       "isAuthenticated": true,
       "roles": [],
       "jwt": {}
    }
}
```

---

### Simple directive (primitive)

**GraphQL input**

```graphql
{
    actors {
        randomNumber
    }
}
```

**Expected Cypher output**

```cypher
MATCH (this:Actor)
RETURN this {
    randomNumber: head([ apoc.cypher.runFirstColumn("RETURN rand()", {this: this, auth: $auth}, false) ])
} as this
```

**Expected Cypher params**

```cypher-params
{
    "auth": {
       "isAuthenticated": true,
       "roles": [],
       "jwt": {}
    }
}
```

---

### Nested directive

**GraphQL input**

```graphql
{
    movies {
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
    topActor: head([this_topActor IN apoc.cypher.runFirstColumn("MATCH (a:Actor) RETURN a", {this: this, auth: $auth}, false) | this_topActor {
        .name,
        movies: [this_topActor_movies IN apoc.cypher.runFirstColumn("MATCH (m:Movie {title: $title}) RETURN m", {this: this_topActor, auth: $auth, title: $this_topActor_movies_title}, true) | this_topActor_movies {
            .title
        }]
    }])
} as this
```

**Expected Cypher params**

```cypher-params
{
    "this_topActor_movies_title": "some title",
    "auth": {
       "isAuthenticated": true,
       "roles": [],
       "jwt": {}
    }
}
```

---

### Super Nested directive

**GraphQL input**

```graphql
{
    movies {
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
    topActor: head([this_topActor IN apoc.cypher.runFirstColumn("MATCH (a:Actor) RETURN a", {this: this, auth: $auth}, false) | this_topActor {
        .name,
        movies: [this_topActor_movies IN apoc.cypher.runFirstColumn("MATCH (m:Movie {title: $title}) RETURN m", {this: this_topActor, auth: $auth, title: $this_topActor_movies_title}, true) | this_topActor_movies {
            .title,
            topActor: head([this_topActor_movies_topActor IN apoc.cypher.runFirstColumn("MATCH (a:Actor) RETURN a", {this: this_topActor_movies, auth: $auth}, false) | this_topActor_movies_topActor {
                .name,
                movies: [this_topActor_movies_topActor_movies IN apoc.cypher.runFirstColumn("MATCH (m:Movie {title: $title}) RETURN m", {this: this_topActor_movies_topActor, auth: $auth, title: $this_topActor_movies_topActor_movies_title}, true) | this_topActor_movies_topActor_movies {
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
    "auth": {
       "isAuthenticated": true,
       "roles": [],
       "jwt": {}
    }
}
```

---

### Nested directive with params

**GraphQL input**

```graphql
{
    movies {
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
    topActor: head([this_topActor IN apoc.cypher.runFirstColumn("MATCH (a:Actor) RETURN a", {this: this, auth: $auth}, false) | this_topActor {
        .name,
        movies: [this_topActor_movies IN apoc.cypher.runFirstColumn("MATCH (m:Movie {title: $title}) RETURN m", {this: this_topActor, auth: $auth, title: $this_topActor_movies_title}, true) | this_topActor_movies {
            .title
        }]
    }])
} as this
```

**Expected Cypher params**

```cypher-params
{
    "this_topActor_movies_title": "some title",
    "auth": {
       "isAuthenticated": true,
       "roles": [],
       "jwt": {}
    }
}
```

---
