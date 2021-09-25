# Cypher Aggregations where node with LocalTime

Tests for queries inside the relationship where aggregation arg using an LocalTime type.

Schema:

```graphql
type User {
    someLocalTime: LocalTime
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
    posts(where: { likesAggregate: { node: { someLocalTime_EQUAL: "12:00:00" } } }) {
        content
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Post)
WHERE apoc.cypher.runFirstColumn("
    MATCH (this)<-[this_likesAggregate_edge:LIKES]-(this_likesAggregate_node:User)
    RETURN this_likesAggregate_node.someLocalTime = $this_likesAggregate_node_someLocalTime_EQUAL ",
    { this: this, this_likesAggregate_node_someLocalTime_EQUAL: $this_likesAggregate_node_someLocalTime_EQUAL },
    false
)
RETURN this { .content } as this
```

### Expected Cypher Params

```json
{
    "this_likesAggregate_node_someLocalTime_EQUAL": {
        "hour": 12,
        "minute": 0,
        "second": 0,
        "nanosecond": 0
    }
}
```

---

## GT

### GraphQL Input

```graphql
{
    posts(where: { likesAggregate: { node: { someLocalTime_GT: "12:00:00" } } }) {
        content
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Post)
WHERE apoc.cypher.runFirstColumn("
    MATCH (this)<-[this_likesAggregate_edge:LIKES]-(this_likesAggregate_node:User)
    RETURN this_likesAggregate_node.someLocalTime > $this_likesAggregate_node_someLocalTime_GT ",
    { this: this, this_likesAggregate_node_someLocalTime_GT: $this_likesAggregate_node_someLocalTime_GT },
    false
)
RETURN this { .content } as this
```

### Expected Cypher Params

```json
{
    "this_likesAggregate_node_someLocalTime_GT": {
        "hour": 12,
        "minute": 0,
        "second": 0,
        "nanosecond": 0
    }
}
```

---

## GTE

### GraphQL Input

```graphql
{
    posts(where: { likesAggregate: { node: { someLocalTime_GTE: "12:00:00" } } }) {
        content
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Post)
WHERE apoc.cypher.runFirstColumn("
    MATCH (this)<-[this_likesAggregate_edge:LIKES]-(this_likesAggregate_node:User)
    RETURN this_likesAggregate_node.someLocalTime >= $this_likesAggregate_node_someLocalTime_GTE ",
    { this: this, this_likesAggregate_node_someLocalTime_GTE: $this_likesAggregate_node_someLocalTime_GTE },
    false
)
RETURN this { .content } as this
```

### Expected Cypher Params

```json
{
    "this_likesAggregate_node_someLocalTime_GTE": {
        "hour": 12,
        "minute": 0,
        "second": 0,
        "nanosecond": 0
    }
}
```

---

## LT

### GraphQL Input

```graphql
{
    posts(where: { likesAggregate: { node: { someLocalTime_LT: "12:00:00" } } }) {
        content
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Post)
WHERE apoc.cypher.runFirstColumn("
    MATCH (this)<-[this_likesAggregate_edge:LIKES]-(this_likesAggregate_node:User)
    RETURN this_likesAggregate_node.someLocalTime < $this_likesAggregate_node_someLocalTime_LT ",
    { this: this, this_likesAggregate_node_someLocalTime_LT: $this_likesAggregate_node_someLocalTime_LT },
    false
)
RETURN this { .content } as this
```

### Expected Cypher Params

```json
{
    "this_likesAggregate_node_someLocalTime_LT": {
        "hour": 12,
        "minute": 0,
        "second": 0,
        "nanosecond": 0
    }
}
```

---

## LTE

### GraphQL Input

```graphql
{
    posts(where: { likesAggregate: { node: { someLocalTime_LTE: "12:00:00" } } }) {
        content
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Post)
WHERE apoc.cypher.runFirstColumn("
    MATCH (this)<-[this_likesAggregate_edge:LIKES]-(this_likesAggregate_node:User)
    RETURN this_likesAggregate_node.someLocalTime <= $this_likesAggregate_node_someLocalTime_LTE ",
    { this: this, this_likesAggregate_node_someLocalTime_LTE: $this_likesAggregate_node_someLocalTime_LTE },
    false
)
RETURN this { .content } as this
```

### Expected Cypher Params

```json
{
    "this_likesAggregate_node_someLocalTime_LTE": {
        "hour": 12,
        "minute": 0,
        "second": 0,
        "nanosecond": 0
    }
}
```

---
