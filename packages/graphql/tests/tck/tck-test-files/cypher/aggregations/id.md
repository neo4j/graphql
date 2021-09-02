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
            min
        }
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Movie)
RETURN { id: { min: min(this.id) } }
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
            max
        }
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Movie)
RETURN { id: { max: max(this.id) } }
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
            min
            max
        }
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Movie)
RETURN { id: { min: min(this.id), max: max(this.id) } }
```

### Expected Cypher Params

```json
{}
```

---
