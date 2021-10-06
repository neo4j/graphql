# Cypher Aggregations where edge with Logical AND + OR

Schema:

```graphql
type User {
    name: String
}

type Post {
    content: String!
    likes: [User] @relationship(type: "LIKES", direction: IN, properties: "Likes")
}

interface Likes {
    someFloat: Float
}
```

---

## AND

### GraphQL Input

```graphql
{
    posts(where: { likesAggregate: { edge: { AND: [{ someFloat_EQUAL: 10 }, { someFloat_EQUAL: 11 }] } } }) {
        content
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Post)
WHERE apoc.cypher.runFirstColumn("
    MATCH (this)<-[this_likesAggregate_edge:LIKES]-(this_likesAggregate_node:User)
    RETURN (this_likesAggregate_edge.someFloat = $this_likesAggregate_edge_AND_0_someFloat_EQUAL AND this_likesAggregate_edge.someFloat = $this_likesAggregate_edge_AND_1_someFloat_EQUAL) ",
    { this: this, this_likesAggregate_edge_AND_0_someFloat_EQUAL: $this_likesAggregate_edge_AND_0_someFloat_EQUAL, this_likesAggregate_edge_AND_1_someFloat_EQUAL: $this_likesAggregate_edge_AND_1_someFloat_EQUAL },
    false
)
RETURN this { .content } as this
```

### Expected Cypher Params

```json
{
    "this_likesAggregate_edge_AND_0_someFloat_EQUAL": 10,
    "this_likesAggregate_edge_AND_1_someFloat_EQUAL": 11
}
```

---

## OR

### GraphQL Input

```graphql
{
    posts(where: { likesAggregate: { edge: { OR: [{ someFloat_EQUAL: 10 }, { someFloat_EQUAL: 11 }] } } }) {
        content
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Post)
WHERE apoc.cypher.runFirstColumn("
    MATCH (this)<-[this_likesAggregate_edge:LIKES]-(this_likesAggregate_node:User)
    RETURN (this_likesAggregate_edge.someFloat = $this_likesAggregate_edge_OR_0_someFloat_EQUAL OR this_likesAggregate_edge.someFloat = $this_likesAggregate_edge_OR_1_someFloat_EQUAL) ",
    { this: this, this_likesAggregate_edge_OR_0_someFloat_EQUAL: $this_likesAggregate_edge_OR_0_someFloat_EQUAL, this_likesAggregate_edge_OR_1_someFloat_EQUAL: $this_likesAggregate_edge_OR_1_someFloat_EQUAL },
    false
)
RETURN this { .content } as this
```

### Expected Cypher Params

```json
{
    "this_likesAggregate_edge_OR_0_someFloat_EQUAL": 10,
    "this_likesAggregate_edge_OR_1_someFloat_EQUAL": 11
}
```

---
