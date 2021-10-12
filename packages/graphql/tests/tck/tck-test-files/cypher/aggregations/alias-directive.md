# Cypher Aggregations Many with Alias directive

Should preform many aggregations using the alias directive

Schema:

```graphql
type Movie {
    id: ID! @alias(property: "_id")
    title: String! @alias(property: "_title")
    imdbRating: Int! @alias(property: "_imdbRating")
    createdAt: DateTime! @alias(property: "_createdAt")
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
    id: { shortest: min(this._id), longest: max(this._id) },
    title: { shortest: reduce(shortest = collect(this._title)[0], current IN collect(this._title) | apoc.cypher.runFirstColumn(" RETURN CASE size(current) < size(shortest) WHEN true THEN current ELSE shortest END AS result ", { current: current, shortest: shortest }, false)) , longest: reduce(shortest = collect(this._title)[0], current IN collect(this._title) | apoc.cypher.runFirstColumn(" RETURN CASE size(current) > size(shortest) WHEN true THEN current ELSE shortest END AS result ", { current: current, shortest: shortest }, false)) },
    imdbRating: { min: min(this._imdbRating), max: max(this._imdbRating), average: avg(this._imdbRating) },
    createdAt: { min: apoc.date.convertFormat(toString(min(this._createdAt)), "iso_zoned_date_time", "iso_offset_date_time"), max: apoc.date.convertFormat(toString(max(this._createdAt)), "iso_zoned_date_time", "iso_offset_date_time") }
}
```

### Expected Cypher Params

```json
{}
```

---
