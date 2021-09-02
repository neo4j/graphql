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
            min
            max
        }
        title {
            min
            max
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
RETURN { id: { min: min(this.id), max: max(this.id) }, title: { min: min(this.title), max: max(this.title) }, imdbRating: { min: min(this.imdbRating), max: max(this.imdbRating), average: avg(this.imdbRating) }, createdAt: { min: apoc.date.convertFormat(toString(min(this.createdAt)), "iso_zoned_date_time", "iso_offset_date_time"), max: apoc.date.convertFormat(toString(max(this.createdAt)), "iso_zoned_date_time", "iso_offset_date_time") } }
```

### Expected Cypher Params

```json
{}
```

---
