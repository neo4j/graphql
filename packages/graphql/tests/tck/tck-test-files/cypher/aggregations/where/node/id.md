# Cypher Aggregations where node with ID

Tests for queries inside the relationship where aggregation arg using an ID type.

Schema:

```graphql
type User {
    id: ID
    name: String!
}

type Post {
    content: String!
    likes: [User] @relationship(type: "LIKES", direction: IN)
}
```

---

## EQUAL

### GraphQL Input

```graphql
{
    posts(where: { likesAggregate: { node: { id_EQUAL: "10" } } }) {
        content
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Post)
WHERE apoc.cypher.runFirstColumn("
    MATCH (this)<-[this_likesAggregate_edge:LIKES]-(this_likesAggregate_node:User)
    RETURN this_likesAggregate_node.id = $this_likesAggregate_node_id_EQUAL ",
    { this: this, this_likesAggregate_node_id_EQUAL: $this_likesAggregate_node_id_EQUAL },
    false
)
RETURN this { .content } as this
```

### Expected Cypher Params

```json
{
    "this_likesAggregate_node_id_EQUAL": "10"
}
```

---
