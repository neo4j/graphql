# Cypher Count

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
    countMovies
}
```

### Expected Cypher Output

```cypher
MATCH (this:Movie)
RETURN count(this)
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
    countMovies(where: { title: "some-title" })
}
```

### Expected Cypher Output

```cypher
MATCH (this:Movie)
WHERE this.title = $this_title
RETURN count(this)
```

### Expected Cypher Params

```json
{
    "this_title": "some-title"
}
```

---
