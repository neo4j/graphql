# Cypher Aggregations where edge with DateTime

Tests for queries inside the relationship where aggregation arg using an DateTime type.

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
    someDateTime: DateTime
    someDateTimeAlias: DateTime @alias(property: "_someDateTimeAlias")
}
```

---

## EQUAL

### GraphQL Input

```graphql
{
    posts(where: { likesAggregate: { edge: { someDateTime_EQUAL: "2021-09-25T12:51:24.037Z" } } }) {
        content
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Post)
WHERE apoc.cypher.runFirstColumn("
    MATCH (this)<-[this_likesAggregate_edge:LIKES]-(this_likesAggregate_node:User)
    RETURN this_likesAggregate_edge.someDateTime = $this_likesAggregate_edge_someDateTime_EQUAL ",
    { this: this, this_likesAggregate_edge_someDateTime_EQUAL: $this_likesAggregate_edge_someDateTime_EQUAL },
    false
)
RETURN this { .content } as this
```

### Expected Cypher Params

```json
{
    "this_likesAggregate_edge_someDateTime_EQUAL": {
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

## EQUAL with alias

### GraphQL Input

```graphql
{
    posts(where: { likesAggregate: { edge: { someDateTimeAlias_EQUAL: "2021-09-25T12:51:24.037Z" } } }) {
        content
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Post)
WHERE apoc.cypher.runFirstColumn("
    MATCH (this)<-[this_likesAggregate_edge:LIKES]-(this_likesAggregate_node:User)
    RETURN this_likesAggregate_edge._someDateTimeAlias = $this_likesAggregate_edge_someDateTimeAlias_EQUAL ",
    { this: this, this_likesAggregate_edge_someDateTimeAlias_EQUAL: $this_likesAggregate_edge_someDateTimeAlias_EQUAL },
    false
)
RETURN this { .content } as this
```

### Expected Cypher Params

```json
{
    "this_likesAggregate_edge_someDateTimeAlias_EQUAL": {
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
    posts(where: { likesAggregate: { edge: { someDateTime_GT: "2021-09-25T12:51:24.037Z" } } }) {
        content
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Post)
WHERE apoc.cypher.runFirstColumn("
    MATCH (this)<-[this_likesAggregate_edge:LIKES]-(this_likesAggregate_node:User)
    RETURN this_likesAggregate_edge.someDateTime > $this_likesAggregate_edge_someDateTime_GT ",
    { this: this, this_likesAggregate_edge_someDateTime_GT: $this_likesAggregate_edge_someDateTime_GT },
    false
)
RETURN this { .content } as this
```

### Expected Cypher Params

```json
{
    "this_likesAggregate_edge_someDateTime_GT": {
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
    posts(where: { likesAggregate: { edge: { someDateTime_GTE: "2021-09-25T12:51:24.037Z" } } }) {
        content
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Post)
WHERE apoc.cypher.runFirstColumn("
    MATCH (this)<-[this_likesAggregate_edge:LIKES]-(this_likesAggregate_node:User)
    RETURN this_likesAggregate_edge.someDateTime >= $this_likesAggregate_edge_someDateTime_GTE ",
    { this: this, this_likesAggregate_edge_someDateTime_GTE: $this_likesAggregate_edge_someDateTime_GTE },
    false
)
RETURN this { .content } as this
```

### Expected Cypher Params

```json
{
    "this_likesAggregate_edge_someDateTime_GTE": {
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
    posts(where: { likesAggregate: { edge: { someDateTime_LT: "2021-09-25T12:51:24.037Z" } } }) {
        content
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Post)
WHERE apoc.cypher.runFirstColumn("
    MATCH (this)<-[this_likesAggregate_edge:LIKES]-(this_likesAggregate_node:User)
    RETURN this_likesAggregate_edge.someDateTime < $this_likesAggregate_edge_someDateTime_LT ",
    { this: this, this_likesAggregate_edge_someDateTime_LT: $this_likesAggregate_edge_someDateTime_LT },
    false
)
RETURN this { .content } as this
```

### Expected Cypher Params

```json
{
    "this_likesAggregate_edge_someDateTime_LT": {
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
    posts(where: { likesAggregate: { edge: { someDateTime_LTE: "2021-09-25T12:51:24.037Z" } } }) {
        content
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Post)
WHERE apoc.cypher.runFirstColumn("
    MATCH (this)<-[this_likesAggregate_edge:LIKES]-(this_likesAggregate_node:User)
    RETURN this_likesAggregate_edge.someDateTime <= $this_likesAggregate_edge_someDateTime_LTE ",
    { this: this, this_likesAggregate_edge_someDateTime_LTE: $this_likesAggregate_edge_someDateTime_LTE },
    false
)
RETURN this { .content } as this
```

### Expected Cypher Params

```json
{
    "this_likesAggregate_edge_someDateTime_LTE": {
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

## MIN_EQUAL

### GraphQL Input

```graphql
{
    posts(where: { likesAggregate: { edge: { someDateTime_MIN_EQUAL: "2021-09-25T12:51:24.037Z" } } }) {
        content
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Post)
WHERE apoc.cypher.runFirstColumn("
    MATCH (this)<-[this_likesAggregate_edge:LIKES]-(this_likesAggregate_node:User)
    RETURN min(this_likesAggregate_edge.someDateTime) = $this_likesAggregate_edge_someDateTime_MIN_EQUAL ",
    { this: this, this_likesAggregate_edge_someDateTime_MIN_EQUAL: $this_likesAggregate_edge_someDateTime_MIN_EQUAL },
    false
)
RETURN this { .content } as this
```

### Expected Cypher Params

```json
{
    "this_likesAggregate_edge_someDateTime_MIN_EQUAL": {
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

## MIN_GT

### GraphQL Input

```graphql
{
    posts(where: { likesAggregate: { edge: { someDateTime_MIN_GT: "2021-09-25T12:51:24.037Z" } } }) {
        content
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Post)
WHERE apoc.cypher.runFirstColumn("
    MATCH (this)<-[this_likesAggregate_edge:LIKES]-(this_likesAggregate_node:User)
    RETURN min(this_likesAggregate_edge.someDateTime) > $this_likesAggregate_edge_someDateTime_MIN_GT ",
    { this: this, this_likesAggregate_edge_someDateTime_MIN_GT: $this_likesAggregate_edge_someDateTime_MIN_GT },
    false
)
RETURN this { .content } as this
```

### Expected Cypher Params

```json
{
    "this_likesAggregate_edge_someDateTime_MIN_GT": {
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

## MIN_GTE

### GraphQL Input

```graphql
{
    posts(where: { likesAggregate: { edge: { someDateTime_MIN_GTE: "2021-09-25T12:51:24.037Z" } } }) {
        content
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Post)
WHERE apoc.cypher.runFirstColumn("
    MATCH (this)<-[this_likesAggregate_edge:LIKES]-(this_likesAggregate_node:User)
    RETURN min(this_likesAggregate_edge.someDateTime) >= $this_likesAggregate_edge_someDateTime_MIN_GTE ",
    { this: this, this_likesAggregate_edge_someDateTime_MIN_GTE: $this_likesAggregate_edge_someDateTime_MIN_GTE },
    false
)
RETURN this { .content } as this
```

### Expected Cypher Params

```json
{
    "this_likesAggregate_edge_someDateTime_MIN_GTE": {
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

## MIN_LT

### GraphQL Input

```graphql
{
    posts(where: { likesAggregate: { edge: { someDateTime_MIN_LT: "2021-09-25T12:51:24.037Z" } } }) {
        content
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Post)
WHERE apoc.cypher.runFirstColumn("
    MATCH (this)<-[this_likesAggregate_edge:LIKES]-(this_likesAggregate_node:User)
    RETURN min(this_likesAggregate_edge.someDateTime) < $this_likesAggregate_edge_someDateTime_MIN_LT ",
    { this: this, this_likesAggregate_edge_someDateTime_MIN_LT: $this_likesAggregate_edge_someDateTime_MIN_LT },
    false
)
RETURN this { .content } as this
```

### Expected Cypher Params

```json
{
    "this_likesAggregate_edge_someDateTime_MIN_LT": {
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

## MIN_LTE

### GraphQL Input

```graphql
{
    posts(where: { likesAggregate: { edge: { someDateTime_MIN_LTE: "2021-09-25T12:51:24.037Z" } } }) {
        content
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Post)
WHERE apoc.cypher.runFirstColumn("
    MATCH (this)<-[this_likesAggregate_edge:LIKES]-(this_likesAggregate_node:User)
    RETURN min(this_likesAggregate_edge.someDateTime) <= $this_likesAggregate_edge_someDateTime_MIN_LTE ",
    { this: this, this_likesAggregate_edge_someDateTime_MIN_LTE: $this_likesAggregate_edge_someDateTime_MIN_LTE },
    false
)
RETURN this { .content } as this
```

### Expected Cypher Params

```json
{
    "this_likesAggregate_edge_someDateTime_MIN_LTE": {
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

## MAX_EQUAL

### GraphQL Input

```graphql
{
    posts(where: { likesAggregate: { edge: { someDateTime_MAX_EQUAL: "2021-09-25T12:51:24.037Z" } } }) {
        content
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Post)
WHERE apoc.cypher.runFirstColumn("
    MATCH (this)<-[this_likesAggregate_edge:LIKES]-(this_likesAggregate_node:User)
    RETURN max(this_likesAggregate_edge.someDateTime) = $this_likesAggregate_edge_someDateTime_MAX_EQUAL ",
    { this: this, this_likesAggregate_edge_someDateTime_MAX_EQUAL: $this_likesAggregate_edge_someDateTime_MAX_EQUAL },
    false
)
RETURN this { .content } as this
```

### Expected Cypher Params

```json
{
    "this_likesAggregate_edge_someDateTime_MAX_EQUAL": {
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

## MAX_GT

### GraphQL Input

```graphql
{
    posts(where: { likesAggregate: { edge: { someDateTime_MAX_GT: "2021-09-25T12:51:24.037Z" } } }) {
        content
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Post)
WHERE apoc.cypher.runFirstColumn("
    MATCH (this)<-[this_likesAggregate_edge:LIKES]-(this_likesAggregate_node:User)
    RETURN max(this_likesAggregate_edge.someDateTime) > $this_likesAggregate_edge_someDateTime_MAX_GT ",
    { this: this, this_likesAggregate_edge_someDateTime_MAX_GT: $this_likesAggregate_edge_someDateTime_MAX_GT },
    false
)
RETURN this { .content } as this
```

### Expected Cypher Params

```json
{
    "this_likesAggregate_edge_someDateTime_MAX_GT": {
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

## MAX_GTE

### GraphQL Input

```graphql
{
    posts(where: { likesAggregate: { edge: { someDateTime_MAX_GTE: "2021-09-25T12:51:24.037Z" } } }) {
        content
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Post)
WHERE apoc.cypher.runFirstColumn("
    MATCH (this)<-[this_likesAggregate_edge:LIKES]-(this_likesAggregate_node:User)
    RETURN max(this_likesAggregate_edge.someDateTime) >= $this_likesAggregate_edge_someDateTime_MAX_GTE ",
    { this: this, this_likesAggregate_edge_someDateTime_MAX_GTE: $this_likesAggregate_edge_someDateTime_MAX_GTE },
    false
)
RETURN this { .content } as this
```

### Expected Cypher Params

```json
{
    "this_likesAggregate_edge_someDateTime_MAX_GTE": {
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

## MAX_LT

### GraphQL Input

```graphql
{
    posts(where: { likesAggregate: { edge: { someDateTime_MAX_LT: "2021-09-25T12:51:24.037Z" } } }) {
        content
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Post)
WHERE apoc.cypher.runFirstColumn("
    MATCH (this)<-[this_likesAggregate_edge:LIKES]-(this_likesAggregate_node:User)
    RETURN max(this_likesAggregate_edge.someDateTime) < $this_likesAggregate_edge_someDateTime_MAX_LT ",
    { this: this, this_likesAggregate_edge_someDateTime_MAX_LT: $this_likesAggregate_edge_someDateTime_MAX_LT },
    false
)
RETURN this { .content } as this
```

### Expected Cypher Params

```json
{
    "this_likesAggregate_edge_someDateTime_MAX_LT": {
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

## MAX_LTE

### GraphQL Input

```graphql
{
    posts(where: { likesAggregate: { edge: { someDateTime_MAX_LTE: "2021-09-25T12:51:24.037Z" } } }) {
        content
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Post)
WHERE apoc.cypher.runFirstColumn("
    MATCH (this)<-[this_likesAggregate_edge:LIKES]-(this_likesAggregate_node:User)
    RETURN max(this_likesAggregate_edge.someDateTime) <= $this_likesAggregate_edge_someDateTime_MAX_LTE ",
    { this: this, this_likesAggregate_edge_someDateTime_MAX_LTE: $this_likesAggregate_edge_someDateTime_MAX_LTE },
    false
)
RETURN this { .content } as this
```

### Expected Cypher Params

```json
{
    "this_likesAggregate_edge_someDateTime_MAX_LTE": {
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
