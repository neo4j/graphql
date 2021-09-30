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
    age: Int
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
MATCH (this:Movie)
RETURN this { .title,
        actorsAggregate: {
            count: head(apoc.cypher.runFirstColumn("
            MATCH (this)<-[r:ACTED_IN]-(n:Actor) RETURN COUNT(n)
            ", {this:this}))
        }
} as this
```

### Expected Cypher Params

```json
{}
```

---

## Node Aggregations and Count

### GraphQL Input

```graphql
query {
    movies {
        actorsAggregate {
            count
            node {
                name {
                    longest
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
            count: head(apoc.cypher.runFirstColumn(" MATCH (this)<-[r:ACTED_IN]-(n:Actor) RETURN COUNT(n) ", {this:this})),
            node: {
                name: head(apoc.cypher.runFirstColumn("
                    MATCH (this)<-[r:ACTED_IN]-(n:Actor)
                    WITH n as n
                    ORDER BY size(n.name) DESC
                    WITH collect(n.name) as list
                    RETURN {longest: head(list), shortest: last(list)}
                ", {this:this}))
            }
        }
} as this
```

### Expected Cypher Params

```json
{}
```

---

## Node Aggregations - Number

### GraphQL Input

```graphql
query {
    movies {
        actorsAggregate {
            node {
                age {
                    min
                    max
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
RETURN this {
        actorsAggregate: {
            node: {
                age: head(apoc.cypher.runFirstColumn("
                    MATCH (this)<-[r:ACTED_IN]-(n:Actor)
                    RETURN {min: MIN(n.age), max: MAX(n.age), average: AVG(n.age)}
                ", {this:this}))
            }
        }
} as this
```

### Expected Cypher Params

```json
{}
```

---

## Node Aggregations - String

### GraphQL Input

```graphql
query {
    movies {
        title
        actorsAggregate {
            node {
                name {
                    longest
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
RETURN this { .title,
        actorsAggregate: {
            node: {
                name: head(apoc.cypher.runFirstColumn("
                    MATCH (this)<-[r:ACTED_IN]-(n:Actor)
                    WITH n as n
                    ORDER BY size(n.name) DESC
                    WITH collect(n.name) as list
                    RETURN {longest: head(list), shortest: last(list)}
                ", {this:this}))
            }
        }
} as this
```

### Expected Cypher Params

```json
{}
```

---
