# Cypher Aggregations where edge with ID

Tests for queries inside the relationship where aggregation arg using an ID type.

Schema:

```graphql
type User {
    name: String!
}

type Post {
    content: String!
    likes: [User] @relationship(type: "LIKES", direction: IN, properties: "Liked")
}

interface Liked {
    id: ID
}
```

---

## EQUAL

### GraphQL Input

```graphql
{
    posts(where: { likesAggregate: { edge: { id_EQUAL: "10" } } }) {
        content
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Post)
WHERE apoc.cypher.runFirstColumn("
    MATCH (this)<-[this_likesAggregate_edge:LIKES]-(this_likesAggregate_node:User)
    RETURN this_likesAggregate_edge.id = $this_likesAggregate_edge_id_EQUAL ",
    { this: this, this_likesAggregate_edge_id_EQUAL: $this_likesAggregate_edge_id_EQUAL },
    false
)
RETURN this { .content } as this
```

### Expected Cypher Params

```json
{
    "this_likesAggregate_edge_id_EQUAL": "10"
}
```

---
