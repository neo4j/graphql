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
    someLocalDateTimeAlias: LocalDateTime @alias(property: "_someLocalDateTimeAlias")
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

## EQUAL with alias

### GraphQL Input

```graphql
{
    posts(where: { likesAggregate: { edge: { someLocalDateTimeAlias_EQUAL: "2003-09-14T12:00:00" } } }) {
        content
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Post)
WHERE apoc.cypher.runFirstColumn("
    MATCH (this)<-[this_likesAggregate_edge:LIKES]-(this_likesAggregate_node:User)
    RETURN this_likesAggregate_edge._someLocalDateTimeAlias = $this_likesAggregate_edge_someLocalDateTimeAlias_EQUAL ",
    { this: this, this_likesAggregate_edge_someLocalDateTimeAlias_EQUAL: $this_likesAggregate_edge_someLocalDateTimeAlias_EQUAL },
    false
)
RETURN this { .content } as this
```

### Expected Cypher Params

```json
{
    "this_likesAggregate_edge_someLocalDateTimeAlias_EQUAL": {
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

## MIN_EQUAL

### GraphQL Input

```graphql
{
    posts(where: { likesAggregate: { edge: { someLocalDateTime_MIN_EQUAL: "2003-09-14T12:00:00" } } }) {
        content
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Post)
WHERE apoc.cypher.runFirstColumn("
    MATCH (this)<-[this_likesAggregate_edge:LIKES]-(this_likesAggregate_node:User)
    RETURN min(this_likesAggregate_edge.someLocalDateTime) = $this_likesAggregate_edge_someLocalDateTime_MIN_EQUAL ",
    { this: this, this_likesAggregate_edge_someLocalDateTime_MIN_EQUAL: $this_likesAggregate_edge_someLocalDateTime_MIN_EQUAL },
    false
)
RETURN this { .content } as this
```

### Expected Cypher Params

```json
{
    "this_likesAggregate_edge_someLocalDateTime_MIN_EQUAL": {
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

## MIN_GT

### GraphQL Input

```graphql
{
    posts(where: { likesAggregate: { edge: { someLocalDateTime_MIN_GT: "2003-09-14T12:00:00" } } }) {
        content
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Post)
WHERE apoc.cypher.runFirstColumn("
    MATCH (this)<-[this_likesAggregate_edge:LIKES]-(this_likesAggregate_node:User)
    RETURN min(this_likesAggregate_edge.someLocalDateTime) > $this_likesAggregate_edge_someLocalDateTime_MIN_GT ",
    { this: this, this_likesAggregate_edge_someLocalDateTime_MIN_GT: $this_likesAggregate_edge_someLocalDateTime_MIN_GT },
    false
)
RETURN this { .content } as this
```

### Expected Cypher Params

```json
{
    "this_likesAggregate_edge_someLocalDateTime_MIN_GT": {
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

## MIN_GTE

### GraphQL Input

```graphql
{
    posts(where: { likesAggregate: { edge: { someLocalDateTime_MIN_GTE: "2003-09-14T12:00:00" } } }) {
        content
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Post)
WHERE apoc.cypher.runFirstColumn("
    MATCH (this)<-[this_likesAggregate_edge:LIKES]-(this_likesAggregate_node:User)
    RETURN min(this_likesAggregate_edge.someLocalDateTime) >= $this_likesAggregate_edge_someLocalDateTime_MIN_GTE ",
    { this: this, this_likesAggregate_edge_someLocalDateTime_MIN_GTE: $this_likesAggregate_edge_someLocalDateTime_MIN_GTE },
    false
)
RETURN this { .content } as this
```

### Expected Cypher Params

```json
{
    "this_likesAggregate_edge_someLocalDateTime_MIN_GTE": {
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

## MIN_LT

### GraphQL Input

```graphql
{
    posts(where: { likesAggregate: { edge: { someLocalDateTime_MIN_LT: "2003-09-14T12:00:00" } } }) {
        content
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Post)
WHERE apoc.cypher.runFirstColumn("
    MATCH (this)<-[this_likesAggregate_edge:LIKES]-(this_likesAggregate_node:User)
    RETURN min(this_likesAggregate_edge.someLocalDateTime) < $this_likesAggregate_edge_someLocalDateTime_MIN_LT ",
    { this: this, this_likesAggregate_edge_someLocalDateTime_MIN_LT: $this_likesAggregate_edge_someLocalDateTime_MIN_LT },
    false
)
RETURN this { .content } as this
```

### Expected Cypher Params

```json
{
    "this_likesAggregate_edge_someLocalDateTime_MIN_LT": {
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

## MIN_LTE

### GraphQL Input

```graphql
{
    posts(where: { likesAggregate: { edge: { someLocalDateTime_MIN_LTE: "2003-09-14T12:00:00" } } }) {
        content
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Post)
WHERE apoc.cypher.runFirstColumn("
    MATCH (this)<-[this_likesAggregate_edge:LIKES]-(this_likesAggregate_node:User)
    RETURN min(this_likesAggregate_edge.someLocalDateTime) <= $this_likesAggregate_edge_someLocalDateTime_MIN_LTE ",
    { this: this, this_likesAggregate_edge_someLocalDateTime_MIN_LTE: $this_likesAggregate_edge_someLocalDateTime_MIN_LTE },
    false
)
RETURN this { .content } as this
```

### Expected Cypher Params

```json
{
    "this_likesAggregate_edge_someLocalDateTime_MIN_LTE": {
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

## MAX_EQUAL

### GraphQL Input

```graphql
{
    posts(where: { likesAggregate: { edge: { someLocalDateTime_MAX_EQUAL: "2003-09-14T12:00:00" } } }) {
        content
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Post)
WHERE apoc.cypher.runFirstColumn("
    MATCH (this)<-[this_likesAggregate_edge:LIKES]-(this_likesAggregate_node:User)
    RETURN max(this_likesAggregate_edge.someLocalDateTime) = $this_likesAggregate_edge_someLocalDateTime_MAX_EQUAL ",
    { this: this, this_likesAggregate_edge_someLocalDateTime_MAX_EQUAL: $this_likesAggregate_edge_someLocalDateTime_MAX_EQUAL },
    false
)
RETURN this { .content } as this
```

### Expected Cypher Params

```json
{
    "this_likesAggregate_edge_someLocalDateTime_MAX_EQUAL": {
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

## MAX_GT

### GraphQL Input

```graphql
{
    posts(where: { likesAggregate: { edge: { someLocalDateTime_MAX_GT: "2003-09-14T12:00:00" } } }) {
        content
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Post)
WHERE apoc.cypher.runFirstColumn("
    MATCH (this)<-[this_likesAggregate_edge:LIKES]-(this_likesAggregate_node:User)
    RETURN max(this_likesAggregate_edge.someLocalDateTime) > $this_likesAggregate_edge_someLocalDateTime_MAX_GT ",
    { this: this, this_likesAggregate_edge_someLocalDateTime_MAX_GT: $this_likesAggregate_edge_someLocalDateTime_MAX_GT },
    false
)
RETURN this { .content } as this
```

### Expected Cypher Params

```json
{
    "this_likesAggregate_edge_someLocalDateTime_MAX_GT": {
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

## MAX_GTE

### GraphQL Input

```graphql
{
    posts(where: { likesAggregate: { edge: { someLocalDateTime_MAX_GTE: "2003-09-14T12:00:00" } } }) {
        content
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Post)
WHERE apoc.cypher.runFirstColumn("
    MATCH (this)<-[this_likesAggregate_edge:LIKES]-(this_likesAggregate_node:User)
    RETURN max(this_likesAggregate_edge.someLocalDateTime) >= $this_likesAggregate_edge_someLocalDateTime_MAX_GTE ",
    { this: this, this_likesAggregate_edge_someLocalDateTime_MAX_GTE: $this_likesAggregate_edge_someLocalDateTime_MAX_GTE },
    false
)
RETURN this { .content } as this
```

### Expected Cypher Params

```json
{
    "this_likesAggregate_edge_someLocalDateTime_MAX_GTE": {
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

## MAX_LT

### GraphQL Input

```graphql
{
    posts(where: { likesAggregate: { edge: { someLocalDateTime_MAX_LT: "2003-09-14T12:00:00" } } }) {
        content
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Post)
WHERE apoc.cypher.runFirstColumn("
    MATCH (this)<-[this_likesAggregate_edge:LIKES]-(this_likesAggregate_node:User)
    RETURN max(this_likesAggregate_edge.someLocalDateTime) < $this_likesAggregate_edge_someLocalDateTime_MAX_LT ",
    { this: this, this_likesAggregate_edge_someLocalDateTime_MAX_LT: $this_likesAggregate_edge_someLocalDateTime_MAX_LT },
    false
)
RETURN this { .content } as this
```

### Expected Cypher Params

```json
{
    "this_likesAggregate_edge_someLocalDateTime_MAX_LT": {
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

## MAX_LTE

### GraphQL Input

```graphql
{
    posts(where: { likesAggregate: { edge: { someLocalDateTime_MAX_LTE: "2003-09-14T12:00:00" } } }) {
        content
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Post)
WHERE apoc.cypher.runFirstColumn("
    MATCH (this)<-[this_likesAggregate_edge:LIKES]-(this_likesAggregate_node:User)
    RETURN max(this_likesAggregate_edge.someLocalDateTime) <= $this_likesAggregate_edge_someLocalDateTime_MAX_LTE ",
    { this: this, this_likesAggregate_edge_someLocalDateTime_MAX_LTE: $this_likesAggregate_edge_someLocalDateTime_MAX_LTE },
    false
)
RETURN this { .content } as this
```

### Expected Cypher Params

```json
{
    "this_likesAggregate_edge_someLocalDateTime_MAX_LTE": {
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
