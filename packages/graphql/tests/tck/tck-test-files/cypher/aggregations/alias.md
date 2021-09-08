# Cypher Aggregations Many while Alias fields

Should preform many aggregations while using an alias on each field

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

## Field Alias Aggregations

### GraphQL Input

```graphql
{
    moviesAggregate {
        _id: id {
            _shortest: shortest
            _longest: longest
        }
        _title: title {
            _shortest: shortest
            _longest: longest
        }
        _imdbRating: imdbRating {
            _min: min
            _max: max
            _average: average
        }
        _createdAt: createdAt {
            _min: min
            _max: max
        }
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Movie)
RETURN { _id: { _shortest: min(this.id), _longest: max(this.id) }, _title: { _shortest: min(this.title), _longest: max(this.title) }, _imdbRating: { _min: min(this.imdbRating), _max: max(this.imdbRating), _average: avg(this.imdbRating) }, _createdAt: { _min: apoc.date.convertFormat(toString(min(this.createdAt)), "iso_zoned_date_time", "iso_offset_date_time"), _max: apoc.date.convertFormat(toString(max(this.createdAt)), "iso_zoned_date_time", "iso_offset_date_time") } }
```

### Expected Cypher Params

```json
{}
```

---
