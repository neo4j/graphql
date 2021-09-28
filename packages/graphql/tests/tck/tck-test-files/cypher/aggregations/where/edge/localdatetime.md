# Cypher Aggregations where edge with LocalDateTime

Tests for queries inside the relationship where aggregation arg using an LocalDateTime type.

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
    someLocalDateTime: LocalDateTime
}
```

---

## EQUAL

### GraphQL Input

```graphql
{
    posts(where: { likesAggregate: { edge: { someLocalDateTime_EQUAL: "2003-09-14T12:00:00" } } }) {
        content
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Post)
WHERE apoc.cypher.runFirstColumn("
    MATCH (this)<-[this_likesAggregate_edge:LIKES]-(this_likesAggregate_node:User)
    RETURN this_likesAggregate_edge.someLocalDateTime = $this_likesAggregate_edge_someLocalDateTime_EQUAL ",
    { this: this, this_likesAggregate_edge_someLocalDateTime_EQUAL: $this_likesAggregate_edge_someLocalDateTime_EQUAL },
    false
)
RETURN this { .content } as this
```

### Expected Cypher Params

```json
{
    "this_likesAggregate_edge_someLocalDateTime_EQUAL": {
        "year": 2003,
        "month": 9,
        "day": 14,
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
    posts(where: { likesAggregate: { edge: { someLocalDateTime_GT: "2003-09-14T12:00:00" } } }) {
        content
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Post)
WHERE apoc.cypher.runFirstColumn("
    MATCH (this)<-[this_likesAggregate_edge:LIKES]-(this_likesAggregate_node:User)
    RETURN this_likesAggregate_edge.someLocalDateTime > $this_likesAggregate_edge_someLocalDateTime_GT ",
    { this: this, this_likesAggregate_edge_someLocalDateTime_GT: $this_likesAggregate_edge_someLocalDateTime_GT },
    false
)
RETURN this { .content } as this
```

### Expected Cypher Params

```json
{
    "this_likesAggregate_edge_someLocalDateTime_GT": {
        "year": 2003,
        "month": 9,
        "day": 14,
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
    posts(where: { likesAggregate: { edge: { someLocalDateTime_GTE: "2003-09-14T12:00:00" } } }) {
        content
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Post)
WHERE apoc.cypher.runFirstColumn("
    MATCH (this)<-[this_likesAggregate_edge:LIKES]-(this_likesAggregate_node:User)
    RETURN this_likesAggregate_edge.someLocalDateTime >= $this_likesAggregate_edge_someLocalDateTime_GTE ",
    { this: this, this_likesAggregate_edge_someLocalDateTime_GTE: $this_likesAggregate_edge_someLocalDateTime_GTE },
    false
)
RETURN this { .content } as this
```

### Expected Cypher Params

```json
{
    "this_likesAggregate_edge_someLocalDateTime_GTE": {
        "year": 2003,
        "month": 9,
        "day": 14,
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
    posts(where: { likesAggregate: { edge: { someLocalDateTime_LT: "2003-09-14T12:00:00" } } }) {
        content
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Post)
WHERE apoc.cypher.runFirstColumn("
    MATCH (this)<-[this_likesAggregate_edge:LIKES]-(this_likesAggregate_node:User)
    RETURN this_likesAggregate_edge.someLocalDateTime < $this_likesAggregate_edge_someLocalDateTime_LT ",
    { this: this, this_likesAggregate_edge_someLocalDateTime_LT: $this_likesAggregate_edge_someLocalDateTime_LT },
    false
)
RETURN this { .content } as this
```

### Expected Cypher Params

```json
{
    "this_likesAggregate_edge_someLocalDateTime_LT": {
        "year": 2003,
        "month": 9,
        "day": 14,
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
    posts(where: { likesAggregate: { edge: { someLocalDateTime_LTE: "2003-09-14T12:00:00" } } }) {
        content
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Post)
WHERE apoc.cypher.runFirstColumn("
    MATCH (this)<-[this_likesAggregate_edge:LIKES]-(this_likesAggregate_node:User)
    RETURN this_likesAggregate_edge.someLocalDateTime <= $this_likesAggregate_edge_someLocalDateTime_LTE ",
    { this: this, this_likesAggregate_edge_someLocalDateTime_LTE: $this_likesAggregate_edge_someLocalDateTime_LTE },
    false
)
RETURN this { .content } as this
```

### Expected Cypher Params

```json
{
    "this_likesAggregate_edge_someLocalDateTime_LTE": {
        "year": 2003,
        "month": 9,
        "day": 14,
        "hour": 12,
        "minute": 0,
        "second": 0,
        "nanosecond": 0
    }
}
```

---
