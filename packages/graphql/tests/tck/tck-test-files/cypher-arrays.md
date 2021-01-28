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

### WHERE IN

**GraphQL input**

```graphql
{
    movies(where: { ratings_IN: 4.0 }) {
        title
        ratings
    }
}
```

**Expected Cypher output**

```cypher
MATCH (this:Movie)
WHERE $this_ratings_IN IN this.ratings
RETURN this { .title, .ratings } as this
```

**Expected Cypher params**

```cypher-params
{
    "this_ratings_IN": 4.0
}
```

---

### WHERE NOT IN

**GraphQL input**

```graphql
{
    movies(where: { ratings_NOT_IN: 4.0 }) {
        title
        ratings
    }
}
```

**Expected Cypher output**

```cypher
MATCH (this:Movie)
WHERE (NOT $this_ratings_NOT_IN IN this.ratings)
RETURN this { .title, .ratings } as this
```

**Expected Cypher params**

```cypher-params
{
    "this_ratings_NOT_IN": 4.0
}
```

---
