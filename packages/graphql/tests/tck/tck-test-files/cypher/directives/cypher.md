# Cypher directive

Tests for queries on cypher directives.

Schema:

```graphql
type Actor {
    name: String
    movies(title: String): [Movie]
        @cypher(
            statement: """
            MATCH (m:Movie {title: $title})
            RETURN m
            """
        )

    tvShows(title: String): [Movie]
        @cypher(
            statement: """
            MATCH (t:TVShow {title: $title})
            RETURN t
            """
        )

    movieOrTVShow(title: String): [MovieOrTVShow]
        @cypher(
            statement: """
            MATCH (n)
            WHERE (n:TVShow OR n:Movie) AND ($title IS NULL OR n.title = $title)
            RETURN n
            """
        )

    randomNumber: Int
        @cypher(
            statement: """
            RETURN rand()
            """
        )
}

union MovieOrTVShow = Movie | TVShow

type TVShow {
    id: ID
    title: String
    numSeasons: Int
    actors: [Actor]
        @cypher(
            statement: """
            MATCH (a:Actor)
            RETURN a
            """
        )
    topActor: Actor
        @cypher(
            statement: """
            MATCH (a:Actor)
            RETURN a
            """
        )
}

type Movie {
    id: ID
    title: String
    actors: [Actor]
        @cypher(
            statement: """
            MATCH (a:Actor)
            RETURN a
            """
        )
    topActor: Actor
        @cypher(
            statement: """
            MATCH (a:Actor)
            RETURN a
            """
        )
}
```

---

## Simple directive

### GraphQL Input

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

### Expected Cypher Output

```cypher
MATCH (this:Movie)
RETURN this {
    .title,
    topActor: head([this_topActor IN apoc.cypher.runFirstColumn("MATCH (a:Actor) RETURN a", {this: this, auth: $auth}, false) | this_topActor {
        .name
    }])
} as this
```

### Expected Cypher Params

```json
{
    "auth": {
        "isAuthenticated": true,
        "roles": [],
        "jwt": {}
    }
}
```

---

## Simple directive (primitive)

### GraphQL Input

```graphql
{
    actors {
        randomNumber
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Actor)
RETURN this {
    randomNumber: apoc.cypher.runFirstColumn("RETURN rand()", {this: this, auth: $auth}, false)
} as this
```

### Expected Cypher Params

```json
{
    "auth": {
        "isAuthenticated": true,
        "roles": [],
        "jwt": {}
    }
}
```

---

## Nested directive

### GraphQL Input

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

### Expected Cypher Output

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

### Expected Cypher Params

```json
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

## Super Nested directive

### GraphQL Input

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

### Expected Cypher Output

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

### Expected Cypher Params

```json
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

## Nested directive with params

### GraphQL Input

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

### Expected Cypher Output

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

### Expected Cypher Params

```json
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

## Union directive

### GraphQL Input

```graphql
{
    actors {
        movieOrTVShow(title: "some title") {
            ...on Movie {
                id
                title
                topActor {
                    name
                }
            }
            ...on TVShow {
                id
                title
                topActor {
                    name
                }
            }
        }
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Actor)
RETURN this { movieOrTVShow: [this_movieOrTVShow IN apoc.cypher.runFirstColumn("MATCH (n) WHERE (n:TVShow OR n:Movie) AND ($title IS NULL OR n.title = $title) RETURN n", {this: this, auth: $auth, title: $this_movieOrTVShow_title}, false) WHERE ("Movie" IN labels(this_movieOrTVShow)) OR ("TVShow" IN labels(this_movieOrTVShow)) | [ this_movieOrTVShow IN [this_movieOrTVShow] WHERE ("Movie" IN labels(this_movieOrTVShow)) | this_movieOrTVShow { __resolveType: "Movie", .id, .title, topActor: head([this_movieOrTVShow_topActor IN apoc.cypher.runFirstColumn("MATCH (a:Actor) RETURN a", {this: this_movieOrTVShow, auth: $auth}, false) | this_movieOrTVShow_topActor { .name }]) } ] + [ this_movieOrTVShow IN [this_movieOrTVShow] WHERE ("TVShow" IN labels(this_movieOrTVShow)) | this_movieOrTVShow { __resolveType: "TVShow", .id, .title, topActor: head([this_movieOrTVShow_topActor IN apoc.cypher.runFirstColumn("MATCH (a:Actor) RETURN a", {this: this_movieOrTVShow, auth: $auth}, false) | this_movieOrTVShow_topActor { .name }]) } ] ] } as this
```

### Expected Cypher Params

```json
{
    "auth": {
        "isAuthenticated": true,
        "roles": [],
        "jwt": {}
    },
    "this_movieOrTVShow_title": "some title"
}
```

---
