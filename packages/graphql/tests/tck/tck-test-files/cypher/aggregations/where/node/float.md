# Cypher Aggregations where node with Float

Tests for queries inside the relationship where aggregation arg using an Float type.

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

## EQUAL

### GraphQL Input

```graphql
{
    posts(where: { likesAggregate: { node: { someFloat_EQUAL: 10 } } }) {
        content
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Post)
WHERE apoc.cypher.runFirstColumn("
    MATCH (this)<-[:LIKES]-(this_likesAggregate_node:User)
    RETURN this_likesAggregate_node.someFloat = $this_likesAggregate_node_someFloat_EQUAL ",
    { this: this, this_likesAggregate_node_someFloat_EQUAL: $this_likesAggregate_node_someFloat_EQUAL },
    false
)
RETURN this { .content } as this
```

### Expected Cypher Params

```json
{
    "this_likesAggregate_node_someFloat_EQUAL": 10
}
```

---

## GT

### GraphQL Input

```graphql
{
    posts(where: { likesAggregate: { node: { someFloat_GT: 10 } } }) {
        content
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Post)
WHERE apoc.cypher.runFirstColumn("
    MATCH (this)<-[:LIKES]-(this_likesAggregate_node:User)
    RETURN this_likesAggregate_node.someFloat > $this_likesAggregate_node_someFloat_GT ",
    { this: this, this_likesAggregate_node_someFloat_GT: $this_likesAggregate_node_someFloat_GT },
    false
)
RETURN this { .content } as this
```

### Expected Cypher Params

```json
{
    "this_likesAggregate_node_someFloat_GT": 10
}
```

---

## GTE

### GraphQL Input

```graphql
{
    posts(where: { likesAggregate: { node: { someFloat_GTE: 10 } } }) {
        content
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Post)
WHERE apoc.cypher.runFirstColumn("
    MATCH (this)<-[:LIKES]-(this_likesAggregate_node:User)
    RETURN this_likesAggregate_node.someFloat >= $this_likesAggregate_node_someFloat_GTE ",
    { this: this, this_likesAggregate_node_someFloat_GTE: $this_likesAggregate_node_someFloat_GTE },
    false
)
RETURN this { .content } as this
```

### Expected Cypher Params

```json
{
    "this_likesAggregate_node_someFloat_GTE": 10
}
```

---

## LT

### GraphQL Input

```graphql
{
    posts(where: { likesAggregate: { node: { someFloat_LT: 10 } } }) {
        content
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Post)
WHERE apoc.cypher.runFirstColumn("
    MATCH (this)<-[:LIKES]-(this_likesAggregate_node:User)
    RETURN this_likesAggregate_node.someFloat < $this_likesAggregate_node_someFloat_LT ",
    { this: this, this_likesAggregate_node_someFloat_LT: $this_likesAggregate_node_someFloat_LT },
    false
)
RETURN this { .content } as this
```

### Expected Cypher Params

```json
{
    "this_likesAggregate_node_someFloat_LT": 10
}
```

---

## LTE

### GraphQL Input

```graphql
{
    posts(where: { likesAggregate: { node: { someFloat_LTE: 10 } } }) {
        content
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Post)
WHERE apoc.cypher.runFirstColumn("
    MATCH (this)<-[:LIKES]-(this_likesAggregate_node:User)
    RETURN this_likesAggregate_node.someFloat <= $this_likesAggregate_node_someFloat_LTE ",
    { this: this, this_likesAggregate_node_someFloat_LTE: $this_likesAggregate_node_someFloat_LTE },
    false
)
RETURN this { .content } as this
```

### Expected Cypher Params

```json
{
    "this_likesAggregate_node_someFloat_LTE": 10
}
```

---
