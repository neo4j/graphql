# Field Level Aggregations

Field level aggregations with relations

Schema:

```graphql
type Movie {
    title: String
    actors: [Actor] @relationship(type: "ACTED_IN", direction: IN, properties: "ActedIn")
}

type Actor {
    name: String
    age: Int
    movies: [Movie] @relationship(type: "ACTED_IN", direction: OUT, properties: "ActedIn")
}

interface ActedIn {
    screentime: Int
}
```

---

## Edge Int Aggregations

### GraphQL Input

```graphql
query {
    movies {
        actorsAggregate {
            edge {
                screentime {
                    max
                    min
                    average
                }
            }
        }
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Movie)
RETURN this { actorsAggregate: { edge: { screentime: head(apoc.cypher.runFirstColumn("
            MATCH (this)<-[r:ACTED_IN]-(n:Actor)
            RETURN {min: min(r.screentime), max: max(r.screentime), average: avg(r.screentime)}
        ", { this: this })) } } } as this
```

### Expected Cypher Params

```json
{}
```

---
