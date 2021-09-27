# Field Level Aggregations

Should preform many aggregations while using an alias on each field

Schema:

```graphql
type Movie {
    title: String
    actors: [Actor] @relationship(type: "ACTED_IN", direction: IN)
}

type Actor {
    name: String
    movies: [Movie] @relationship(type: "ACTED_IN", direction: OUT)
}
```

---

## Count Aggregation

### GraphQL Input

```graphql
query {
    movies {
        title
        actorsAggregate {
            count
        }
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Movie) RETURN this { .title, actorsAggregate: head(apoc.cypher.runFirstColumnMany("MATCH (this)<-[:ACTED_IN]-(x:Actor) RETURN {count:COUNT(x), max: MAX(x.name)}", {this:this})) } as this
```

### Expected Cypher Params

```json
{}
```

---
