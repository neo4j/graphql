# Cypher Aggregations where with ID

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
    MATCH (this)<-[:LIKES]-(this_likesAggregate_node:User)
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

## GT

### GraphQL Input

```graphql
{
    posts(where: { likesAggregate: { node: { id_GT: "10" } } }) {
        content
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Post)
WHERE apoc.cypher.runFirstColumn("
    MATCH (this)<-[:LIKES]-(this_likesAggregate_node:User)
    RETURN this_likesAggregate_node.id > $this_likesAggregate_node_id_GT ",
    { this: this, this_likesAggregate_node_id_GT: $this_likesAggregate_node_id_GT },
    false
)
RETURN this { .content } as this
```

### Expected Cypher Params

```json
{
    "this_likesAggregate_node_id_GT": "10"
}
```

---

## GTE

### GraphQL Input

```graphql
{
    posts(where: { likesAggregate: { node: { id_GTE: "10" } } }) {
        content
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Post)
WHERE apoc.cypher.runFirstColumn("
    MATCH (this)<-[:LIKES]-(this_likesAggregate_node:User)
    RETURN this_likesAggregate_node.id >= $this_likesAggregate_node_id_GTE ",
    { this: this, this_likesAggregate_node_id_GTE: $this_likesAggregate_node_id_GTE },
    false
)
RETURN this { .content } as this
```

### Expected Cypher Params

```json
{
    "this_likesAggregate_node_id_GTE": "10"
}
```

---

## LT

### GraphQL Input

```graphql
{
    posts(where: { likesAggregate: { node: { id_LT: "10" } } }) {
        content
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Post)
WHERE apoc.cypher.runFirstColumn("
    MATCH (this)<-[:LIKES]-(this_likesAggregate_node:User)
    RETURN this_likesAggregate_node.id < $this_likesAggregate_node_id_LT ",
    { this: this, this_likesAggregate_node_id_LT: $this_likesAggregate_node_id_LT },
    false
)
RETURN this { .content } as this
```

### Expected Cypher Params

```json
{
    "this_likesAggregate_node_id_LT": "10"
}
```

---

## LTE

### GraphQL Input

```graphql
{
    posts(where: { likesAggregate: { node: { id_LTE: "10" } } }) {
        content
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Post)
WHERE apoc.cypher.runFirstColumn("
    MATCH (this)<-[:LIKES]-(this_likesAggregate_node:User)
    RETURN this_likesAggregate_node.id <= $this_likesAggregate_node_id_LTE ",
    { this: this, this_likesAggregate_node_id_LTE: $this_likesAggregate_node_id_LTE },
    false
)
RETURN this { .content } as this
```

### Expected Cypher Params

```json
{
    "this_likesAggregate_node_id_LTE": "10"
}
```

---
