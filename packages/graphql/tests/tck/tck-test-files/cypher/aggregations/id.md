# Cypher Aggregations ID

Tests for aggregations on ID.

Schema:

```graphql
type Movie {
    id: ID!
}
```

---

## Min

### GraphQL Input

```graphql
{
    moviesAggregate {
        id {
            shortest
        }
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Movie)
RETURN { id: { shortest: min(this.id) } }
```

### Expected Cypher Params

```json
{}
```

---

## Max

### GraphQL Input

```graphql
{
    moviesAggregate {
        id {
            longest
        }
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Movie)
RETURN { id: { longest: max(this.id) } }
```

### Expected Cypher Params

```json
{}
```

---

## Min and Max

### GraphQL Input

```graphql
{
    moviesAggregate {
        id {
            shortest
            longest
        }
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Movie)
RETURN { id: { shortest: min(this.id), longest: max(this.id) } }
```

### Expected Cypher Params

```json
{}
```

---
