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
RETURN { title: { shortest: reduce(shortest = collect(this.title)[0], current IN collect(this.title) | apoc.cypher.runFirstColumn(" RETURN CASE size(current) < size(shortest) WHEN true THEN current ELSE shortest END AS result ", { current: current, shortest: shortest }, false)) } }
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
RETURN { title: { longest: reduce(shortest = collect(this.title)[0], current IN collect(this.title) | apoc.cypher.runFirstColumn(" RETURN CASE size(current) > size(shortest) WHEN true THEN current ELSE shortest END AS result ", { current: current, shortest: shortest }, false)) } }
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
RETURN {
    title: {
        shortest: reduce(shortest = collect(this.title)[0], current IN collect(this.title) | apoc.cypher.runFirstColumn(" RETURN CASE size(current) < size(shortest) WHEN true THEN current ELSE shortest END AS result ", { current: current, shortest: shortest }, false)) ,
        longest: reduce(shortest = collect(this.title)[0], current IN collect(this.title) | apoc.cypher.runFirstColumn(" RETURN CASE size(current) > size(shortest) WHEN true THEN current ELSE shortest END AS result ", { current: current, shortest: shortest }, false))
    }
}
```

### Expected Cypher Params

```json
{}
```

---
