# Cypher Where Aggregations with @node directive

Schema:

```graphql
type User @node(label: "_User", additionalLabels: ["additionalUser"]) {
    someName: String
}

type Post @node(label: "_Post", additionalLabels: ["additionalPost"]) {
    content: String!
    likes: [User] @relationship(type: "LIKES", direction: IN)
}
```

---

## GT with node directive

### GraphQL Input

```graphql
{
    posts(where: { likesAggregate: { node: { someName_GT: 1 } } }) {
        content
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:_Post:additionalPost)
WHERE apoc.cypher.runFirstColumn("
    MATCH (this)<-[this_likesAggregate_edge:LIKES]-(this_likesAggregate_node:_User:additionalUser)
    RETURN size(this_likesAggregate_node.someName) > $this_likesAggregate_node_someName_GT ",
    { this: this, this_likesAggregate_node_someName_GT: $this_likesAggregate_node_someName_GT },
    false
)
RETURN this { .content } as this
```

### Expected Cypher Params

```json
{
    "this_likesAggregate_node_someName_GT": {
        "high": 0,
        "low": 1
    }
}
```

---
