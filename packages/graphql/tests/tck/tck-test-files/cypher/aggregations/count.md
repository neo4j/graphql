# Cypher Aggregations Count

Tests for queries using count

Schema:

```graphql
type Movie {
    title: String!
}
```

---

## Simple Count

### GraphQL Input

```graphql
{
    moviesAggregate {
        count
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Movie)
WITH count(this) AS thisCount
WITH thisCount
RETURN { count: thisCount }
```

### Expected Cypher Params

```json
{}
```

---

## Count with WHERE

### GraphQL Input

```graphql
{
    moviesAggregate(where: { title: "some-title" }) {
        count
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Movie)
WHERE this.title = $this_title
WITH count(this) AS thisCount
WITH thisCount
RETURN { count: thisCount }
```

### Expected Cypher Params

```json
{
    "this_title": "some-title"
}
```

---
