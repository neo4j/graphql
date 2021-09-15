# Cypher Aggregations BigInt

Tests for aggregations on BigInt.

Schema:

```graphql
type File {
    size: BigInt!
}
```

---

## Min

### GraphQL Input

```graphql
{
    filesAggregate {
        size {
            min
        }
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:File)
RETURN { size: { min: min(this.size) } }
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
    filesAggregate {
        size {
            max
        }
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:File)
RETURN { size: { max: max(this.size) } }
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
    filesAggregate {
        size {
            average
        }
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:File)
RETURN { size: { average: avg(this.size) } }
```

### Expected Cypher Params

```json
{}
```

---

## Min and Max and Average

### GraphQL Input

```graphql
{
    filesAggregate {
        size {
            min
            max
            average
        }
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:File)
RETURN { size: { min: min(this.size), max: max(this.size), average: avg(this.size) } }
```

### Expected Cypher Params

```json
{}
```

---
