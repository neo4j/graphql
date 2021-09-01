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
WITH min(this.id) AS minid
WITH minid
RETURN { id: { min: minid } }
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
WITH max(this.id) AS maxid
WITH maxid
RETURN { id: { max: maxid } }
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
WITH min(this.id) AS minid, max(this.id) AS maxid
WITH minid, maxid
RETURN { id: { min: minid,max: maxid } }
```

### Expected Cypher Params

```json
{}
```

---
