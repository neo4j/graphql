# Cypher Aggregations where edge with String

Tests for queries inside the relationship where aggregation arg using an String type.

Schema:

```graphql
type User {
    name: String!
}

type Post {
    content: String!
    likes: [User] @relationship(type: "LIKES", direction: IN, properties: "Likes")
}

interface Likes {
    someString: String
}
```

---

## EQUAL

### GraphQL Input

```graphql
{
    posts(where: { likesAggregate: { edge: { someString_EQUAL: "10" } } }) {
        content
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Post)
WHERE apoc.cypher.runFirstColumn("
    MATCH (this)<-[this_likesAggregate_edge:LIKES]-(this_likesAggregate_node:User)
    RETURN this_likesAggregate_edge.someString = $this_likesAggregate_edge_someString_EQUAL ",
    { this: this, this_likesAggregate_edge_someString_EQUAL: $this_likesAggregate_edge_someString_EQUAL },
    false
)
RETURN this { .content } as this
```

### Expected Cypher Params

```json
{
    "this_likesAggregate_edge_someString_EQUAL": "10"
}
```

---

## GT

### GraphQL Input

```graphql
{
    posts(where: { likesAggregate: { edge: { someString_GT: 10 } } }) {
        content
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Post)
WHERE apoc.cypher.runFirstColumn("
    MATCH (this)<-[this_likesAggregate_edge:LIKES]-(this_likesAggregate_node:User)
    RETURN size(this_likesAggregate_edge.someString) > $this_likesAggregate_edge_someString_GT ",
    { this: this, this_likesAggregate_edge_someString_GT: $this_likesAggregate_edge_someString_GT },
    false
)
RETURN this { .content } as this
```

### Expected Cypher Params

```json
{
    "this_likesAggregate_edge_someString_GT": {
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
    posts(where: { likesAggregate: { edge: { someString_GTE: 10 } } }) {
        content
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Post)
WHERE apoc.cypher.runFirstColumn("
    MATCH (this)<-[this_likesAggregate_edge:LIKES]-(this_likesAggregate_node:User)
    RETURN size(this_likesAggregate_edge.someString) >= $this_likesAggregate_edge_someString_GTE ",
    { this: this, this_likesAggregate_edge_someString_GTE: $this_likesAggregate_edge_someString_GTE },
    false
)
RETURN this { .content } as this
```

### Expected Cypher Params

```json
{
    "this_likesAggregate_edge_someString_GTE": {
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
    posts(where: { likesAggregate: { edge: { someString_LT: 10 } } }) {
        content
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Post)
WHERE apoc.cypher.runFirstColumn("
    MATCH (this)<-[this_likesAggregate_edge:LIKES]-(this_likesAggregate_node:User)
    RETURN size(this_likesAggregate_edge.someString) < $this_likesAggregate_edge_someString_LT ",
    { this: this, this_likesAggregate_edge_someString_LT: $this_likesAggregate_edge_someString_LT },
    false
)
RETURN this { .content } as this
```

### Expected Cypher Params

```json
{
    "this_likesAggregate_edge_someString_LT": {
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
    posts(where: { likesAggregate: { edge: { someString_LTE: 10 } } }) {
        content
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Post)
WHERE apoc.cypher.runFirstColumn("
    MATCH (this)<-[this_likesAggregate_edge:LIKES]-(this_likesAggregate_node:User)
    RETURN size(this_likesAggregate_edge.someString) <= $this_likesAggregate_edge_someString_LTE ",
    { this: this, this_likesAggregate_edge_someString_LTE: $this_likesAggregate_edge_someString_LTE },
    false
)
RETURN this { .content } as this
```

### Expected Cypher Params

```json
{
    "this_likesAggregate_edge_someString_LTE": {
        "high": 0,
        "low": 10
    }
}
```

---

## AVERAGE_EQUAL

### GraphQL Input

```graphql
{
    posts(where: { likesAggregate: { edge: { someString_AVERAGE_EQUAL: 10 } } }) {
        content
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Post)
WHERE apoc.cypher.runFirstColumn("
    MATCH (this)<-[this_likesAggregate_edge:LIKES]-(this_likesAggregate_node:User)
    WITH this_likesAggregate_node, this_likesAggregate_edge, size(this_likesAggregate_edge.someString) AS this_likesAggregate_edge_someString_AVERAGE_EQUAL_SIZE
    RETURN avg(this_likesAggregate_edge_someString_AVERAGE_EQUAL_SIZE) = toFloat($this_likesAggregate_edge_someString_AVERAGE_EQUAL) ",
    { this: this, this_likesAggregate_edge_someString_AVERAGE_EQUAL: $this_likesAggregate_edge_someString_AVERAGE_EQUAL },
    false
)
RETURN this { .content } as this
```

### Expected Cypher Params

```json
{
    "this_likesAggregate_edge_someString_AVERAGE_EQUAL": 10
}
```

---

## AVERAGE_GT

### GraphQL Input

```graphql
{
    posts(where: { likesAggregate: { edge: { someString_AVERAGE_GT: 10 } } }) {
        content
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Post)
WHERE apoc.cypher.runFirstColumn("
    MATCH (this)<-[this_likesAggregate_edge:LIKES]-(this_likesAggregate_node:User)
    WITH this_likesAggregate_node, this_likesAggregate_edge, size(this_likesAggregate_edge.someString) AS this_likesAggregate_edge_someString_AVERAGE_GT_SIZE
    RETURN avg(this_likesAggregate_edge_someString_AVERAGE_GT_SIZE) > toFloat($this_likesAggregate_edge_someString_AVERAGE_GT) ",
    { this: this, this_likesAggregate_edge_someString_AVERAGE_GT: $this_likesAggregate_edge_someString_AVERAGE_GT },
    false
)
RETURN this { .content } as this
```

### Expected Cypher Params

```json
{
    "this_likesAggregate_edge_someString_AVERAGE_GT": 10
}
```

---

## AVERAGE_GTE

### GraphQL Input

```graphql
{
    posts(where: { likesAggregate: { edge: { someString_AVERAGE_GTE: 10 } } }) {
        content
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Post)
WHERE apoc.cypher.runFirstColumn("
    MATCH (this)<-[this_likesAggregate_edge:LIKES]-(this_likesAggregate_node:User)
    WITH this_likesAggregate_node, this_likesAggregate_edge, size(this_likesAggregate_edge.someString) AS this_likesAggregate_edge_someString_AVERAGE_GTE_SIZE
    RETURN avg(this_likesAggregate_edge_someString_AVERAGE_GTE_SIZE) >= toFloat($this_likesAggregate_edge_someString_AVERAGE_GTE) ",
    { this: this, this_likesAggregate_edge_someString_AVERAGE_GTE: $this_likesAggregate_edge_someString_AVERAGE_GTE },
    false
)
RETURN this { .content } as this
```

### Expected Cypher Params

```json
{
    "this_likesAggregate_edge_someString_AVERAGE_GTE": 10
}
```

---

## AVERAGE_LT

### GraphQL Input

```graphql
{
    posts(where: { likesAggregate: { edge: { someString_AVERAGE_LT: 10 } } }) {
        content
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Post)
WHERE apoc.cypher.runFirstColumn("
    MATCH (this)<-[this_likesAggregate_edge:LIKES]-(this_likesAggregate_node:User)
    WITH this_likesAggregate_node, this_likesAggregate_edge, size(this_likesAggregate_edge.someString) AS this_likesAggregate_edge_someString_AVERAGE_LT_SIZE
    RETURN avg(this_likesAggregate_edge_someString_AVERAGE_LT_SIZE) < toFloat($this_likesAggregate_edge_someString_AVERAGE_LT) ",
    { this: this, this_likesAggregate_edge_someString_AVERAGE_LT: $this_likesAggregate_edge_someString_AVERAGE_LT },
    false
)
RETURN this { .content } as this
```

### Expected Cypher Params

```json
{
    "this_likesAggregate_edge_someString_AVERAGE_LT": 10
}
```

---

## AVERAGE_LTE

### GraphQL Input

```graphql
{
    posts(where: { likesAggregate: { edge: { someString_AVERAGE_LTE: 10 } } }) {
        content
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Post)
WHERE apoc.cypher.runFirstColumn("
    MATCH (this)<-[this_likesAggregate_edge:LIKES]-(this_likesAggregate_node:User)
    WITH this_likesAggregate_node, this_likesAggregate_edge, size(this_likesAggregate_edge.someString) AS this_likesAggregate_edge_someString_AVERAGE_LTE_SIZE
    RETURN avg(this_likesAggregate_edge_someString_AVERAGE_LTE_SIZE) <= toFloat($this_likesAggregate_edge_someString_AVERAGE_LTE) ",
    { this: this, this_likesAggregate_edge_someString_AVERAGE_LTE: $this_likesAggregate_edge_someString_AVERAGE_LTE },
    false
)
RETURN this { .content } as this
```

### Expected Cypher Params

```json
{
    "this_likesAggregate_edge_someString_AVERAGE_LTE": 10
}
```

---
