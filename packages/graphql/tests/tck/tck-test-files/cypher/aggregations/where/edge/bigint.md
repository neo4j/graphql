# Cypher Aggregations where edge with BigInt

Tests for queries inside the relationship where aggregation arg using an BigInt type.

Schema:

```graphql
type User {
    someBigInt: BigInt
}

type Post {
    content: String!
    likes: [User] @relationship(type: "LIKES", direction: IN, properties: "Likes")
}

interface Likes {
    someBigInt: BigInt
}
```

---

## EQUAL

### GraphQL Input

```graphql
{
    posts(where: { likesAggregate: { edge: { someBigInt_EQUAL: "2147483648" } } }) {
        content
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Post)
WHERE apoc.cypher.runFirstColumn("
    MATCH (this)<-[this_likesAggregate_edge:LIKES]-(this_likesAggregate_node:User)
    RETURN this_likesAggregate_edge.someBigInt = $this_likesAggregate_edge_someBigInt_EQUAL ",
    { this: this, this_likesAggregate_edge_someBigInt_EQUAL: $this_likesAggregate_edge_someBigInt_EQUAL },
    false
)
RETURN this { .content } as this
```

### Expected Cypher Params

```json
{
    "this_likesAggregate_edge_someBigInt_EQUAL": {
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
    posts(where: { likesAggregate: { edge: { someBigInt_GT: "2147483648" } } }) {
        content
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Post)
WHERE apoc.cypher.runFirstColumn("
    MATCH (this)<-[this_likesAggregate_edge:LIKES]-(this_likesAggregate_node:User)
    RETURN this_likesAggregate_edge.someBigInt > $this_likesAggregate_edge_someBigInt_GT ",
    { this: this, this_likesAggregate_edge_someBigInt_GT: $this_likesAggregate_edge_someBigInt_GT },
    false
)
RETURN this { .content } as this
```

### Expected Cypher Params

```json
{
    "this_likesAggregate_edge_someBigInt_GT": {
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
    posts(where: { likesAggregate: { edge: { someBigInt_GTE: "2147483648" } } }) {
        content
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Post)
WHERE apoc.cypher.runFirstColumn("
    MATCH (this)<-[this_likesAggregate_edge:LIKES]-(this_likesAggregate_node:User)
    RETURN this_likesAggregate_edge.someBigInt >= $this_likesAggregate_edge_someBigInt_GTE ",
    { this: this, this_likesAggregate_edge_someBigInt_GTE: $this_likesAggregate_edge_someBigInt_GTE },
    false
)
RETURN this { .content } as this
```

### Expected Cypher Params

```json
{
    "this_likesAggregate_edge_someBigInt_GTE": {
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
    posts(where: { likesAggregate: { edge: { someBigInt_LT: "2147483648" } } }) {
        content
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Post)
WHERE apoc.cypher.runFirstColumn("
    MATCH (this)<-[this_likesAggregate_edge:LIKES]-(this_likesAggregate_node:User)
    RETURN this_likesAggregate_edge.someBigInt < $this_likesAggregate_edge_someBigInt_LT ",
    { this: this, this_likesAggregate_edge_someBigInt_LT: $this_likesAggregate_edge_someBigInt_LT },
    false
)
RETURN this { .content } as this
```

### Expected Cypher Params

```json
{
    "this_likesAggregate_edge_someBigInt_LT": {
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
    posts(where: { likesAggregate: { edge: { someBigInt_LTE: "2147483648" } } }) {
        content
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Post)
WHERE apoc.cypher.runFirstColumn("
    MATCH (this)<-[this_likesAggregate_edge:LIKES]-(this_likesAggregate_node:User)
    RETURN this_likesAggregate_edge.someBigInt <= $this_likesAggregate_edge_someBigInt_LTE ",
    { this: this, this_likesAggregate_edge_someBigInt_LTE: $this_likesAggregate_edge_someBigInt_LTE },
    false
)
RETURN this { .content } as this
```

### Expected Cypher Params

```json
{
    "this_likesAggregate_edge_someBigInt_LTE": {
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
    posts(where: { likesAggregate: { edge: { someBigInt_AVERAGE_EQUAL: "2147483648" } } }) {
        content
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Post)
WHERE apoc.cypher.runFirstColumn("
    MATCH (this)<-[this_likesAggregate_edge:LIKES]-(this_likesAggregate_node:User)
    RETURN avg(this_likesAggregate_edge.someBigInt) = $this_likesAggregate_edge_someBigInt_AVERAGE_EQUAL ",
    { this: this, this_likesAggregate_edge_someBigInt_AVERAGE_EQUAL: $this_likesAggregate_edge_someBigInt_AVERAGE_EQUAL },
    false
)
RETURN this { .content } as this
```

### Expected Cypher Params

```json
{
    "this_likesAggregate_edge_someBigInt_AVERAGE_EQUAL": {
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
    posts(where: { likesAggregate: { edge: { someBigInt_AVERAGE_GT: "2147483648" } } }) {
        content
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Post)
WHERE apoc.cypher.runFirstColumn("
    MATCH (this)<-[this_likesAggregate_edge:LIKES]-(this_likesAggregate_node:User)
    RETURN avg(this_likesAggregate_edge.someBigInt) > $this_likesAggregate_edge_someBigInt_AVERAGE_GT ",
    { this: this, this_likesAggregate_edge_someBigInt_AVERAGE_GT: $this_likesAggregate_edge_someBigInt_AVERAGE_GT },
    false
)
RETURN this { .content } as this
```

### Expected Cypher Params

```json
{
    "this_likesAggregate_edge_someBigInt_AVERAGE_GT": {
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
    posts(where: { likesAggregate: { edge: { someBigInt_AVERAGE_GTE: "2147483648" } } }) {
        content
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Post)
WHERE apoc.cypher.runFirstColumn("
    MATCH (this)<-[this_likesAggregate_edge:LIKES]-(this_likesAggregate_node:User)
    RETURN avg(this_likesAggregate_edge.someBigInt) >= $this_likesAggregate_edge_someBigInt_AVERAGE_GTE ",
    { this: this, this_likesAggregate_edge_someBigInt_AVERAGE_GTE: $this_likesAggregate_edge_someBigInt_AVERAGE_GTE },
    false
)
RETURN this { .content } as this
```

### Expected Cypher Params

```json
{
    "this_likesAggregate_edge_someBigInt_AVERAGE_GTE": {
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
    posts(where: { likesAggregate: { edge: { someBigInt_AVERAGE_LT: "2147483648" } } }) {
        content
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Post)
WHERE apoc.cypher.runFirstColumn("
    MATCH (this)<-[this_likesAggregate_edge:LIKES]-(this_likesAggregate_node:User)
    RETURN avg(this_likesAggregate_edge.someBigInt) < $this_likesAggregate_edge_someBigInt_AVERAGE_LT ",
    { this: this, this_likesAggregate_edge_someBigInt_AVERAGE_LT: $this_likesAggregate_edge_someBigInt_AVERAGE_LT },
    false
)
RETURN this { .content } as this
```

### Expected Cypher Params

```json
{
    "this_likesAggregate_edge_someBigInt_AVERAGE_LT": {
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
    posts(where: { likesAggregate: { edge: { someBigInt_AVERAGE_LTE: "2147483648" } } }) {
        content
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Post)
WHERE apoc.cypher.runFirstColumn("
    MATCH (this)<-[this_likesAggregate_edge:LIKES]-(this_likesAggregate_node:User)
    RETURN avg(this_likesAggregate_edge.someBigInt) <= $this_likesAggregate_edge_someBigInt_AVERAGE_LTE ",
    { this: this, this_likesAggregate_edge_someBigInt_AVERAGE_LTE: $this_likesAggregate_edge_someBigInt_AVERAGE_LTE },
    false
)
RETURN this { .content } as this
```

### Expected Cypher Params

```json
{
    "this_likesAggregate_edge_someBigInt_AVERAGE_LTE": {
        "high": 0,
        "low": -2147483648
    }
}
```

---
