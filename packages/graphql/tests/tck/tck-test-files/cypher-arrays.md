## Cypher Arrays

Tests for queries using options.where

Schema:

```schema
type Movie {
    title: String!
    ratings: [Float!]!
}
```

---

### WHERE INCLUDES

**GraphQL input**

```graphql
{
    movies(where: { ratings_INCLUDES: 4.0 }) {
        title
        ratings
    }
}
```

**Expected Cypher output**

```cypher
MATCH (this:Movie)
WHERE $this_ratings_INCLUDES IN this.ratings
RETURN this { .title, .ratings } as this
```

**Expected Cypher params**

```cypher-params
{
    "this_ratings_INCLUDES": 4.0
}
```

---

### WHERE NOT INCLUDES

**GraphQL input**

```graphql
{
    movies(where: { ratings_NOT_INCLUDES: 4.0 }) {
        title
        ratings
    }
}
```

**Expected Cypher output**

```cypher
MATCH (this:Movie)
WHERE (NOT $this_ratings_NOT_INCLUDES IN this.ratings)
RETURN this { .title, .ratings } as this
```

**Expected Cypher params**

```cypher-params
{
    "this_ratings_NOT_INCLUDES": 4.0
}
```

---
