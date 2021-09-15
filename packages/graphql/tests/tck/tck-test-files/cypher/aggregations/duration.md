# Cypher Aggregations Duration

Tests for aggregations on Duration.

Schema:

```graphql
type Movie {
    screenTime: Duration!
}
```

---

## Min

### GraphQL Input

```graphql
{
    moviesAggregate {
        screenTime {
            min
        }
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Movie)
RETURN { screenTime: { min: min(this.screenTime) } }
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
        screenTime {
            max
        }
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Movie)
RETURN { screenTime: { max: max(this.screenTime) } }
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
        screenTime {
            min
            max
        }
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Movie)
RETURN { screenTime: { min: min(this.screenTime), max: max(this.screenTime) } }
```

### Expected Cypher Params

```json
{}
```

---
