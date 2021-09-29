# Cypher Aggregations where node with BigInt

Tests for queries inside the relationship where aggregation arg using an BigInt type.

Schema:

```graphql
type User {
    someBigInt: BigInt
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
    posts(where: { likesAggregate: { node: { someBigInt_EQUAL: "2147483648" } } }) {
        content
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Post)
WHERE apoc.cypher.runFirstColumn("
    MATCH (this)<-[this_likesAggregate_edge:LIKES]-(this_likesAggregate_node:User)
    RETURN this_likesAggregate_node.someBigInt = $this_likesAggregate_node_someBigInt_EQUAL ",
    { this: this, this_likesAggregate_node_someBigInt_EQUAL: $this_likesAggregate_node_someBigInt_EQUAL },
    false
)
RETURN this { .content } as this
```

### Expected Cypher Params

```json
{
    "this_likesAggregate_node_someBigInt_EQUAL": {
        "high": 0,
        "low": -2147483648
    }
}
```

---

## GT

### GraphQL Input

```graphql
{
    posts(where: { likesAggregate: { node: { someBigInt_GT: "2147483648" } } }) {
        content
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Post)
WHERE apoc.cypher.runFirstColumn("
    MATCH (this)<-[this_likesAggregate_edge:LIKES]-(this_likesAggregate_node:User)
    RETURN this_likesAggregate_node.someBigInt > $this_likesAggregate_node_someBigInt_GT ",
    { this: this, this_likesAggregate_node_someBigInt_GT: $this_likesAggregate_node_someBigInt_GT },
    false
)
RETURN this { .content } as this
```

### Expected Cypher Params

```json
{
    "this_likesAggregate_node_someBigInt_GT": {
        "high": 0,
        "low": -2147483648
    }
}
```

---

## GTE

### GraphQL Input

```graphql
{
    posts(where: { likesAggregate: { node: { someBigInt_GTE: "2147483648" } } }) {
        content
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Post)
WHERE apoc.cypher.runFirstColumn("
    MATCH (this)<-[this_likesAggregate_edge:LIKES]-(this_likesAggregate_node:User)
    RETURN this_likesAggregate_node.someBigInt >= $this_likesAggregate_node_someBigInt_GTE ",
    { this: this, this_likesAggregate_node_someBigInt_GTE: $this_likesAggregate_node_someBigInt_GTE },
    false
)
RETURN this { .content } as this
```

### Expected Cypher Params

```json
{
    "this_likesAggregate_node_someBigInt_GTE": {
        "high": 0,
        "low": -2147483648
    }
}
```

---

## LT

### GraphQL Input

```graphql
{
    posts(where: { likesAggregate: { node: { someBigInt_LT: "2147483648" } } }) {
        content
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Post)
WHERE apoc.cypher.runFirstColumn("
    MATCH (this)<-[this_likesAggregate_edge:LIKES]-(this_likesAggregate_node:User)
    RETURN this_likesAggregate_node.someBigInt < $this_likesAggregate_node_someBigInt_LT ",
    { this: this, this_likesAggregate_node_someBigInt_LT: $this_likesAggregate_node_someBigInt_LT },
    false
)
RETURN this { .content } as this
```

### Expected Cypher Params

```json
{
    "this_likesAggregate_node_someBigInt_LT": {
        "high": 0,
        "low": -2147483648
    }
}
```

---

## LTE

### GraphQL Input

```graphql
{
    posts(where: { likesAggregate: { node: { someBigInt_LTE: "2147483648" } } }) {
        content
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Post)
WHERE apoc.cypher.runFirstColumn("
    MATCH (this)<-[this_likesAggregate_edge:LIKES]-(this_likesAggregate_node:User)
    RETURN this_likesAggregate_node.someBigInt <= $this_likesAggregate_node_someBigInt_LTE ",
    { this: this, this_likesAggregate_node_someBigInt_LTE: $this_likesAggregate_node_someBigInt_LTE },
    false
)
RETURN this { .content } as this
```

### Expected Cypher Params

```json
{
    "this_likesAggregate_node_someBigInt_LTE": {
        "high": 0,
        "low": -2147483648
    }
}
```

---

## AVERAGE_EQUAL

### GraphQL Input

```graphql
{
    posts(where: { likesAggregate: { node: { someBigInt_AVERAGE_EQUAL: "2147483648" } } }) {
        content
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Post)
WHERE apoc.cypher.runFirstColumn("
    MATCH (this)<-[this_likesAggregate_edge:LIKES]-(this_likesAggregate_node:User)
    RETURN avg(this_likesAggregate_node.someBigInt) = $this_likesAggregate_node_someBigInt_AVERAGE_EQUAL ",
    { this: this, this_likesAggregate_node_someBigInt_AVERAGE_EQUAL: $this_likesAggregate_node_someBigInt_AVERAGE_EQUAL },
    false
)
RETURN this { .content } as this
```

### Expected Cypher Params

```json
{
    "this_likesAggregate_node_someBigInt_AVERAGE_EQUAL": {
        "high": 0,
        "low": -2147483648
    }
}
```

---

## AVERAGE_GT

### GraphQL Input

```graphql
{
    posts(where: { likesAggregate: { node: { someBigInt_AVERAGE_GT: "2147483648" } } }) {
        content
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Post)
WHERE apoc.cypher.runFirstColumn("
    MATCH (this)<-[this_likesAggregate_edge:LIKES]-(this_likesAggregate_node:User)
    RETURN avg(this_likesAggregate_node.someBigInt) > $this_likesAggregate_node_someBigInt_AVERAGE_GT ",
    { this: this, this_likesAggregate_node_someBigInt_AVERAGE_GT: $this_likesAggregate_node_someBigInt_AVERAGE_GT },
    false
)
RETURN this { .content } as this
```

### Expected Cypher Params

```json
{
    "this_likesAggregate_node_someBigInt_AVERAGE_GT": {
        "high": 0,
        "low": -2147483648
    }
}
```

---

## AVERAGE_GTE

### GraphQL Input

```graphql
{
    posts(where: { likesAggregate: { node: { someBigInt_AVERAGE_GTE: "2147483648" } } }) {
        content
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Post)
WHERE apoc.cypher.runFirstColumn("
    MATCH (this)<-[this_likesAggregate_edge:LIKES]-(this_likesAggregate_node:User)
    RETURN avg(this_likesAggregate_node.someBigInt) >= $this_likesAggregate_node_someBigInt_AVERAGE_GTE ",
    { this: this, this_likesAggregate_node_someBigInt_AVERAGE_GTE: $this_likesAggregate_node_someBigInt_AVERAGE_GTE },
    false
)
RETURN this { .content } as this
```

### Expected Cypher Params

```json
{
    "this_likesAggregate_node_someBigInt_AVERAGE_GTE": {
        "high": 0,
        "low": -2147483648
    }
}
```

---

## AVERAGE_LT

### GraphQL Input

```graphql
{
    posts(where: { likesAggregate: { node: { someBigInt_AVERAGE_LT: "2147483648" } } }) {
        content
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Post)
WHERE apoc.cypher.runFirstColumn("
    MATCH (this)<-[this_likesAggregate_edge:LIKES]-(this_likesAggregate_node:User)
    RETURN avg(this_likesAggregate_node.someBigInt) < $this_likesAggregate_node_someBigInt_AVERAGE_LT ",
    { this: this, this_likesAggregate_node_someBigInt_AVERAGE_LT: $this_likesAggregate_node_someBigInt_AVERAGE_LT },
    false
)
RETURN this { .content } as this
```

### Expected Cypher Params

```json
{
    "this_likesAggregate_node_someBigInt_AVERAGE_LT": {
        "high": 0,
        "low": -2147483648
    }
}
```

---

## AVERAGE_LTE

### GraphQL Input

```graphql
{
    posts(where: { likesAggregate: { node: { someBigInt_AVERAGE_LTE: "2147483648" } } }) {
        content
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Post)
WHERE apoc.cypher.runFirstColumn("
    MATCH (this)<-[this_likesAggregate_edge:LIKES]-(this_likesAggregate_node:User)
    RETURN avg(this_likesAggregate_node.someBigInt) <= $this_likesAggregate_node_someBigInt_AVERAGE_LTE ",
    { this: this, this_likesAggregate_node_someBigInt_AVERAGE_LTE: $this_likesAggregate_node_someBigInt_AVERAGE_LTE },
    false
)
RETURN this { .content } as this
```

### Expected Cypher Params

```json
{
    "this_likesAggregate_node_someBigInt_AVERAGE_LTE": {
        "high": 0,
        "low": -2147483648
    }
}
```

---

## MIN_EQUAL

### GraphQL Input

```graphql
{
    posts(where: { likesAggregate: { node: { someBigInt_MIN_EQUAL: "2147483648" } } }) {
        content
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Post)
WHERE apoc.cypher.runFirstColumn("
    MATCH (this)<-[this_likesAggregate_edge:LIKES]-(this_likesAggregate_node:User)
    RETURN min(this_likesAggregate_node.someBigInt) = $this_likesAggregate_node_someBigInt_MIN_EQUAL ",
    { this: this, this_likesAggregate_node_someBigInt_MIN_EQUAL: $this_likesAggregate_node_someBigInt_MIN_EQUAL },
    false
)
RETURN this { .content } as this
```

### Expected Cypher Params

```json
{
    "this_likesAggregate_node_someBigInt_MIN_EQUAL": {
        "high": 0,
        "low": -2147483648
    }
}
```

---

## MIN_GT

### GraphQL Input

```graphql
{
    posts(where: { likesAggregate: { node: { someBigInt_MIN_GT: "2147483648" } } }) {
        content
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Post)
WHERE apoc.cypher.runFirstColumn("
    MATCH (this)<-[this_likesAggregate_edge:LIKES]-(this_likesAggregate_node:User)
    RETURN min(this_likesAggregate_node.someBigInt) > $this_likesAggregate_node_someBigInt_MIN_GT ",
    { this: this, this_likesAggregate_node_someBigInt_MIN_GT: $this_likesAggregate_node_someBigInt_MIN_GT },
    false
)
RETURN this { .content } as this
```

### Expected Cypher Params

```json
{
    "this_likesAggregate_node_someBigInt_MIN_GT": {
        "high": 0,
        "low": -2147483648
    }
}
```

---

## MIN_GTE

### GraphQL Input

```graphql
{
    posts(where: { likesAggregate: { node: { someBigInt_MIN_GTE: "2147483648" } } }) {
        content
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Post)
WHERE apoc.cypher.runFirstColumn("
    MATCH (this)<-[this_likesAggregate_edge:LIKES]-(this_likesAggregate_node:User)
    RETURN min(this_likesAggregate_node.someBigInt) >= $this_likesAggregate_node_someBigInt_MIN_GTE ",
    { this: this, this_likesAggregate_node_someBigInt_MIN_GTE: $this_likesAggregate_node_someBigInt_MIN_GTE },
    false
)
RETURN this { .content } as this
```

### Expected Cypher Params

```json
{
    "this_likesAggregate_node_someBigInt_MIN_GTE": {
        "high": 0,
        "low": -2147483648
    }
}
```

---

## MIN_LT

### GraphQL Input

```graphql
{
    posts(where: { likesAggregate: { node: { someBigInt_MIN_LT: "2147483648" } } }) {
        content
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Post)
WHERE apoc.cypher.runFirstColumn("
    MATCH (this)<-[this_likesAggregate_edge:LIKES]-(this_likesAggregate_node:User)
    RETURN min(this_likesAggregate_node.someBigInt) < $this_likesAggregate_node_someBigInt_MIN_LT ",
    { this: this, this_likesAggregate_node_someBigInt_MIN_LT: $this_likesAggregate_node_someBigInt_MIN_LT },
    false
)
RETURN this { .content } as this
```

### Expected Cypher Params

```json
{
    "this_likesAggregate_node_someBigInt_MIN_LT": {
        "high": 0,
        "low": -2147483648
    }
}
```

---

## MIN_LTE

### GraphQL Input

```graphql
{
    posts(where: { likesAggregate: { node: { someBigInt_MIN_LTE: "2147483648" } } }) {
        content
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Post)
WHERE apoc.cypher.runFirstColumn("
    MATCH (this)<-[this_likesAggregate_edge:LIKES]-(this_likesAggregate_node:User)
    RETURN min(this_likesAggregate_node.someBigInt) <= $this_likesAggregate_node_someBigInt_MIN_LTE ",
    { this: this, this_likesAggregate_node_someBigInt_MIN_LTE: $this_likesAggregate_node_someBigInt_MIN_LTE },
    false
)
RETURN this { .content } as this
```

### Expected Cypher Params

```json
{
    "this_likesAggregate_node_someBigInt_MIN_LTE": {
        "high": 0,
        "low": -2147483648
    }
}
```

---

## MAX_EQUAL

### GraphQL Input

```graphql
{
    posts(where: { likesAggregate: { node: { someBigInt_MAX_EQUAL: "2147483648" } } }) {
        content
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Post)
WHERE apoc.cypher.runFirstColumn("
    MATCH (this)<-[this_likesAggregate_edge:LIKES]-(this_likesAggregate_node:User)
    RETURN max(this_likesAggregate_node.someBigInt) = $this_likesAggregate_node_someBigInt_MAX_EQUAL ",
    { this: this, this_likesAggregate_node_someBigInt_MAX_EQUAL: $this_likesAggregate_node_someBigInt_MAX_EQUAL },
    false
)
RETURN this { .content } as this
```

### Expected Cypher Params

```json
{
    "this_likesAggregate_node_someBigInt_MAX_EQUAL": {
        "high": 0,
        "low": -2147483648
    }
}
```

---

## MAX_GT

### GraphQL Input

```graphql
{
    posts(where: { likesAggregate: { node: { someBigInt_MAX_GT: "2147483648" } } }) {
        content
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Post)
WHERE apoc.cypher.runFirstColumn("
    MATCH (this)<-[this_likesAggregate_edge:LIKES]-(this_likesAggregate_node:User)
    RETURN max(this_likesAggregate_node.someBigInt) > $this_likesAggregate_node_someBigInt_MAX_GT ",
    { this: this, this_likesAggregate_node_someBigInt_MAX_GT: $this_likesAggregate_node_someBigInt_MAX_GT },
    false
)
RETURN this { .content } as this
```

### Expected Cypher Params

```json
{
    "this_likesAggregate_node_someBigInt_MAX_GT": {
        "high": 0,
        "low": -2147483648
    }
}
```

---

## MAX_GTE

### GraphQL Input

```graphql
{
    posts(where: { likesAggregate: { node: { someBigInt_MAX_GTE: "2147483648" } } }) {
        content
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Post)
WHERE apoc.cypher.runFirstColumn("
    MATCH (this)<-[this_likesAggregate_edge:LIKES]-(this_likesAggregate_node:User)
    RETURN max(this_likesAggregate_node.someBigInt) >= $this_likesAggregate_node_someBigInt_MAX_GTE ",
    { this: this, this_likesAggregate_node_someBigInt_MAX_GTE: $this_likesAggregate_node_someBigInt_MAX_GTE },
    false
)
RETURN this { .content } as this
```

### Expected Cypher Params

```json
{
    "this_likesAggregate_node_someBigInt_MAX_GTE": {
        "high": 0,
        "low": -2147483648
    }
}
```

---

## MAX_LT

### GraphQL Input

```graphql
{
    posts(where: { likesAggregate: { node: { someBigInt_MAX_LT: "2147483648" } } }) {
        content
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Post)
WHERE apoc.cypher.runFirstColumn("
    MATCH (this)<-[this_likesAggregate_edge:LIKES]-(this_likesAggregate_node:User)
    RETURN max(this_likesAggregate_node.someBigInt) < $this_likesAggregate_node_someBigInt_MAX_LT ",
    { this: this, this_likesAggregate_node_someBigInt_MAX_LT: $this_likesAggregate_node_someBigInt_MAX_LT },
    false
)
RETURN this { .content } as this
```

### Expected Cypher Params

```json
{
    "this_likesAggregate_node_someBigInt_MAX_LT": {
        "high": 0,
        "low": -2147483648
    }
}
```

---

## MAX_LTE

### GraphQL Input

```graphql
{
    posts(where: { likesAggregate: { node: { someBigInt_MAX_LTE: "2147483648" } } }) {
        content
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Post)
WHERE apoc.cypher.runFirstColumn("
    MATCH (this)<-[this_likesAggregate_edge:LIKES]-(this_likesAggregate_node:User)
    RETURN max(this_likesAggregate_node.someBigInt) <= $this_likesAggregate_node_someBigInt_MAX_LTE ",
    { this: this, this_likesAggregate_node_someBigInt_MAX_LTE: $this_likesAggregate_node_someBigInt_MAX_LTE },
    false
)
RETURN this { .content } as this
```

### Expected Cypher Params

```json
{
    "this_likesAggregate_node_someBigInt_MAX_LTE": {
        "high": 0,
        "low": -2147483648
    }
}
```

---
