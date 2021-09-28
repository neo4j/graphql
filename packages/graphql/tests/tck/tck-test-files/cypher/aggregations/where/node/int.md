# Cypher Aggregations where node with Int

Tests for queries inside the relationship where aggregation arg using an Int type.

Schema:

```graphql
type User {
    someInt: Int
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
    posts(where: { likesAggregate: { node: { someInt_EQUAL: 10 } } }) {
        content
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Post)
WHERE apoc.cypher.runFirstColumn("
    MATCH (this)<-[this_likesAggregate_edge:LIKES]-(this_likesAggregate_node:User)
    RETURN this_likesAggregate_node.someInt = $this_likesAggregate_node_someInt_EQUAL ",
    { this: this, this_likesAggregate_node_someInt_EQUAL: $this_likesAggregate_node_someInt_EQUAL },
    false
)
RETURN this { .content } as this
```

### Expected Cypher Params

```json
{
    "this_likesAggregate_node_someInt_EQUAL": {
        "high": 0,
        "low": 10
    }
}
```

---

## GT

### GraphQL Input

```graphql
{
    posts(where: { likesAggregate: { node: { someInt_GT: 10 } } }) {
        content
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Post)
WHERE apoc.cypher.runFirstColumn("
    MATCH (this)<-[this_likesAggregate_edge:LIKES]-(this_likesAggregate_node:User)
    RETURN this_likesAggregate_node.someInt > $this_likesAggregate_node_someInt_GT ",
    { this: this, this_likesAggregate_node_someInt_GT: $this_likesAggregate_node_someInt_GT },
    false
)
RETURN this { .content } as this
```

### Expected Cypher Params

```json
{
    "this_likesAggregate_node_someInt_GT": {
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
    posts(where: { likesAggregate: { node: { someInt_GTE: 10 } } }) {
        content
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Post)
WHERE apoc.cypher.runFirstColumn("
    MATCH (this)<-[this_likesAggregate_edge:LIKES]-(this_likesAggregate_node:User)
    RETURN this_likesAggregate_node.someInt >= $this_likesAggregate_node_someInt_GTE ",
    { this: this, this_likesAggregate_node_someInt_GTE: $this_likesAggregate_node_someInt_GTE },
    false
)
RETURN this { .content } as this
```

### Expected Cypher Params

```json
{
    "this_likesAggregate_node_someInt_GTE": {
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
    posts(where: { likesAggregate: { node: { someInt_LT: 10 } } }) {
        content
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Post)
WHERE apoc.cypher.runFirstColumn("
    MATCH (this)<-[this_likesAggregate_edge:LIKES]-(this_likesAggregate_node:User)
    RETURN this_likesAggregate_node.someInt < $this_likesAggregate_node_someInt_LT ",
    { this: this, this_likesAggregate_node_someInt_LT: $this_likesAggregate_node_someInt_LT },
    false
)
RETURN this { .content } as this
```

### Expected Cypher Params

```json
{
    "this_likesAggregate_node_someInt_LT": {
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
    posts(where: { likesAggregate: { node: { someInt_LTE: 10 } } }) {
        content
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Post)
WHERE apoc.cypher.runFirstColumn("
    MATCH (this)<-[this_likesAggregate_edge:LIKES]-(this_likesAggregate_node:User)
    RETURN this_likesAggregate_node.someInt <= $this_likesAggregate_node_someInt_LTE ",
    { this: this, this_likesAggregate_node_someInt_LTE: $this_likesAggregate_node_someInt_LTE },
    false
)
RETURN this { .content } as this
```

### Expected Cypher Params

```json
{
    "this_likesAggregate_node_someInt_LTE": {
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
    posts(where: { likesAggregate: { node: { someInt_AVERAGE_EQUAL: 10 } } }) {
        content
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Post)
WHERE apoc.cypher.runFirstColumn("
    MATCH (this)<-[this_likesAggregate_edge:LIKES]-(this_likesAggregate_node:User)
    RETURN avg(this_likesAggregate_node.someInt) = $this_likesAggregate_node_someInt_AVERAGE_EQUAL ",
    { this: this, this_likesAggregate_node_someInt_AVERAGE_EQUAL: $this_likesAggregate_node_someInt_AVERAGE_EQUAL },
    false
)
RETURN this { .content } as this
```

### Expected Cypher Params

```json
{
    "this_likesAggregate_node_someInt_AVERAGE_EQUAL": 10
}
```

---

## AVERAGE_GT

### GraphQL Input

```graphql
{
    posts(where: { likesAggregate: { node: { someInt_AVERAGE_GT: 10 } } }) {
        content
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Post)
WHERE apoc.cypher.runFirstColumn("
    MATCH (this)<-[this_likesAggregate_edge:LIKES]-(this_likesAggregate_node:User)
    RETURN avg(this_likesAggregate_node.someInt) > $this_likesAggregate_node_someInt_AVERAGE_GT ",
    { this: this, this_likesAggregate_node_someInt_AVERAGE_GT: $this_likesAggregate_node_someInt_AVERAGE_GT },
    false
)
RETURN this { .content } as this
```

### Expected Cypher Params

```json
{
    "this_likesAggregate_node_someInt_AVERAGE_GT": 10
}
```

---

## AVERAGE_GTE

### GraphQL Input

```graphql
{
    posts(where: { likesAggregate: { node: { someInt_AVERAGE_GTE: 10 } } }) {
        content
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Post)
WHERE apoc.cypher.runFirstColumn("
    MATCH (this)<-[this_likesAggregate_edge:LIKES]-(this_likesAggregate_node:User)
    RETURN avg(this_likesAggregate_node.someInt) >= $this_likesAggregate_node_someInt_AVERAGE_GTE ",
    { this: this, this_likesAggregate_node_someInt_AVERAGE_GTE: $this_likesAggregate_node_someInt_AVERAGE_GTE },
    false
)
RETURN this { .content } as this
```

### Expected Cypher Params

```json
{
    "this_likesAggregate_node_someInt_AVERAGE_GTE": 10
}
```

---

## AVERAGE_LT

### GraphQL Input

```graphql
{
    posts(where: { likesAggregate: { node: { someInt_AVERAGE_LT: 10 } } }) {
        content
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Post)
WHERE apoc.cypher.runFirstColumn("
    MATCH (this)<-[this_likesAggregate_edge:LIKES]-(this_likesAggregate_node:User)
    RETURN avg(this_likesAggregate_node.someInt) < $this_likesAggregate_node_someInt_AVERAGE_LT ",
    { this: this, this_likesAggregate_node_someInt_AVERAGE_LT: $this_likesAggregate_node_someInt_AVERAGE_LT },
    false
)
RETURN this { .content } as this
```

### Expected Cypher Params

```json
{
    "this_likesAggregate_node_someInt_AVERAGE_LT": 10
}
```

---

## AVERAGE_LTE

### GraphQL Input

```graphql
{
    posts(where: { likesAggregate: { node: { someInt_AVERAGE_LTE: 10 } } }) {
        content
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Post)
WHERE apoc.cypher.runFirstColumn("
    MATCH (this)<-[this_likesAggregate_edge:LIKES]-(this_likesAggregate_node:User)
    RETURN avg(this_likesAggregate_node.someInt) <= $this_likesAggregate_node_someInt_AVERAGE_LTE ",
    { this: this, this_likesAggregate_node_someInt_AVERAGE_LTE: $this_likesAggregate_node_someInt_AVERAGE_LTE },
    false
)
RETURN this { .content } as this
```

### Expected Cypher Params

```json
{
    "this_likesAggregate_node_someInt_AVERAGE_LTE": 10
}
```

---
