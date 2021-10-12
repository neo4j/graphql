# Cypher Aggregations where node with Logical AND + OR

Schema:

```graphql
type User {
    someFloat: Float
}

type Post {
    content: String!
    likes: [User] @relationship(type: "LIKES", direction: IN)
}
```

---

## AND

### GraphQL Input

```graphql
{
    posts(where: { likesAggregate: { node: { AND: [{ someFloat_EQUAL: 10 }, { someFloat_EQUAL: 11 }] } } }) {
        content
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Post)
WHERE apoc.cypher.runFirstColumn("
    MATCH (this)<-[this_likesAggregate_edge:LIKES]-(this_likesAggregate_node:User)
    RETURN (this_likesAggregate_node.someFloat = $this_likesAggregate_node_AND_0_someFloat_EQUAL AND this_likesAggregate_node.someFloat = $this_likesAggregate_node_AND_1_someFloat_EQUAL) ",
    { this: this, this_likesAggregate_node_AND_0_someFloat_EQUAL: $this_likesAggregate_node_AND_0_someFloat_EQUAL, this_likesAggregate_node_AND_1_someFloat_EQUAL: $this_likesAggregate_node_AND_1_someFloat_EQUAL },
    false
)
RETURN this { .content } as this
```

### Expected Cypher Params

```json
{
    "this_likesAggregate_node_AND_0_someFloat_EQUAL": 10,
    "this_likesAggregate_node_AND_1_someFloat_EQUAL": 11
}
```

---

## OR

### GraphQL Input

```graphql
{
    posts(where: { likesAggregate: { node: { OR: [{ someFloat_EQUAL: 10 }, { someFloat_EQUAL: 11 }] } } }) {
        content
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Post)
WHERE apoc.cypher.runFirstColumn("
    MATCH (this)<-[this_likesAggregate_edge:LIKES]-(this_likesAggregate_node:User)
    RETURN (this_likesAggregate_node.someFloat = $this_likesAggregate_node_OR_0_someFloat_EQUAL OR this_likesAggregate_node.someFloat = $this_likesAggregate_node_OR_1_someFloat_EQUAL) ",
    { this: this, this_likesAggregate_node_OR_0_someFloat_EQUAL: $this_likesAggregate_node_OR_0_someFloat_EQUAL, this_likesAggregate_node_OR_1_someFloat_EQUAL: $this_likesAggregate_node_OR_1_someFloat_EQUAL },
    false
)
RETURN this { .content } as this
```

### Expected Cypher Params

```json
{
    "this_likesAggregate_node_OR_0_someFloat_EQUAL": 10,
    "this_likesAggregate_node_OR_1_someFloat_EQUAL": 11
}
```

---
