# Cypher Aggregations where with DateTime

Tests for queries inside the relationship where aggregation arg using an DateTime type.

Schema:

```graphql
type User {
    someDateTime: DateTime
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
    posts(where: { likesAggregate: { node: { someDateTime_EQUAL: "2021-09-25T12:51:24.037Z" } } }) {
        content
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Post)
WHERE apoc.cypher.runFirstColumn("
    MATCH (this)<-[:LIKES]-(this_likesAggregate_node:User)
    RETURN this_likesAggregate_node.someDateTime = $this_likesAggregate_node_someDateTime_EQUAL ",
    { this: this, this_likesAggregate_node_someDateTime_EQUAL: $this_likesAggregate_node_someDateTime_EQUAL },
    false
)
RETURN this { .content } as this
```

### Expected Cypher Params

```json
{
    "this_likesAggregate_node_someDateTime_EQUAL": {
        "day": 25,
        "hour": 12,
        "minute": 51,
        "month": 9,
        "nanosecond": 37000000,
        "second": 24,
        "timeZoneOffsetSeconds": 0,
        "year": 2021
    }
}
```

---

## GT

### GraphQL Input

```graphql
{
    posts(where: { likesAggregate: { node: { someDateTime_GT: "2021-09-25T12:51:24.037Z" } } }) {
        content
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Post)
WHERE apoc.cypher.runFirstColumn("
    MATCH (this)<-[:LIKES]-(this_likesAggregate_node:User)
    RETURN this_likesAggregate_node.someDateTime > $this_likesAggregate_node_someDateTime_GT ",
    { this: this, this_likesAggregate_node_someDateTime_GT: $this_likesAggregate_node_someDateTime_GT },
    false
)
RETURN this { .content } as this
```

### Expected Cypher Params

```json
{
    "this_likesAggregate_node_someDateTime_GT": {
        "day": 25,
        "hour": 12,
        "minute": 51,
        "month": 9,
        "nanosecond": 37000000,
        "second": 24,
        "timeZoneOffsetSeconds": 0,
        "year": 2021
    }
}
```

---

## GTE

### GraphQL Input

```graphql
{
    posts(where: { likesAggregate: { node: { someDateTime_GTE: "2021-09-25T12:51:24.037Z" } } }) {
        content
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Post)
WHERE apoc.cypher.runFirstColumn("
    MATCH (this)<-[:LIKES]-(this_likesAggregate_node:User)
    RETURN this_likesAggregate_node.someDateTime >= $this_likesAggregate_node_someDateTime_GTE ",
    { this: this, this_likesAggregate_node_someDateTime_GTE: $this_likesAggregate_node_someDateTime_GTE },
    false
)
RETURN this { .content } as this
```

### Expected Cypher Params

```json
{
    "this_likesAggregate_node_someDateTime_GTE": {
        "day": 25,
        "hour": 12,
        "minute": 51,
        "month": 9,
        "nanosecond": 37000000,
        "second": 24,
        "timeZoneOffsetSeconds": 0,
        "year": 2021
    }
}
```

---

## LT

### GraphQL Input

```graphql
{
    posts(where: { likesAggregate: { node: { someDateTime_LT: "2021-09-25T12:51:24.037Z" } } }) {
        content
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Post)
WHERE apoc.cypher.runFirstColumn("
    MATCH (this)<-[:LIKES]-(this_likesAggregate_node:User)
    RETURN this_likesAggregate_node.someDateTime < $this_likesAggregate_node_someDateTime_LT ",
    { this: this, this_likesAggregate_node_someDateTime_LT: $this_likesAggregate_node_someDateTime_LT },
    false
)
RETURN this { .content } as this
```

### Expected Cypher Params

```json
{
    "this_likesAggregate_node_someDateTime_LT": {
        "day": 25,
        "hour": 12,
        "minute": 51,
        "month": 9,
        "nanosecond": 37000000,
        "second": 24,
        "timeZoneOffsetSeconds": 0,
        "year": 2021
    }
}
```

---

## LTE

### GraphQL Input

```graphql
{
    posts(where: { likesAggregate: { node: { someDateTime_LTE: "2021-09-25T12:51:24.037Z" } } }) {
        content
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Post)
WHERE apoc.cypher.runFirstColumn("
    MATCH (this)<-[:LIKES]-(this_likesAggregate_node:User)
    RETURN this_likesAggregate_node.someDateTime <= $this_likesAggregate_node_someDateTime_LTE ",
    { this: this, this_likesAggregate_node_someDateTime_LTE: $this_likesAggregate_node_someDateTime_LTE },
    false
)
RETURN this { .content } as this
```

### Expected Cypher Params

```json
{
    "this_likesAggregate_node_someDateTime_LTE": {
        "day": 25,
        "hour": 12,
        "minute": 51,
        "month": 9,
        "nanosecond": 37000000,
        "second": 24,
        "timeZoneOffsetSeconds": 0,
        "year": 2021
    }
}
```

---
