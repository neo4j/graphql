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
WITH min(this.imdbRating) AS minimdbRating
WITH minimdbRating
RETURN { imdbRating: { min: minimdbRating } }
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
WITH max(this.imdbRating) AS maximdbRating
WITH maximdbRating
RETURN { imdbRating: { max: maximdbRating } }
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
        imdbRating {
            min
            max
        }
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Movie)
WITH min(this.imdbRating) AS minimdbRating, max(this.imdbRating) AS maximdbRating
WITH minimdbRating, maximdbRating
RETURN { imdbRating: { min: minimdbRating,max: maximdbRating } }
```

### Expected Cypher Params

```json
{}
```

---
