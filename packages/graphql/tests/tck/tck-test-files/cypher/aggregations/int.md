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
WITH avg(this.imdbRating) AS avgimdbRating
WITH avgimdbRating
RETURN { imdbRating: { average: avgimdbRating } }
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
WITH min(this.imdbRating) AS minimdbRating, max(this.imdbRating) AS maximdbRating, avg(this.imdbRating) AS avgimdbRating
WITH minimdbRating, maximdbRating, avgimdbRating
RETURN { imdbRating: { min: minimdbRating,max: maximdbRating,average: avgimdbRating } }
```

### Expected Cypher Params

```json
{}
```

---
