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

### WHERE EQ

**GraphQL input**

```graphql
{
    movies(where: { ratings: [4.0] }) {
        title
        ratings
    }
}
```

**Expected Cypher output**

```cypher
MATCH (this:Movie)
WHERE this.ratings = $this_ratings
RETURN this { .title, .ratings } as this
```

**Expected Cypher params**

```cypher-params
{
    "this_ratings": [4.0]
}
```

---

### WHERE NOT

**GraphQL input**

```graphql
{
    movies(where: { ratings_NOT: [4.0] }) {
        title
        ratings
    }
}
```

**Expected Cypher output**

```cypher
MATCH (this:Movie)
WHERE (NOT this.ratings = $this_ratings_NOT)
RETURN this { .title, .ratings } as this
```

**Expected Cypher params**

```cypher-params
{
    "this_ratings_NOT": [4.0]
}
```

---
