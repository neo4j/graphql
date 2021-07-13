# Cypher relationship

Tests for queries on relationships.

Schema:

```schema
type Actor {
    name: String
    movies: [Movie] @relationship(type: "ACTED_IN", direction: OUT)
}

type Movie {
    id: ID
    title: String
    actors: [Actor] @relationship(type: "ACTED_IN", direction: IN)
    topActor: Actor @relationship(type: "TOP_ACTOR", direction: OUT)
}
```

---

## Simple relation

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
RETURN this { .title, topActor: head([ (this)-[:TOP_ACTOR]->(this_topActor:Actor) | this_topActor { .name } ]) } as this
```

### Expected Cypher Params

```cypher-params
{}
```

---

## Many relation

### GraphQL Input

```graphql
{
    movies {
        title
        actors {
            name
        }
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Movie)
RETURN this { .title, actors: [ (this)<-[:ACTED_IN]-(this_actors:Actor) | this_actors { .name } ] } as this
```

### Expected Cypher Params

```cypher-params
{}
```

---

## Nested relation

### GraphQL Input

```graphql
{
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
```

### Expected Cypher Output

```cypher
MATCH (this:Movie)
RETURN this {
    .title,
    topActor: head([ (this)-[:TOP_ACTOR]->(this_topActor:Actor) | this_topActor {
        .name,
        movies: [ (this_topActor)-[:ACTED_IN]->(this_topActor_movies:Movie) | this_topActor_movies {
            .title
        } ]
    } ])
} as this
```

### Expected Cypher Params

```cypher-params
{}
```

---

## Nested relation with params

### GraphQL Input

```graphql
{
    movies(where: { title: "some title" }) {
        title
        topActor(where: { name: "top actor" }) {
            name
            movies(where: { title: "top actor movie" }) {
                title
            }
        }
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Movie)
WHERE this.title = $this_title
RETURN this {
    .title,
    topActor: head([ (this)-[:TOP_ACTOR]->(this_topActor:Actor) WHERE this_topActor.name = $this_topActor_name | this_topActor {
        .name,
        movies: [ (this_topActor)-[:ACTED_IN]->(this_topActor_movies:Movie) WHERE this_topActor_movies.title = $this_topActor_movies_title | this_topActor_movies {
            .title
        } ]
    } ])
} as this
```

### Expected Cypher Params

```cypher-params
{
    "this_title": "some title",
    "this_topActor_name": "top actor",
    "this_topActor_movies_title": "top actor movie"
}
```

---
