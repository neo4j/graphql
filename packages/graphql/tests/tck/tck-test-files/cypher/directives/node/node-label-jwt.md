# Label in Node directive

Custom label using @node.

Schema:

```graphql
type Actor @node(additionalLabels: ["$jwt.personlabel"]) {
    name: String
    age: Int
    movies: [Movie] @relationship(type: "ACTED_IN", direction: OUT)
}

type Movie @node(label: "$jwt.movielabel") {
    id: ID
    title: String
    actors: [Actor]! @relationship(type: "ACTED_IN", direction: IN)
}
```

---

## Select Movie with label Film

### GraphQL Input

```graphql
query {
    movies {
        title
    }
}
```

### JWT Object

```json
{
    "movielabel": "Film"
}
```

### Expected Cypher Output

```cypher
MATCH (this:Film)
RETURN this { .title } as this
```

### Expected Cypher Params

```json
{}
```

---

## Select Movie with label Film from Actors with additionalLabels

### GraphQL Input

```graphql
query {
    actors(where: { age_GT: 10 }) {
        name
        movies(where: { title: "terminator" }) {
            title
        }
    }
}
```

### JWT Object

```json
{
    "movielabel": "Film",
    "personlabel": "Person"
}
```

### Expected Cypher Output

```cypher
MATCH (this:Actor:Person)
WHERE this.age > $this_age_GT
RETURN this {
    .name,
    movies: [
        (this)-[:ACTED_IN]->(this_movies:Film)
        WHERE this_movies.title = $this_movies_title | this_movies { .title }
        ] } as this
```

### Expected Cypher Params

```json
{
    "this_age_GT": {
        "high": 0,
        "low": 10
    },
    "this_movies_title": "terminator"
}
```

---

## Create Movie with label Film

### GraphQL Input

```graphql
mutation {
    createMovies(input: { title: "Titanic" }) {
        movies {
            title
        }
    }
}
```

### JWT Object

```json
{
    "movielabel": "Film"
}
```

### Expected Cypher Output

```cypher
CALL {
    CREATE (this0:Film)
    SET this0.title = $this0_title
    RETURN this0
}
RETURN this0 { .title } AS this0
```

### Expected Cypher Params

```json
{
    "this0_title": "Titanic"
}
```

---
