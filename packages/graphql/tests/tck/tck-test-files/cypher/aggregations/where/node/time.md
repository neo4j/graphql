# Cypher Aggregations where node with Time

Tests for queries inside the relationship where aggregation arg using an Time type.

Schema:

```graphql
type User {
    someTime: Time
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
    posts(where: { likesAggregate: { node: { someTime_EQUAL: "12:00:00" } } }) {
        content
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Post)
WHERE apoc.cypher.runFirstColumn("
    MATCH (this)<-[:LIKES]-(this_likesAggregate_node:User)
    RETURN this_likesAggregate_node.someTime = $this_likesAggregate_node_someTime_EQUAL ",
    { this: this, this_likesAggregate_node_someTime_EQUAL: $this_likesAggregate_node_someTime_EQUAL },
    false
)
RETURN this { .content } as this
```

### Expected Cypher Params

```json
{
    "this_likesAggregate_node_someTime_EQUAL": {
        "hour": 12,
        "minute": 0,
        "second": 0,
        "nanosecond": 0,
        "timeZoneOffsetSeconds": 0
    }
}
```

---

## GT

### GraphQL Input

```graphql
{
    posts(where: { likesAggregate: { node: { someTime_GT: "12:00:00" } } }) {
        content
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Post)
WHERE apoc.cypher.runFirstColumn("
    MATCH (this)<-[:LIKES]-(this_likesAggregate_node:User)
    RETURN this_likesAggregate_node.someTime > $this_likesAggregate_node_someTime_GT ",
    { this: this, this_likesAggregate_node_someTime_GT: $this_likesAggregate_node_someTime_GT },
    false
)
RETURN this { .content } as this
```

### Expected Cypher Params

```json
{
    "this_likesAggregate_node_someTime_GT": {
        "hour": 12,
        "minute": 0,
        "second": 0,
        "nanosecond": 0,
        "timeZoneOffsetSeconds": 0
    }
}
```

---

## GTE

### GraphQL Input

```graphql
{
    posts(where: { likesAggregate: { node: { someTime_GTE: "12:00:00" } } }) {
        content
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Post)
WHERE apoc.cypher.runFirstColumn("
    MATCH (this)<-[:LIKES]-(this_likesAggregate_node:User)
    RETURN this_likesAggregate_node.someTime >= $this_likesAggregate_node_someTime_GTE ",
    { this: this, this_likesAggregate_node_someTime_GTE: $this_likesAggregate_node_someTime_GTE },
    false
)
RETURN this { .content } as this
```

### Expected Cypher Params

```json
{
    "this_likesAggregate_node_someTime_GTE": {
        "hour": 12,
        "minute": 0,
        "second": 0,
        "nanosecond": 0,
        "timeZoneOffsetSeconds": 0
    }
}
```

---

## LT

### GraphQL Input

```graphql
{
    posts(where: { likesAggregate: { node: { someTime_LT: "12:00:00" } } }) {
        content
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Post)
WHERE apoc.cypher.runFirstColumn("
    MATCH (this)<-[:LIKES]-(this_likesAggregate_node:User)
    RETURN this_likesAggregate_node.someTime < $this_likesAggregate_node_someTime_LT ",
    { this: this, this_likesAggregate_node_someTime_LT: $this_likesAggregate_node_someTime_LT },
    false
)
RETURN this { .content } as this
```

### Expected Cypher Params

```json
{
    "this_likesAggregate_node_someTime_LT": {
        "hour": 12,
        "minute": 0,
        "second": 0,
        "nanosecond": 0,
        "timeZoneOffsetSeconds": 0
    }
}
```

---

## LTE

### GraphQL Input

```graphql
{
    posts(where: { likesAggregate: { node: { someTime_LTE: "12:00:00" } } }) {
        content
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Post)
WHERE apoc.cypher.runFirstColumn("
    MATCH (this)<-[:LIKES]-(this_likesAggregate_node:User)
    RETURN this_likesAggregate_node.someTime <= $this_likesAggregate_node_someTime_LTE ",
    { this: this, this_likesAggregate_node_someTime_LTE: $this_likesAggregate_node_someTime_LTE },
    false
)
RETURN this { .content } as this
```

### Expected Cypher Params

```json
{
    "this_likesAggregate_node_someTime_LTE": {
        "hour": 12,
        "minute": 0,
        "second": 0,
        "nanosecond": 0,
        "timeZoneOffsetSeconds": 0
    }
}
```

---
