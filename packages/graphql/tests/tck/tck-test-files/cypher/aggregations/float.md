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
WITH min(this.actorCount) AS minactorCount
WITH minactorCount
RETURN { actorCount: { min: minactorCount } }
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
WITH max(this.actorCount) AS maxactorCount
WITH maxactorCount
RETURN { actorCount: { max: maxactorCount } }
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
WITH avg(this.actorCount) AS avgactorCount WITH avgactorCount
RETURN { actorCount: { average: avgactorCount } }
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
WITH min(this.actorCount) AS minactorCount, max(this.actorCount) AS maxactorCount, avg(this.actorCount) AS avgactorCount
WITH minactorCount, maxactorCount, avgactorCount
RETURN { actorCount: { min: minactorCount,max: maxactorCount,average: avgactorCount } }
```

### Expected Cypher Params

```json
{}
```

---
