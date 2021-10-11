# Cypher Aggregations Many

Should preform many aggregations

Schema:

```graphql
type Movie {
    id: ID!
    title: String!
    imdbRating: Int!
    createdAt: DateTime!
}
```

---

## Min

### GraphQL Input

```graphql
{
    moviesAggregate {
        id {
            shortest
            longest
        }
        title {
            shortest
            longest
        }
        imdbRating {
            min
            max
            average
        }
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
RETURN {
    id: { shortest: min(this.id), longest: max(this.id) },
    title: {
        shortest: reduce(shortest = collect(this.title)[0], current IN collect(this.title) | apoc.cypher.runFirstColumn(" RETURN CASE size(current) < size(shortest) WHEN true THEN current ELSE shortest END AS result ", { current: current, shortest: shortest }, false)) ,
        longest: reduce(shortest = collect(this.title)[0], current IN collect(this.title) | apoc.cypher.runFirstColumn(" RETURN CASE size(current) > size(shortest) WHEN true THEN current ELSE shortest END AS result ", { current: current, shortest: shortest }, false))
    },
    imdbRating: { min: min(this.imdbRating), max: max(this.imdbRating), average: avg(this.imdbRating) },
    createdAt: { min: apoc.date.convertFormat(toString(min(this.createdAt)), "iso_zoned_date_time", "iso_offset_date_time"), max: apoc.date.convertFormat(toString(max(this.createdAt)), "iso_zoned_date_time", "iso_offset_date_time") }
}
```

### Expected Cypher Params

```json
{}
```

---
