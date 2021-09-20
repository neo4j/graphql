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
            shortest
        }
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Movie)
RETURN { title: { shortest: min(this.title) } }
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
            longest
        }
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Movie)
RETURN { title: { longest: max(this.title) } }
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
            shortest
            longest
        }
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Movie)
RETURN { title: { shortest: min(this.title), longest: max(this.title) } }
```

### Expected Cypher Params

```json
{}
```

---
