# Cypher Aggregations DateTime

Tests for aggregations on DateTime.

Schema:

```graphql
type Movie {
    createdAt: DateTime!
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
RETURN { createdAt: { min: apoc.date.convertFormat(toString(min(this.createdAt)), "iso_zoned_date_time", "iso_offset_date_time") } }
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
RETURN { createdAt: { max: apoc.date.convertFormat(toString(max(this.createdAt)), "iso_zoned_date_time", "iso_offset_date_time") } }
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
RETURN { createdAt: { min: apoc.date.convertFormat(toString(min(this.createdAt)), "iso_zoned_date_time", "iso_offset_date_time"), max: apoc.date.convertFormat(toString(max(this.createdAt)), "iso_zoned_date_time", "iso_offset_date_time") } }
```

### Expected Cypher Params

```json
{}
```

---
