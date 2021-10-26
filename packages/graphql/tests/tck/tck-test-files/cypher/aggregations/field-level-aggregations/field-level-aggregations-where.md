# Field Level Aggregations Where

Field level aggregations with where filter

Schema:

```graphql
type Movie {
    title: String
    actors: [Person] @relationship(type: "ACTED_IN", direction: IN)
    directors: [Person] @relationship(type: "DIRECTED", direction: IN)
    released: DateTime
}

type Person {
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
            MATCH (this)<-[r:ACTED_IN]-(n:Person)
            WHERE n.age > $this_actorsAggregate_n_age_GT
            RETURN COUNT(n)
            ", { this_actorsAggregate_n_age_GT: $this_actorsAggregate_n_age_GT, this: this }))
        }
} as this
```

### Expected Cypher Params

```json
{
    "this_actorsAggregate_n_age_GT": {
        "low": 40,
        "high": 0
    }
}
```

---

## Count aggregation with colliding filter

### GraphQL Input

```graphql
query {
    movies {
        title
        actorsAggregate(where: { name_CONTAINS: "abc" }) {
            count
        }
        directorsAggregate(where: { name_CONTAINS: "abcdefg" }) {
            count
        }
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Movie)
RETURN this {
    .title,
    actorsAggregate: {
        count: head(apoc.cypher.runFirstColumn(" MATCH (this)<-[r:ACTED_IN]-(n:Person) WHERE n.name CONTAINS $this_actorsAggregate_n_name_CONTAINS RETURN COUNT(n) ", { this_actorsAggregate_n_name_CONTAINS: $this_actorsAggregate_n_name_CONTAINS, this: this }))
    },
    directorsAggregate: {
        count: head(apoc.cypher.runFirstColumn(" MATCH (this)<-[r:DIRECTED]-(n:Person) WHERE n.name CONTAINS $this_directorsAggregate_n_name_CONTAINS RETURN COUNT(n) ", { this_directorsAggregate_n_name_CONTAINS: $this_directorsAggregate_n_name_CONTAINS, this: this }))
    }
} as this
```

### Expected Cypher Params

```json
{
    "this_actorsAggregate_n_name_CONTAINS": "abc",
    "this_directorsAggregate_n_name_CONTAINS": "abcdefg"
}
```
