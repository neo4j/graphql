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
WITH min(this.title) AS mintitle
WITH mintitle
RETURN { title: { min: mintitle } }
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
WITH max(this.title) AS maxtitle
WITH maxtitle
RETURN { title: { max: maxtitle } }
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
WITH min(this.title) AS mintitle, max(this.title) AS maxtitle
WITH mintitle, maxtitle
RETURN { title: { min: mintitle,max: maxtitle } }
```

### Expected Cypher Params

```json
{}
```

---
