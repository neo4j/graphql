# Field Level Aggregations Alias

Field level aggregations using @alias directive

Schema:

```graphql
type Movie {
    title: String
    actors: [Actor] @relationship(type: "ACTED_IN", direction: IN, properties: "ActedIn")
}

type Actor {
    myName: String @alias(property: "name")
    age: Int
    movies: [Movie] @relationship(type: "ACTED_IN", direction: OUT, properties: "ActedIn")
}

interface ActedIn {
    time: Int @alias(property: "screentime")
}
```

---

## Aggregation with alias

### GraphQL Input

```graphql
query {
    movies {
        actorsAggregate {
            node {
                myName {
                    shortest
                }
            }
        }
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Movie)
RETURN this {
    actorsAggregate: {
        node: {
            myName: head(apoc.cypher.runFirstColumn("
                MATCH (this)<-[r:ACTED_IN]-(n:Actor) WITH n as n
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

## Edge aggregation with alias in relationship

### GraphQL Input

```graphql
query {
    movies {
        actorsAggregate {
            edge {
                time {
                    max
                }
            }
        }
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Movie)
RETURN this {
    actorsAggregate: {
        edge: {
            time: head(apoc.cypher.runFirstColumn("
                MATCH (this)<-[r:ACTED_IN]-(n:Actor)
                RETURN {min: min(r.screentime), max: max(r.screentime), average: avg(r.screentime)} ",
            { this: this }))
        }
    }
} as this
```

### Expected Cypher Params

```json
{}
```

---
