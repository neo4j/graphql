# Cypher Aggregations where with String

Tests for queries inside the relationship where aggregation arg using an String type.

Schema:

```graphql
type User {
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
    posts(where: { likesAggregate: { node: { name_EQUAL: "10" } } }) {
        content
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Post)
WHERE apoc.cypher.runFirstColumn("
    MATCH (this)<-[:LIKES]-(this_likesAggregate_node:User)
    RETURN this_likesAggregate_node.name = $this_likesAggregate_node_name_EQUAL ",
    { this: this, this_likesAggregate_node_name_EQUAL: $this_likesAggregate_node_name_EQUAL },
    false
)
RETURN this { .content } as this
```

### Expected Cypher Params

```json
{
    "this_likesAggregate_node_name_EQUAL": "10"
}
```

---

## GT

### GraphQL Input

```graphql
{
    posts(where: { likesAggregate: { node: { name_GT: 10 } } }) {
        content
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Post)
WHERE apoc.cypher.runFirstColumn("
    MATCH (this)<-[:LIKES]-(this_likesAggregate_node:User)
    RETURN size(this_likesAggregate_node.name) > $this_likesAggregate_node_name_GT ",
    { this: this, this_likesAggregate_node_name_GT: $this_likesAggregate_node_name_GT },
    false
)
RETURN this { .content } as this
```

### Expected Cypher Params

```json
{
    "this_likesAggregate_node_name_GT": {
        "high": 0,
        "low": 10
    }
}
```

---

## GTE

### GraphQL Input

```graphql
{
    posts(where: { likesAggregate: { node: { name_GTE: 10 } } }) {
        content
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Post)
WHERE apoc.cypher.runFirstColumn("
    MATCH (this)<-[:LIKES]-(this_likesAggregate_node:User)
    RETURN size(this_likesAggregate_node.name) >= $this_likesAggregate_node_name_GTE ",
    { this: this, this_likesAggregate_node_name_GTE: $this_likesAggregate_node_name_GTE },
    false
)
RETURN this { .content } as this
```

### Expected Cypher Params

```json
{
    "this_likesAggregate_node_name_GTE": {
        "high": 0,
        "low": 10
    }
}
```

---

## LT

### GraphQL Input

```graphql
{
    posts(where: { likesAggregate: { node: { name_LT: 10 } } }) {
        content
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Post)
WHERE apoc.cypher.runFirstColumn("
    MATCH (this)<-[:LIKES]-(this_likesAggregate_node:User)
    RETURN size(this_likesAggregate_node.name) < $this_likesAggregate_node_name_LT ",
    { this: this, this_likesAggregate_node_name_LT: $this_likesAggregate_node_name_LT },
    false
)
RETURN this { .content } as this
```

### Expected Cypher Params

```json
{
    "this_likesAggregate_node_name_LT": {
        "high": 0,
        "low": 10
    }
}
```

---

## LTE

### GraphQL Input

```graphql
{
    posts(where: { likesAggregate: { node: { name_LTE: 10 } } }) {
        content
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Post)
WHERE apoc.cypher.runFirstColumn("
    MATCH (this)<-[:LIKES]-(this_likesAggregate_node:User)
    RETURN size(this_likesAggregate_node.name) <= $this_likesAggregate_node_name_LTE ",
    { this: this, this_likesAggregate_node_name_LTE: $this_likesAggregate_node_name_LTE },
    false
)
RETURN this { .content } as this
```

### Expected Cypher Params

```json
{
    "this_likesAggregate_node_name_LTE": {
        "high": 0,
        "low": 10
    }
}
```

---
