# Cypher Aggregations Int

Tests for aggregations on int.

Schema:

```graphql
type Movie {
    imdbRating: Int!
}
```

---

## Min

### GraphQL Input

```graphql
{
    moviesAggregate {
        imdbRating {
            min
        }
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Movie)
RETURN { imdbRating: { min: min(this.imdbRating) } }
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
        imdbRating {
            max
        }
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Movie)
RETURN { imdbRating: { max: max(this.imdbRating) } }
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
        imdbRating {
            average
        }
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Movie)
RETURN { imdbRating: { average: avg(this.imdbRating) } }
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
    moviesAggregate {
        imdbRating {
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
RETURN { imdbRating: { min: min(this.imdbRating), max: max(this.imdbRating), average: avg(this.imdbRating) } }
```

### Expected Cypher Params

```json
{}
```

---
