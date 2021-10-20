# Field Level Aggregations Where

Field level aggregations with where filter

Schema:

```graphql
type Movie {
    title: String
    actors: [Actor] @relationship(type: "ACTED_IN", direction: IN)
    released: DateTime
}

type Actor {
    name: String
    age: Int
    movies: [Movie] @relationship(type: "ACTED_IN", direction: OUT)
}
```

---

## Count aggregation with number filter

### GraphQL Input

```graphql
query {
    movies {
        title
        actorsAggregate(where: { age_GT: 40 }) {
            count
        }
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Movie)
RETURN this { .title,
        actorsAggregate: {
            count: head(apoc.cypher.runFirstColumn("
            MATCH (this)<-[r:ACTED_IN]-(n:Actor)
            WHERE n.age > $n_age_GT
            RETURN COUNT(n)
            ", { n_age_GT: 40, this: this }))
        }
} as this
```

### Expected Cypher Params

```json
{
    "n_age_GT": {
        "low": 40,
        "high": 0
    }
}
```
