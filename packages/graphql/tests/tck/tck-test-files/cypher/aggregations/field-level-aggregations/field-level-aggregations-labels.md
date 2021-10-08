# Field Level Aggregations Alias

Field level aggregations using @alias directive

Schema:

```graphql
type Movie @node(label: "Film") {
    title: String
    actors: [Actor] @relationship(type: "ACTED_IN", direction: IN, properties: "ActedIn")
}

type Actor @node(label: "Person") {
    name: String
    age: Int
    movies: [Movie] @relationship(type: "ACTED_IN", direction: OUT, properties: "ActedIn")
}

interface ActedIn {
    time: Int
}
```

---

## Aggregation with labels

### GraphQL Input

```graphql
query {
    movies {
        actorsAggregate {
            node {
                name {
                    shortest
                }
            }
        }
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Film)
RETURN this {
    actorsAggregate: {
        node: {
            name: head(apoc.cypher.runFirstColumn("
                MATCH (this)<-[r:ACTED_IN]-(n:Person) WITH n as n
                ORDER BY size(n.name) DESC
                WITH collect(n.name) as list
                RETURN {longest: head(list), shortest: last(list)} ", { this: this }))
        }
    }
} as this
```

### Expected Cypher Params

```json
{}
```

---
