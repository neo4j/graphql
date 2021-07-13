# Cypher NULL

Tests for queries using null (in)equality in options.where

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
    isFavorite: Boolean
}
```

---

## Simple IS NULL

### GraphQL Input

```graphql
query {
    movies(where: { title: null }) {
        title
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Movie)
WHERE this.title IS NULL
RETURN this { .title } as this
```

### Expected Cypher Params

```cypher-params
{}
```

---

## Simple IS NOT NULL

### GraphQL Input

```graphql
query {
    movies(where: { title_NOT: null }) {
        title
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Movie)
WHERE this.title IS NOT NULL
RETURN this { .title } as this
```

### Expected Cypher Params

```cypher-params
{}
```

---

## Simple relationship IS NULL

### GraphQL Input

```graphql
query {
    movies(where: { actors: null }) {
        title
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Movie)
WHERE NOT EXISTS((this)<-[:ACTED_IN]-(:Actor))
RETURN this { .title } as this
```

### Expected Cypher Params

```cypher-params
{}
```

---

## Simple relationship IS NOT NULL

### GraphQL Input

```graphql
query {
    movies(where: { actors_NOT: null }) {
        title
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Movie)
WHERE EXISTS((this)<-[:ACTED_IN]-(:Actor))
RETURN this { .title } as this
```

### Expected Cypher Params

```cypher-params
{}
```

---
