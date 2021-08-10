# Cypher Arrays

Tests for queries using options.where

Schema:

```graphql
type Movie {
    title: String!
    ratings: [Float!]!
}
```

---

## WHERE INCLUDES

### GraphQL Input

```graphql
{
    movies(where: { ratings_INCLUDES: 4.0 }) {
        title
        ratings
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Movie)
WHERE $this_ratings_INCLUDES IN this.ratings
RETURN this { .title, .ratings } as this
```

### Expected Cypher Params

```json
{
    "this_ratings_INCLUDES": 4.0
}
```

---

## WHERE NOT INCLUDES

### GraphQL Input

```graphql
{
    movies(where: { ratings_NOT_INCLUDES: 4.0 }) {
        title
        ratings
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Movie)
WHERE (NOT $this_ratings_NOT_INCLUDES IN this.ratings)
RETURN this { .title, .ratings } as this
```

### Expected Cypher Params

```json
{
    "this_ratings_NOT_INCLUDES": 4.0
}
```

---
