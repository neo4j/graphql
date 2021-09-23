# Label in Node directive

Custom label using @node.

Schema:

```graphql
type Actor @node(label: "Person") {
    name: String
    movies: [Movie] @relationship(type: "ACTED_IN", direction: OUT)
}

type Movie @node(label: "$jwt.movielabel") {
    id: ID
    title: String
    actors: [Actor]! @relationship(type: "ACTED_IN", direction: IN)
}
```

---

## Select Movie with label Film

### GraphQL Input

```graphql
{
    movies {
        title
    }
}
```

### JWT Object

```json
{
    "movielabel": "Film"
}
```

### Expected Cypher Output

```cypher
MATCH (this:Film)
RETURN this { .title } as this
```

### Expected Cypher Params

```json
{}
```

---
