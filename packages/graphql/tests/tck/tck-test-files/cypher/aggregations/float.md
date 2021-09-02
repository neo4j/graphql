# Cypher Aggregations Float

Tests for aggregations on Float.

Schema:

```graphql
type Movie {
    actorCount: Float!
}
```

---

## Min

### GraphQL Input

```graphql
{
    moviesAggregate {
        actorCount {
            min
        }
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Movie)
RETURN { actorCount: { min: min(this.actorCount) } }
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
        actorCount {
            max
        }
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Movie)
RETURN { actorCount: { max: max(this.actorCount) } }
```

### Expected Cypher Params

```json
{}
```

---

## Average

### GraphQL Input

```graphql
{
    moviesAggregate {
        actorCount {
            average
        }
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Movie)
RETURN { actorCount: { average: avg(this.actorCount) } }
```

### Expected Cypher Params

```json
{}
```

---

## Min, Max and Average

### GraphQL Input

```graphql
{
    moviesAggregate {
        actorCount {
            min
            max
            average
        }
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Movie)
RETURN { actorCount: { min: min(this.actorCount), max: max(this.actorCount), average: avg(this.actorCount) } }
```

### Expected Cypher Params

```json
{}
```

---
