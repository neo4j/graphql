# Cypher Aggregations String

Tests for aggregations on String.

Schema:

```graphql
type Movie {
    title: String!
}
```

---

## Min

### GraphQL Input

```graphql
{
    moviesAggregate {
        title {
            min
        }
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Movie)
RETURN { title: { min: min(this.title) } }
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
        title {
            max
        }
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Movie)
RETURN { title: { max: max(this.title) } }
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
        title {
            min
            max
        }
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Movie)
RETURN { title: { min: min(this.title), max: max(this.title) } }
```

### Expected Cypher Params

```json
{}
```

---
