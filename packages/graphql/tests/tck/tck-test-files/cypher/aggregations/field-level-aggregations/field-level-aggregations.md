# Field Level Aggregations

Field level aggregations

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
            ", { this: this }))
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
            count: head(apoc.cypher.runFirstColumn(" MATCH (this)<-[r:ACTED_IN]-(n:Actor) RETURN COUNT(n) ", { this: this })),
            node: {
                name: head(apoc.cypher.runFirstColumn("
                    MATCH (this)<-[r:ACTED_IN]-(n:Actor)
                    WITH n as n
                    ORDER BY size(n.name) DESC
                    WITH collect(n.name) as list
                    RETURN {longest: head(list), shortest: last(list)}
                ", { this: this }))
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
                    RETURN {min: min(n.age), max: max(n.age), average: avg(n.age)}
                ", { this: this }))
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
                ", { this: this }))
            }
        }
} as this
```

### Expected Cypher Params

```json
{}
```

---

## Node Aggregations - DateTime

### GraphQL Input

```graphql
query {
    actors {
        moviesAggregate {
            node {
                released {
                    min
                }
            }
        }
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Actor)
RETURN this {
    moviesAggregate: {
        node: {
            released: head(apoc.cypher.runFirstColumn("
            MATCH (this)-[r:ACTED_IN]->(n:Movie)
            RETURN {min: apoc.date.convertFormat(toString(min(n.released)), \"iso_zoned_date_time\", \"iso_offset_date_time\"),
            max: apoc.date.convertFormat(toString(max(n.released)), \"iso_zoned_date_time\", \"iso_offset_date_time\")} ", { this: this })) }
        }
} as this
```

### Expected Cypher Params

```json
{}
```

---
