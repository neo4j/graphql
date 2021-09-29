# Cypher Aggregations where edge with Float

Tests for queries inside the relationship where aggregation arg using an Float type.

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
    someFloat: Float
}
```

---

## EQUAL

### GraphQL Input

```graphql
{
    posts(where: { likesAggregate: { edge: { someFloat_EQUAL: 10 } } }) {
        content
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Post)
WHERE apoc.cypher.runFirstColumn("
    MATCH (this)<-[this_likesAggregate_edge:LIKES]-(this_likesAggregate_node:User)
    RETURN this_likesAggregate_edge.someFloat = $this_likesAggregate_edge_someFloat_EQUAL ",
    { this: this, this_likesAggregate_edge_someFloat_EQUAL: $this_likesAggregate_edge_someFloat_EQUAL },
    false
)
RETURN this { .content } as this
```

### Expected Cypher Params

```json
{
    "this_likesAggregate_edge_someFloat_EQUAL": 10
}
```

---

## GT

### GraphQL Input

```graphql
{
    posts(where: { likesAggregate: { edge: { someFloat_GT: 10 } } }) {
        content
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Post)
WHERE apoc.cypher.runFirstColumn("
    MATCH (this)<-[this_likesAggregate_edge:LIKES]-(this_likesAggregate_node:User)
    RETURN this_likesAggregate_edge.someFloat > $this_likesAggregate_edge_someFloat_GT ",
    { this: this, this_likesAggregate_edge_someFloat_GT: $this_likesAggregate_edge_someFloat_GT },
    false
)
RETURN this { .content } as this
```

### Expected Cypher Params

```json
{
    "this_likesAggregate_edge_someFloat_GT": 10
}
```

---

## GTE

### GraphQL Input

```graphql
{
    posts(where: { likesAggregate: { edge: { someFloat_GTE: 10 } } }) {
        content
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Post)
WHERE apoc.cypher.runFirstColumn("
    MATCH (this)<-[this_likesAggregate_edge:LIKES]-(this_likesAggregate_node:User)
    RETURN this_likesAggregate_edge.someFloat >= $this_likesAggregate_edge_someFloat_GTE ",
    { this: this, this_likesAggregate_edge_someFloat_GTE: $this_likesAggregate_edge_someFloat_GTE },
    false
)
RETURN this { .content } as this
```

### Expected Cypher Params

```json
{
    "this_likesAggregate_edge_someFloat_GTE": 10
}
```

---

## LT

### GraphQL Input

```graphql
{
    posts(where: { likesAggregate: { edge: { someFloat_LT: 10 } } }) {
        content
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Post)
WHERE apoc.cypher.runFirstColumn("
    MATCH (this)<-[this_likesAggregate_edge:LIKES]-(this_likesAggregate_node:User)
    RETURN this_likesAggregate_edge.someFloat < $this_likesAggregate_edge_someFloat_LT ",
    { this: this, this_likesAggregate_edge_someFloat_LT: $this_likesAggregate_edge_someFloat_LT },
    false
)
RETURN this { .content } as this
```

### Expected Cypher Params

```json
{
    "this_likesAggregate_edge_someFloat_LT": 10
}
```

---

## LTE

### GraphQL Input

```graphql
{
    posts(where: { likesAggregate: { edge: { someFloat_LTE: 10 } } }) {
        content
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Post)
WHERE apoc.cypher.runFirstColumn("
    MATCH (this)<-[this_likesAggregate_edge:LIKES]-(this_likesAggregate_node:User)
    RETURN this_likesAggregate_edge.someFloat <= $this_likesAggregate_edge_someFloat_LTE ",
    { this: this, this_likesAggregate_edge_someFloat_LTE: $this_likesAggregate_edge_someFloat_LTE },
    false
)
RETURN this { .content } as this
```

### Expected Cypher Params

```json
{
    "this_likesAggregate_edge_someFloat_LTE": 10
}
```

---

## AVERAGE_EQUAL

### GraphQL Input

```graphql
{
    posts(where: { likesAggregate: { edge: { someFloat_AVERAGE_EQUAL: 10 } } }) {
        content
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Post)
WHERE apoc.cypher.runFirstColumn("
    MATCH (this)<-[this_likesAggregate_edge:LIKES]-(this_likesAggregate_node:User)
    RETURN avg(this_likesAggregate_edge.someFloat) = $this_likesAggregate_edge_someFloat_AVERAGE_EQUAL ",
    { this: this, this_likesAggregate_edge_someFloat_AVERAGE_EQUAL: $this_likesAggregate_edge_someFloat_AVERAGE_EQUAL },
    false
)
RETURN this { .content } as this
```

### Expected Cypher Params

```json
{
    "this_likesAggregate_edge_someFloat_AVERAGE_EQUAL": 10
}
```

---

## AVERAGE_GT

### GraphQL Input

```graphql
{
    posts(where: { likesAggregate: { edge: { someFloat_AVERAGE_GT: 10 } } }) {
        content
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Post)
WHERE apoc.cypher.runFirstColumn("
    MATCH (this)<-[this_likesAggregate_edge:LIKES]-(this_likesAggregate_node:User)
    RETURN avg(this_likesAggregate_edge.someFloat) > $this_likesAggregate_edge_someFloat_AVERAGE_GT ",
    { this: this, this_likesAggregate_edge_someFloat_AVERAGE_GT: $this_likesAggregate_edge_someFloat_AVERAGE_GT },
    false
)
RETURN this { .content } as this
```

### Expected Cypher Params

```json
{
    "this_likesAggregate_edge_someFloat_AVERAGE_GT": 10
}
```

---

## AVERAGE_GTE

### GraphQL Input

```graphql
{
    posts(where: { likesAggregate: { edge: { someFloat_AVERAGE_GTE: 10 } } }) {
        content
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Post)
WHERE apoc.cypher.runFirstColumn("
    MATCH (this)<-[this_likesAggregate_edge:LIKES]-(this_likesAggregate_node:User)
    RETURN avg(this_likesAggregate_edge.someFloat) >= $this_likesAggregate_edge_someFloat_AVERAGE_GTE ",
    { this: this, this_likesAggregate_edge_someFloat_AVERAGE_GTE: $this_likesAggregate_edge_someFloat_AVERAGE_GTE },
    false
)
RETURN this { .content } as this
```

### Expected Cypher Params

```json
{
    "this_likesAggregate_edge_someFloat_AVERAGE_GTE": 10
}
```

---

## AVERAGE_LT

### GraphQL Input

```graphql
{
    posts(where: { likesAggregate: { edge: { someFloat_AVERAGE_LT: 10 } } }) {
        content
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Post)
WHERE apoc.cypher.runFirstColumn("
    MATCH (this)<-[this_likesAggregate_edge:LIKES]-(this_likesAggregate_node:User)
    RETURN avg(this_likesAggregate_edge.someFloat) < $this_likesAggregate_edge_someFloat_AVERAGE_LT ",
    { this: this, this_likesAggregate_edge_someFloat_AVERAGE_LT: $this_likesAggregate_edge_someFloat_AVERAGE_LT },
    false
)
RETURN this { .content } as this
```

### Expected Cypher Params

```json
{
    "this_likesAggregate_edge_someFloat_AVERAGE_LT": 10
}
```

---

## AVERAGE_LTE

### GraphQL Input

```graphql
{
    posts(where: { likesAggregate: { edge: { someFloat_AVERAGE_LTE: 10 } } }) {
        content
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Post)
WHERE apoc.cypher.runFirstColumn("
    MATCH (this)<-[this_likesAggregate_edge:LIKES]-(this_likesAggregate_node:User)
    RETURN avg(this_likesAggregate_edge.someFloat) <= $this_likesAggregate_edge_someFloat_AVERAGE_LTE ",
    { this: this, this_likesAggregate_edge_someFloat_AVERAGE_LTE: $this_likesAggregate_edge_someFloat_AVERAGE_LTE },
    false
)
RETURN this { .content } as this
```

### Expected Cypher Params

```json
{
    "this_likesAggregate_edge_someFloat_AVERAGE_LTE": 10
}
```

---

## MIN_EQUAL

### GraphQL Input

```graphql
{
    posts(where: { likesAggregate: { edge: { someFloat_MIN_EQUAL: 10 } } }) {
        content
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Post)
WHERE apoc.cypher.runFirstColumn("
    MATCH (this)<-[this_likesAggregate_edge:LIKES]-(this_likesAggregate_node:User)
    RETURN min(this_likesAggregate_edge.someFloat) = $this_likesAggregate_edge_someFloat_MIN_EQUAL ",
    { this: this, this_likesAggregate_edge_someFloat_MIN_EQUAL: $this_likesAggregate_edge_someFloat_MIN_EQUAL },
    false
)
RETURN this { .content } as this
```

### Expected Cypher Params

```json
{
    "this_likesAggregate_edge_someFloat_MIN_EQUAL": 10
}
```

---

## MIN_GT

### GraphQL Input

```graphql
{
    posts(where: { likesAggregate: { edge: { someFloat_MIN_GT: 10 } } }) {
        content
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Post)
WHERE apoc.cypher.runFirstColumn("
    MATCH (this)<-[this_likesAggregate_edge:LIKES]-(this_likesAggregate_node:User)
    RETURN min(this_likesAggregate_edge.someFloat) > $this_likesAggregate_edge_someFloat_MIN_GT ",
    { this: this, this_likesAggregate_edge_someFloat_MIN_GT: $this_likesAggregate_edge_someFloat_MIN_GT },
    false
)
RETURN this { .content } as this
```

### Expected Cypher Params

```json
{
    "this_likesAggregate_edge_someFloat_MIN_GT": 10
}
```

---

## MIN_GTE

### GraphQL Input

```graphql
{
    posts(where: { likesAggregate: { edge: { someFloat_MIN_GTE: 10 } } }) {
        content
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Post)
WHERE apoc.cypher.runFirstColumn("
    MATCH (this)<-[this_likesAggregate_edge:LIKES]-(this_likesAggregate_node:User)
    RETURN min(this_likesAggregate_edge.someFloat) >= $this_likesAggregate_edge_someFloat_MIN_GTE ",
    { this: this, this_likesAggregate_edge_someFloat_MIN_GTE: $this_likesAggregate_edge_someFloat_MIN_GTE },
    false
)
RETURN this { .content } as this
```

### Expected Cypher Params

```json
{
    "this_likesAggregate_edge_someFloat_MIN_GTE": 10
}
```

---

## MIN_LT

### GraphQL Input

```graphql
{
    posts(where: { likesAggregate: { edge: { someFloat_MIN_LT: 10 } } }) {
        content
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Post)
WHERE apoc.cypher.runFirstColumn("
    MATCH (this)<-[this_likesAggregate_edge:LIKES]-(this_likesAggregate_node:User)
    RETURN min(this_likesAggregate_edge.someFloat) < $this_likesAggregate_edge_someFloat_MIN_LT ",
    { this: this, this_likesAggregate_edge_someFloat_MIN_LT: $this_likesAggregate_edge_someFloat_MIN_LT },
    false
)
RETURN this { .content } as this
```

### Expected Cypher Params

```json
{
    "this_likesAggregate_edge_someFloat_MIN_LT": 10
}
```

---

## MIN_LTE

### GraphQL Input

```graphql
{
    posts(where: { likesAggregate: { edge: { someFloat_MIN_LTE: 10 } } }) {
        content
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Post)
WHERE apoc.cypher.runFirstColumn("
    MATCH (this)<-[this_likesAggregate_edge:LIKES]-(this_likesAggregate_node:User)
    RETURN min(this_likesAggregate_edge.someFloat) <= $this_likesAggregate_edge_someFloat_MIN_LTE ",
    { this: this, this_likesAggregate_edge_someFloat_MIN_LTE: $this_likesAggregate_edge_someFloat_MIN_LTE },
    false
)
RETURN this { .content } as this
```

### Expected Cypher Params

```json
{
    "this_likesAggregate_edge_someFloat_MIN_LTE": 10
}
```

---

## MAX_EQUAL

### GraphQL Input

```graphql
{
    posts(where: { likesAggregate: { edge: { someFloat_MAX_EQUAL: 10 } } }) {
        content
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Post)
WHERE apoc.cypher.runFirstColumn("
    MATCH (this)<-[this_likesAggregate_edge:LIKES]-(this_likesAggregate_node:User)
    RETURN max(this_likesAggregate_edge.someFloat) = $this_likesAggregate_edge_someFloat_MAX_EQUAL ",
    { this: this, this_likesAggregate_edge_someFloat_MAX_EQUAL: $this_likesAggregate_edge_someFloat_MAX_EQUAL },
    false
)
RETURN this { .content } as this
```

### Expected Cypher Params

```json
{
    "this_likesAggregate_edge_someFloat_MAX_EQUAL": 10
}
```

---

## MAX_GT

### GraphQL Input

```graphql
{
    posts(where: { likesAggregate: { edge: { someFloat_MAX_GT: 10 } } }) {
        content
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Post)
WHERE apoc.cypher.runFirstColumn("
    MATCH (this)<-[this_likesAggregate_edge:LIKES]-(this_likesAggregate_node:User)
    RETURN max(this_likesAggregate_edge.someFloat) > $this_likesAggregate_edge_someFloat_MAX_GT ",
    { this: this, this_likesAggregate_edge_someFloat_MAX_GT: $this_likesAggregate_edge_someFloat_MAX_GT },
    false
)
RETURN this { .content } as this
```

### Expected Cypher Params

```json
{
    "this_likesAggregate_edge_someFloat_MAX_GT": 10
}
```

---

## MAX_GTE

### GraphQL Input

```graphql
{
    posts(where: { likesAggregate: { edge: { someFloat_MAX_GTE: 10 } } }) {
        content
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Post)
WHERE apoc.cypher.runFirstColumn("
    MATCH (this)<-[this_likesAggregate_edge:LIKES]-(this_likesAggregate_node:User)
    RETURN max(this_likesAggregate_edge.someFloat) >= $this_likesAggregate_edge_someFloat_MAX_GTE ",
    { this: this, this_likesAggregate_edge_someFloat_MAX_GTE: $this_likesAggregate_edge_someFloat_MAX_GTE },
    false
)
RETURN this { .content } as this
```

### Expected Cypher Params

```json
{
    "this_likesAggregate_edge_someFloat_MAX_GTE": 10
}
```

---

## MAX_LT

### GraphQL Input

```graphql
{
    posts(where: { likesAggregate: { edge: { someFloat_MAX_LT: 10 } } }) {
        content
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Post)
WHERE apoc.cypher.runFirstColumn("
    MATCH (this)<-[this_likesAggregate_edge:LIKES]-(this_likesAggregate_node:User)
    RETURN max(this_likesAggregate_edge.someFloat) < $this_likesAggregate_edge_someFloat_MAX_LT ",
    { this: this, this_likesAggregate_edge_someFloat_MAX_LT: $this_likesAggregate_edge_someFloat_MAX_LT },
    false
)
RETURN this { .content } as this
```

### Expected Cypher Params

```json
{
    "this_likesAggregate_edge_someFloat_MAX_LT": 10
}
```

---

## MAX_LTE

### GraphQL Input

```graphql
{
    posts(where: { likesAggregate: { edge: { someFloat_MAX_LTE: 10 } } }) {
        content
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Post)
WHERE apoc.cypher.runFirstColumn("
    MATCH (this)<-[this_likesAggregate_edge:LIKES]-(this_likesAggregate_node:User)
    RETURN max(this_likesAggregate_edge.someFloat) <= $this_likesAggregate_edge_someFloat_MAX_LTE ",
    { this: this, this_likesAggregate_edge_someFloat_MAX_LTE: $this_likesAggregate_edge_someFloat_MAX_LTE },
    false
)
RETURN this { .content } as this
```

### Expected Cypher Params

```json
{
    "this_likesAggregate_edge_someFloat_MAX_LTE": 10
}
```

---
