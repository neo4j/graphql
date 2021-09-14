# Cypher Aggregations Time

Tests for aggregations on Time.

Schema:

```graphql
type Movie {
    createdAt: Time!
}
```

---

## Min

### GraphQL Input

```graphql
{
    moviesAggregate {
        createdAt {
            min
        }
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Movie)
RETURN { createdAt: { min: min(this.createdAt) } }
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
        createdAt {
            max
        }
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Movie)
RETURN { createdAt: { max: max(this.createdAt) } }
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
        createdAt {
            min
            max
        }
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Movie)
RETURN { createdAt: { min: min(this.createdAt), max: max(this.createdAt) } }
```

### Expected Cypher Params

```json
{}
```

---
