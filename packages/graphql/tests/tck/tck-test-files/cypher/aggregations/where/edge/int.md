# Cypher Aggregations where edge with Int

Tests for queries inside the relationship where aggregation arg using an Int type.

Schema:

```graphql
type User {
    name: String
}

type Post {
    content: String!
    likes: [User] @relationship(type: "LIKES", direction: IN, properties: "Liked")
}

interface Liked {
    someInt: Int
    someIntAlias: Int @alias(property: "_someIntAlias")
}
```

---

## EQUAL

### GraphQL Input

```graphql
{
    posts(where: { likesAggregate: { edge: { someInt_EQUAL: 10 } } }) {
        content
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Post)
WHERE apoc.cypher.runFirstColumn("
    MATCH (this)<-[this_likesAggregate_edge:LIKES]-(this_likesAggregate_node:User)
    RETURN this_likesAggregate_edge.someInt = $this_likesAggregate_edge_someInt_EQUAL ",
    { this: this, this_likesAggregate_edge_someInt_EQUAL: $this_likesAggregate_edge_someInt_EQUAL },
    false
)
RETURN this { .content } as this
```

### Expected Cypher Params

```json
{
    "this_likesAggregate_edge_someInt_EQUAL": {
        "high": 0,
        "low": 10
    }
}
```

---

## EQUAL with alias

### GraphQL Input

```graphql
{
    posts(where: { likesAggregate: { edge: { someIntAlias_EQUAL: 10 } } }) {
        content
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Post)
WHERE apoc.cypher.runFirstColumn("
    MATCH (this)<-[this_likesAggregate_edge:LIKES]-(this_likesAggregate_node:User)
    RETURN this_likesAggregate_edge._someIntAlias = $this_likesAggregate_edge_someIntAlias_EQUAL ",
    { this: this, this_likesAggregate_edge_someIntAlias_EQUAL: $this_likesAggregate_edge_someIntAlias_EQUAL },
    false
)
RETURN this { .content } as this
```

### Expected Cypher Params

```json
{
    "this_likesAggregate_edge_someIntAlias_EQUAL": {
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
    posts(where: { likesAggregate: { edge: { someInt_GT: 10 } } }) {
        content
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Post)
WHERE apoc.cypher.runFirstColumn("
    MATCH (this)<-[this_likesAggregate_edge:LIKES]-(this_likesAggregate_node:User)
    RETURN this_likesAggregate_edge.someInt > $this_likesAggregate_edge_someInt_GT ",
    { this: this, this_likesAggregate_edge_someInt_GT: $this_likesAggregate_edge_someInt_GT },
    false
)
RETURN this { .content } as this
```

### Expected Cypher Params

```json
{
    "this_likesAggregate_edge_someInt_GT": {
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
    posts(where: { likesAggregate: { edge: { someInt_GTE: 10 } } }) {
        content
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Post)
WHERE apoc.cypher.runFirstColumn("
    MATCH (this)<-[this_likesAggregate_edge:LIKES]-(this_likesAggregate_node:User)
    RETURN this_likesAggregate_edge.someInt >= $this_likesAggregate_edge_someInt_GTE ",
    { this: this, this_likesAggregate_edge_someInt_GTE: $this_likesAggregate_edge_someInt_GTE },
    false
)
RETURN this { .content } as this
```

### Expected Cypher Params

```json
{
    "this_likesAggregate_edge_someInt_GTE": {
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
    posts(where: { likesAggregate: { edge: { someInt_LT: 10 } } }) {
        content
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Post)
WHERE apoc.cypher.runFirstColumn("
    MATCH (this)<-[this_likesAggregate_edge:LIKES]-(this_likesAggregate_node:User)
    RETURN this_likesAggregate_edge.someInt < $this_likesAggregate_edge_someInt_LT ",
    { this: this, this_likesAggregate_edge_someInt_LT: $this_likesAggregate_edge_someInt_LT },
    false
)
RETURN this { .content } as this
```

### Expected Cypher Params

```json
{
    "this_likesAggregate_edge_someInt_LT": {
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
    posts(where: { likesAggregate: { edge: { someInt_LTE: 10 } } }) {
        content
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Post)
WHERE apoc.cypher.runFirstColumn("
    MATCH (this)<-[this_likesAggregate_edge:LIKES]-(this_likesAggregate_node:User)
    RETURN this_likesAggregate_edge.someInt <= $this_likesAggregate_edge_someInt_LTE ",
    { this: this, this_likesAggregate_edge_someInt_LTE: $this_likesAggregate_edge_someInt_LTE },
    false
)
RETURN this { .content } as this
```

### Expected Cypher Params

```json
{
    "this_likesAggregate_edge_someInt_LTE": {
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
    posts(where: { likesAggregate: { edge: { someInt_AVERAGE_EQUAL: 10 } } }) {
        content
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Post)
WHERE apoc.cypher.runFirstColumn("
    MATCH (this)<-[this_likesAggregate_edge:LIKES]-(this_likesAggregate_node:User)
    RETURN avg(this_likesAggregate_edge.someInt) = $this_likesAggregate_edge_someInt_AVERAGE_EQUAL ",
    { this: this, this_likesAggregate_edge_someInt_AVERAGE_EQUAL: $this_likesAggregate_edge_someInt_AVERAGE_EQUAL },
    false
)
RETURN this { .content } as this
```

### Expected Cypher Params

```json
{
    "this_likesAggregate_edge_someInt_AVERAGE_EQUAL": 10
}
```

---

## AVERAGE_GT

### GraphQL Input

```graphql
{
    posts(where: { likesAggregate: { edge: { someInt_AVERAGE_GT: 10 } } }) {
        content
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Post)
WHERE apoc.cypher.runFirstColumn("
    MATCH (this)<-[this_likesAggregate_edge:LIKES]-(this_likesAggregate_node:User)
    RETURN avg(this_likesAggregate_edge.someInt) > $this_likesAggregate_edge_someInt_AVERAGE_GT ",
    { this: this, this_likesAggregate_edge_someInt_AVERAGE_GT: $this_likesAggregate_edge_someInt_AVERAGE_GT },
    false
)
RETURN this { .content } as this
```

### Expected Cypher Params

```json
{
    "this_likesAggregate_edge_someInt_AVERAGE_GT": 10
}
```

---

## AVERAGE_GTE

### GraphQL Input

```graphql
{
    posts(where: { likesAggregate: { edge: { someInt_AVERAGE_GTE: 10 } } }) {
        content
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Post)
WHERE apoc.cypher.runFirstColumn("
    MATCH (this)<-[this_likesAggregate_edge:LIKES]-(this_likesAggregate_node:User)
    RETURN avg(this_likesAggregate_edge.someInt) >= $this_likesAggregate_edge_someInt_AVERAGE_GTE ",
    { this: this, this_likesAggregate_edge_someInt_AVERAGE_GTE: $this_likesAggregate_edge_someInt_AVERAGE_GTE },
    false
)
RETURN this { .content } as this
```

### Expected Cypher Params

```json
{
    "this_likesAggregate_edge_someInt_AVERAGE_GTE": 10
}
```

---

## AVERAGE_LT

### GraphQL Input

```graphql
{
    posts(where: { likesAggregate: { edge: { someInt_AVERAGE_LT: 10 } } }) {
        content
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Post)
WHERE apoc.cypher.runFirstColumn("
    MATCH (this)<-[this_likesAggregate_edge:LIKES]-(this_likesAggregate_node:User)
    RETURN avg(this_likesAggregate_edge.someInt) < $this_likesAggregate_edge_someInt_AVERAGE_LT ",
    { this: this, this_likesAggregate_edge_someInt_AVERAGE_LT: $this_likesAggregate_edge_someInt_AVERAGE_LT },
    false
)
RETURN this { .content } as this
```

### Expected Cypher Params

```json
{
    "this_likesAggregate_edge_someInt_AVERAGE_LT": 10
}
```

---

## AVERAGE_LTE

### GraphQL Input

```graphql
{
    posts(where: { likesAggregate: { edge: { someInt_AVERAGE_LTE: 10 } } }) {
        content
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Post)
WHERE apoc.cypher.runFirstColumn("
    MATCH (this)<-[this_likesAggregate_edge:LIKES]-(this_likesAggregate_node:User)
    RETURN avg(this_likesAggregate_edge.someInt) <= $this_likesAggregate_edge_someInt_AVERAGE_LTE ",
    { this: this, this_likesAggregate_edge_someInt_AVERAGE_LTE: $this_likesAggregate_edge_someInt_AVERAGE_LTE },
    false
)
RETURN this { .content } as this
```

### Expected Cypher Params

```json
{
    "this_likesAggregate_edge_someInt_AVERAGE_LTE": 10
}
```

---

## MIN_EQUAL

### GraphQL Input

```graphql
{
    posts(where: { likesAggregate: { edge: { someInt_MIN_EQUAL: 10 } } }) {
        content
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Post)
WHERE apoc.cypher.runFirstColumn("
    MATCH (this)<-[this_likesAggregate_edge:LIKES]-(this_likesAggregate_node:User)
    RETURN min(this_likesAggregate_edge.someInt) = $this_likesAggregate_edge_someInt_MIN_EQUAL ",
    { this: this, this_likesAggregate_edge_someInt_MIN_EQUAL: $this_likesAggregate_edge_someInt_MIN_EQUAL },
    false
)
RETURN this { .content } as this
```

### Expected Cypher Params

```json
{
    "this_likesAggregate_edge_someInt_MIN_EQUAL": {
        "high": 0,
        "low": 10
    }
}
```

---

## MIN_GT

### GraphQL Input

```graphql
{
    posts(where: { likesAggregate: { edge: { someInt_MIN_GT: 10 } } }) {
        content
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Post)
WHERE apoc.cypher.runFirstColumn("
    MATCH (this)<-[this_likesAggregate_edge:LIKES]-(this_likesAggregate_node:User)
    RETURN min(this_likesAggregate_edge.someInt) > $this_likesAggregate_edge_someInt_MIN_GT ",
    { this: this, this_likesAggregate_edge_someInt_MIN_GT: $this_likesAggregate_edge_someInt_MIN_GT },
    false
)
RETURN this { .content } as this
```

### Expected Cypher Params

```json
{
    "this_likesAggregate_edge_someInt_MIN_GT": {
        "high": 0,
        "low": 10
    }
}
```

---

## MIN_GTE

### GraphQL Input

```graphql
{
    posts(where: { likesAggregate: { edge: { someInt_MIN_GTE: 10 } } }) {
        content
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Post)
WHERE apoc.cypher.runFirstColumn("
    MATCH (this)<-[this_likesAggregate_edge:LIKES]-(this_likesAggregate_node:User)
    RETURN min(this_likesAggregate_edge.someInt) >= $this_likesAggregate_edge_someInt_MIN_GTE ",
    { this: this, this_likesAggregate_edge_someInt_MIN_GTE: $this_likesAggregate_edge_someInt_MIN_GTE },
    false
)
RETURN this { .content } as this
```

### Expected Cypher Params

```json
{
    "this_likesAggregate_edge_someInt_MIN_GTE": {
        "high": 0,
        "low": 10
    }
}
```

---

## MIN_LT

### GraphQL Input

```graphql
{
    posts(where: { likesAggregate: { edge: { someInt_MIN_LT: 10 } } }) {
        content
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Post)
WHERE apoc.cypher.runFirstColumn("
    MATCH (this)<-[this_likesAggregate_edge:LIKES]-(this_likesAggregate_node:User)
    RETURN min(this_likesAggregate_edge.someInt) < $this_likesAggregate_edge_someInt_MIN_LT ",
    { this: this, this_likesAggregate_edge_someInt_MIN_LT: $this_likesAggregate_edge_someInt_MIN_LT },
    false
)
RETURN this { .content } as this
```

### Expected Cypher Params

```json
{
    "this_likesAggregate_edge_someInt_MIN_LT": {
        "high": 0,
        "low": 10
    }
}
```

---

## MIN_LTE

### GraphQL Input

```graphql
{
    posts(where: { likesAggregate: { edge: { someInt_MIN_LTE: 10 } } }) {
        content
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Post)
WHERE apoc.cypher.runFirstColumn("
    MATCH (this)<-[this_likesAggregate_edge:LIKES]-(this_likesAggregate_node:User)
    RETURN min(this_likesAggregate_edge.someInt) <= $this_likesAggregate_edge_someInt_MIN_LTE ",
    { this: this, this_likesAggregate_edge_someInt_MIN_LTE: $this_likesAggregate_edge_someInt_MIN_LTE },
    false
)
RETURN this { .content } as this
```

### Expected Cypher Params

```json
{
    "this_likesAggregate_edge_someInt_MIN_LTE": {
        "high": 0,
        "low": 10
    }
}
```

---

## MAX_EQUAL

### GraphQL Input

```graphql
{
    posts(where: { likesAggregate: { edge: { someInt_MAX_EQUAL: 10 } } }) {
        content
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Post)
WHERE apoc.cypher.runFirstColumn("
    MATCH (this)<-[this_likesAggregate_edge:LIKES]-(this_likesAggregate_node:User)
    RETURN max(this_likesAggregate_edge.someInt) = $this_likesAggregate_edge_someInt_MAX_EQUAL ",
    { this: this, this_likesAggregate_edge_someInt_MAX_EQUAL: $this_likesAggregate_edge_someInt_MAX_EQUAL },
    false
)
RETURN this { .content } as this
```

### Expected Cypher Params

```json
{
    "this_likesAggregate_edge_someInt_MAX_EQUAL": {
        "high": 0,
        "low": 10
    }
}
```

---

## MAX_GT

### GraphQL Input

```graphql
{
    posts(where: { likesAggregate: { edge: { someInt_MAX_GT: 10 } } }) {
        content
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Post)
WHERE apoc.cypher.runFirstColumn("
    MATCH (this)<-[this_likesAggregate_edge:LIKES]-(this_likesAggregate_node:User)
    RETURN max(this_likesAggregate_edge.someInt) > $this_likesAggregate_edge_someInt_MAX_GT ",
    { this: this, this_likesAggregate_edge_someInt_MAX_GT: $this_likesAggregate_edge_someInt_MAX_GT },
    false
)
RETURN this { .content } as this
```

### Expected Cypher Params

```json
{
    "this_likesAggregate_edge_someInt_MAX_GT": {
        "high": 0,
        "low": 10
    }
}
```

---

## MAX_GTE

### GraphQL Input

```graphql
{
    posts(where: { likesAggregate: { edge: { someInt_MAX_GTE: 10 } } }) {
        content
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Post)
WHERE apoc.cypher.runFirstColumn("
    MATCH (this)<-[this_likesAggregate_edge:LIKES]-(this_likesAggregate_node:User)
    RETURN max(this_likesAggregate_edge.someInt) >= $this_likesAggregate_edge_someInt_MAX_GTE ",
    { this: this, this_likesAggregate_edge_someInt_MAX_GTE: $this_likesAggregate_edge_someInt_MAX_GTE },
    false
)
RETURN this { .content } as this
```

### Expected Cypher Params

```json
{
    "this_likesAggregate_edge_someInt_MAX_GTE": {
        "high": 0,
        "low": 10
    }
}
```

---

## MAX_LT

### GraphQL Input

```graphql
{
    posts(where: { likesAggregate: { edge: { someInt_MAX_LT: 10 } } }) {
        content
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Post)
WHERE apoc.cypher.runFirstColumn("
    MATCH (this)<-[this_likesAggregate_edge:LIKES]-(this_likesAggregate_node:User)
    RETURN max(this_likesAggregate_edge.someInt) < $this_likesAggregate_edge_someInt_MAX_LT ",
    { this: this, this_likesAggregate_edge_someInt_MAX_LT: $this_likesAggregate_edge_someInt_MAX_LT },
    false
)
RETURN this { .content } as this
```

### Expected Cypher Params

```json
{
    "this_likesAggregate_edge_someInt_MAX_LT": {
        "high": 0,
        "low": 10
    }
}
```

---

## MAX_LTE

### GraphQL Input

```graphql
{
    posts(where: { likesAggregate: { edge: { someInt_MAX_LTE: 10 } } }) {
        content
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Post)
WHERE apoc.cypher.runFirstColumn("
    MATCH (this)<-[this_likesAggregate_edge:LIKES]-(this_likesAggregate_node:User)
    RETURN max(this_likesAggregate_edge.someInt) <= $this_likesAggregate_edge_someInt_MAX_LTE ",
    { this: this, this_likesAggregate_edge_someInt_MAX_LTE: $this_likesAggregate_edge_someInt_MAX_LTE },
    false
)
RETURN this { .content } as this
```

### Expected Cypher Params

```json
{
    "this_likesAggregate_edge_someInt_MAX_LTE": {
        "high": 0,
        "low": 10
    }
}
```

---
