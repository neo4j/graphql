# Cypher Aggregations where node with String

Tests for queries inside the relationship where aggregation arg using an String type.

Schema:

```graphql
type User {
    name: String!
    someStringAlias: String @alias(property: "_someStringAlias")
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
    posts(where: { likesAggregate: { node: { name_EQUAL: "10" } } }) {
        content
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Post)
WHERE apoc.cypher.runFirstColumn("
    MATCH (this)<-[this_likesAggregate_edge:LIKES]-(this_likesAggregate_node:User)
    RETURN this_likesAggregate_node.name = $this_likesAggregate_node_name_EQUAL ",
    { this: this, this_likesAggregate_node_name_EQUAL: $this_likesAggregate_node_name_EQUAL },
    false
)
RETURN this { .content } as this
```

### Expected Cypher Params

```json
{
    "this_likesAggregate_node_name_EQUAL": "10"
}
```

---

## EQUAL with alias

### GraphQL Input

```graphql
{
    posts(where: { likesAggregate: { node: { someStringAlias_EQUAL: "10" } } }) {
        content
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Post)
WHERE apoc.cypher.runFirstColumn("
    MATCH (this)<-[this_likesAggregate_edge:LIKES]-(this_likesAggregate_node:User)
    RETURN this_likesAggregate_node._someStringAlias = $this_likesAggregate_node_someStringAlias_EQUAL ",
    { this: this, this_likesAggregate_node_someStringAlias_EQUAL: $this_likesAggregate_node_someStringAlias_EQUAL },
    false
)
RETURN this { .content } as this
```

### Expected Cypher Params

```json
{
    "this_likesAggregate_node_someStringAlias_EQUAL": "10"
}
```

---

## GT

### GraphQL Input

```graphql
{
    posts(where: { likesAggregate: { node: { name_GT: 10 } } }) {
        content
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Post)
WHERE apoc.cypher.runFirstColumn("
    MATCH (this)<-[this_likesAggregate_edge:LIKES]-(this_likesAggregate_node:User)
    RETURN size(this_likesAggregate_node.name) > $this_likesAggregate_node_name_GT ",
    { this: this, this_likesAggregate_node_name_GT: $this_likesAggregate_node_name_GT },
    false
)
RETURN this { .content } as this
```

### Expected Cypher Params

```json
{
    "this_likesAggregate_node_name_GT": {
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
    posts(where: { likesAggregate: { node: { name_GTE: 10 } } }) {
        content
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Post)
WHERE apoc.cypher.runFirstColumn("
    MATCH (this)<-[this_likesAggregate_edge:LIKES]-(this_likesAggregate_node:User)
    RETURN size(this_likesAggregate_node.name) >= $this_likesAggregate_node_name_GTE ",
    { this: this, this_likesAggregate_node_name_GTE: $this_likesAggregate_node_name_GTE },
    false
)
RETURN this { .content } as this
```

### Expected Cypher Params

```json
{
    "this_likesAggregate_node_name_GTE": {
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
    posts(where: { likesAggregate: { node: { name_LT: 10 } } }) {
        content
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Post)
WHERE apoc.cypher.runFirstColumn("
    MATCH (this)<-[this_likesAggregate_edge:LIKES]-(this_likesAggregate_node:User)
    RETURN size(this_likesAggregate_node.name) < $this_likesAggregate_node_name_LT ",
    { this: this, this_likesAggregate_node_name_LT: $this_likesAggregate_node_name_LT },
    false
)
RETURN this { .content } as this
```

### Expected Cypher Params

```json
{
    "this_likesAggregate_node_name_LT": {
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
    posts(where: { likesAggregate: { node: { name_LTE: 10 } } }) {
        content
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Post)
WHERE apoc.cypher.runFirstColumn("
    MATCH (this)<-[this_likesAggregate_edge:LIKES]-(this_likesAggregate_node:User)
    RETURN size(this_likesAggregate_node.name) <= $this_likesAggregate_node_name_LTE ",
    { this: this, this_likesAggregate_node_name_LTE: $this_likesAggregate_node_name_LTE },
    false
)
RETURN this { .content } as this
```

### Expected Cypher Params

```json
{
    "this_likesAggregate_node_name_LTE": {
        "high": 0,
        "low": 10
    }
}
```

---

## SHORTEST_EQUAL

### GraphQL Input

```graphql
{
    posts(where: { likesAggregate: { node: { name_SHORTEST_EQUAL: 10 } } }) {
        content
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Post)
WHERE apoc.cypher.runFirstColumn("
    MATCH (this)<-[this_likesAggregate_edge:LIKES]-(this_likesAggregate_node:User)
    WITH this_likesAggregate_node, this_likesAggregate_edge, size(this_likesAggregate_node.name) AS this_likesAggregate_node_name_SHORTEST_EQUAL_SIZE
    RETURN min(this_likesAggregate_node_name_SHORTEST_EQUAL_SIZE) = $this_likesAggregate_node_name_SHORTEST_EQUAL ",
    { this: this, this_likesAggregate_node_name_SHORTEST_EQUAL: $this_likesAggregate_node_name_SHORTEST_EQUAL },
    false
)
RETURN this { .content } as this
```

### Expected Cypher Params

```json
{
    "this_likesAggregate_node_name_SHORTEST_EQUAL": {
        "high": 0,
        "low": 10
    }
}
```

---

## SHORTEST_GT

### GraphQL Input

```graphql
{
    posts(where: { likesAggregate: { node: { name_SHORTEST_GT: 10 } } }) {
        content
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Post)
WHERE apoc.cypher.runFirstColumn("
    MATCH (this)<-[this_likesAggregate_edge:LIKES]-(this_likesAggregate_node:User)
    WITH this_likesAggregate_node, this_likesAggregate_edge, size(this_likesAggregate_node.name) AS this_likesAggregate_node_name_SHORTEST_GT_SIZE
    RETURN min(this_likesAggregate_node_name_SHORTEST_GT_SIZE) > $this_likesAggregate_node_name_SHORTEST_GT ",
    { this: this, this_likesAggregate_node_name_SHORTEST_GT: $this_likesAggregate_node_name_SHORTEST_GT },
    false
)
RETURN this { .content } as this
```

### Expected Cypher Params

```json
{
    "this_likesAggregate_node_name_SHORTEST_GT": {
        "high": 0,
        "low": 10
    }
}
```

---

## SHORTEST_GTE

### GraphQL Input

```graphql
{
    posts(where: { likesAggregate: { node: { name_SHORTEST_GTE: 10 } } }) {
        content
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Post)
WHERE apoc.cypher.runFirstColumn("
    MATCH (this)<-[this_likesAggregate_edge:LIKES]-(this_likesAggregate_node:User)
    WITH this_likesAggregate_node, this_likesAggregate_edge, size(this_likesAggregate_node.name) AS this_likesAggregate_node_name_SHORTEST_GTE_SIZE
    RETURN min(this_likesAggregate_node_name_SHORTEST_GTE_SIZE) >= $this_likesAggregate_node_name_SHORTEST_GTE ",
    { this: this, this_likesAggregate_node_name_SHORTEST_GTE: $this_likesAggregate_node_name_SHORTEST_GTE },
    false
)
RETURN this { .content } as this
```

### Expected Cypher Params

```json
{
    "this_likesAggregate_node_name_SHORTEST_GTE": {
        "high": 0,
        "low": 10
    }
}
```

---

## SHORTEST_LT

### GraphQL Input

```graphql
{
    posts(where: { likesAggregate: { node: { name_SHORTEST_LT: 10 } } }) {
        content
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Post)
WHERE apoc.cypher.runFirstColumn("
    MATCH (this)<-[this_likesAggregate_edge:LIKES]-(this_likesAggregate_node:User)
    WITH this_likesAggregate_node, this_likesAggregate_edge, size(this_likesAggregate_node.name) AS this_likesAggregate_node_name_SHORTEST_LT_SIZE
    RETURN min(this_likesAggregate_node_name_SHORTEST_LT_SIZE) < $this_likesAggregate_node_name_SHORTEST_LT ",
    { this: this, this_likesAggregate_node_name_SHORTEST_LT: $this_likesAggregate_node_name_SHORTEST_LT },
    false
)
RETURN this { .content } as this
```

### Expected Cypher Params

```json
{
    "this_likesAggregate_node_name_SHORTEST_LT": {
        "high": 0,
        "low": 10
    }
}
```

---

## SHORTEST_LTE

### GraphQL Input

```graphql
{
    posts(where: { likesAggregate: { node: { name_SHORTEST_LTE: 10 } } }) {
        content
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Post)
WHERE apoc.cypher.runFirstColumn("
    MATCH (this)<-[this_likesAggregate_edge:LIKES]-(this_likesAggregate_node:User)
    WITH this_likesAggregate_node, this_likesAggregate_edge, size(this_likesAggregate_node.name) AS this_likesAggregate_node_name_SHORTEST_LTE_SIZE
    RETURN min(this_likesAggregate_node_name_SHORTEST_LTE_SIZE) <= $this_likesAggregate_node_name_SHORTEST_LTE ",
    { this: this, this_likesAggregate_node_name_SHORTEST_LTE: $this_likesAggregate_node_name_SHORTEST_LTE },
    false
)
RETURN this { .content } as this
```

### Expected Cypher Params

```json
{
    "this_likesAggregate_node_name_SHORTEST_LTE": {
        "high": 0,
        "low": 10
    }
}
```

---

## LONGEST_EQUAL

### GraphQL Input

```graphql
{
    posts(where: { likesAggregate: { node: { name_LONGEST_EQUAL: 10 } } }) {
        content
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Post)
WHERE apoc.cypher.runFirstColumn("
    MATCH (this)<-[this_likesAggregate_edge:LIKES]-(this_likesAggregate_node:User)
    WITH this_likesAggregate_node, this_likesAggregate_edge, size(this_likesAggregate_node.name) AS this_likesAggregate_node_name_LONGEST_EQUAL_SIZE
    RETURN max(this_likesAggregate_node_name_LONGEST_EQUAL_SIZE) = $this_likesAggregate_node_name_LONGEST_EQUAL ",
    { this: this, this_likesAggregate_node_name_LONGEST_EQUAL: $this_likesAggregate_node_name_LONGEST_EQUAL },
    false
)
RETURN this { .content } as this
```

### Expected Cypher Params

```json
{
    "this_likesAggregate_node_name_LONGEST_EQUAL": {
        "high": 0,
        "low": 10
    }
}
```

---

## LONGEST_GT

### GraphQL Input

```graphql
{
    posts(where: { likesAggregate: { node: { name_LONGEST_GT: 10 } } }) {
        content
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Post)
WHERE apoc.cypher.runFirstColumn("
    MATCH (this)<-[this_likesAggregate_edge:LIKES]-(this_likesAggregate_node:User)
    WITH this_likesAggregate_node, this_likesAggregate_edge, size(this_likesAggregate_node.name) AS this_likesAggregate_node_name_LONGEST_GT_SIZE
    RETURN max(this_likesAggregate_node_name_LONGEST_GT_SIZE) > $this_likesAggregate_node_name_LONGEST_GT ",
    { this: this, this_likesAggregate_node_name_LONGEST_GT: $this_likesAggregate_node_name_LONGEST_GT },
    false
)
RETURN this { .content } as this
```

### Expected Cypher Params

```json
{
    "this_likesAggregate_node_name_LONGEST_GT": {
        "high": 0,
        "low": 10
    }
}
```

---

## LONGEST_GTE

### GraphQL Input

```graphql
{
    posts(where: { likesAggregate: { node: { name_LONGEST_GTE: 10 } } }) {
        content
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Post)
WHERE apoc.cypher.runFirstColumn("
    MATCH (this)<-[this_likesAggregate_edge:LIKES]-(this_likesAggregate_node:User)
    WITH this_likesAggregate_node, this_likesAggregate_edge, size(this_likesAggregate_node.name) AS this_likesAggregate_node_name_LONGEST_GTE_SIZE
    RETURN max(this_likesAggregate_node_name_LONGEST_GTE_SIZE) >= $this_likesAggregate_node_name_LONGEST_GTE ",
    { this: this, this_likesAggregate_node_name_LONGEST_GTE: $this_likesAggregate_node_name_LONGEST_GTE },
    false
)
RETURN this { .content } as this
```

### Expected Cypher Params

```json
{
    "this_likesAggregate_node_name_LONGEST_GTE": {
        "high": 0,
        "low": 10
    }
}
```

---

## LONGEST_LT

### GraphQL Input

```graphql
{
    posts(where: { likesAggregate: { node: { name_LONGEST_LT: 10 } } }) {
        content
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Post)
WHERE apoc.cypher.runFirstColumn("
    MATCH (this)<-[this_likesAggregate_edge:LIKES]-(this_likesAggregate_node:User)
    WITH this_likesAggregate_node, this_likesAggregate_edge, size(this_likesAggregate_node.name) AS this_likesAggregate_node_name_LONGEST_LT_SIZE
    RETURN max(this_likesAggregate_node_name_LONGEST_LT_SIZE) < $this_likesAggregate_node_name_LONGEST_LT ",
    { this: this, this_likesAggregate_node_name_LONGEST_LT: $this_likesAggregate_node_name_LONGEST_LT },
    false
)
RETURN this { .content } as this
```

### Expected Cypher Params

```json
{
    "this_likesAggregate_node_name_LONGEST_LT": {
        "high": 0,
        "low": 10
    }
}
```

---

## LONGEST_LTE

### GraphQL Input

```graphql
{
    posts(where: { likesAggregate: { node: { name_LONGEST_LTE: 10 } } }) {
        content
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Post)
WHERE apoc.cypher.runFirstColumn("
    MATCH (this)<-[this_likesAggregate_edge:LIKES]-(this_likesAggregate_node:User)
    WITH this_likesAggregate_node, this_likesAggregate_edge, size(this_likesAggregate_node.name) AS this_likesAggregate_node_name_LONGEST_LTE_SIZE
    RETURN max(this_likesAggregate_node_name_LONGEST_LTE_SIZE) <= $this_likesAggregate_node_name_LONGEST_LTE ",
    { this: this, this_likesAggregate_node_name_LONGEST_LTE: $this_likesAggregate_node_name_LONGEST_LTE },
    false
)
RETURN this { .content } as this
```

### Expected Cypher Params

```json
{
    "this_likesAggregate_node_name_LONGEST_LTE": {
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
    posts(where: { likesAggregate: { node: { name_AVERAGE_EQUAL: 10 } } }) {
        content
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Post)
WHERE apoc.cypher.runFirstColumn("
    MATCH (this)<-[this_likesAggregate_edge:LIKES]-(this_likesAggregate_node:User)
    WITH this_likesAggregate_node, this_likesAggregate_edge, size(this_likesAggregate_node.name) AS this_likesAggregate_node_name_AVERAGE_EQUAL_SIZE
    RETURN avg(this_likesAggregate_node_name_AVERAGE_EQUAL_SIZE) = toFloat($this_likesAggregate_node_name_AVERAGE_EQUAL) ",
    { this: this, this_likesAggregate_node_name_AVERAGE_EQUAL: $this_likesAggregate_node_name_AVERAGE_EQUAL },
    false
)
RETURN this { .content } as this
```

### Expected Cypher Params

```json
{
    "this_likesAggregate_node_name_AVERAGE_EQUAL": 10
}
```

---

## AVERAGE_GT

### GraphQL Input

```graphql
{
    posts(where: { likesAggregate: { node: { name_AVERAGE_GT: 10 } } }) {
        content
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Post)
WHERE apoc.cypher.runFirstColumn("
    MATCH (this)<-[this_likesAggregate_edge:LIKES]-(this_likesAggregate_node:User)
    WITH this_likesAggregate_node, this_likesAggregate_edge, size(this_likesAggregate_node.name) AS this_likesAggregate_node_name_AVERAGE_GT_SIZE
    RETURN avg(this_likesAggregate_node_name_AVERAGE_GT_SIZE) > toFloat($this_likesAggregate_node_name_AVERAGE_GT) ",
    { this: this, this_likesAggregate_node_name_AVERAGE_GT: $this_likesAggregate_node_name_AVERAGE_GT },
    false
)
RETURN this { .content } as this
```

### Expected Cypher Params

```json
{
    "this_likesAggregate_node_name_AVERAGE_GT": 10
}
```

---

## AVERAGE_GTE

### GraphQL Input

```graphql
{
    posts(where: { likesAggregate: { node: { name_AVERAGE_GTE: 10 } } }) {
        content
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Post)
WHERE apoc.cypher.runFirstColumn("
    MATCH (this)<-[this_likesAggregate_edge:LIKES]-(this_likesAggregate_node:User)
    WITH this_likesAggregate_node, this_likesAggregate_edge, size(this_likesAggregate_node.name) AS this_likesAggregate_node_name_AVERAGE_GTE_SIZE
    RETURN avg(this_likesAggregate_node_name_AVERAGE_GTE_SIZE) >= toFloat($this_likesAggregate_node_name_AVERAGE_GTE) ",
    { this: this, this_likesAggregate_node_name_AVERAGE_GTE: $this_likesAggregate_node_name_AVERAGE_GTE },
    false
)
RETURN this { .content } as this
```

### Expected Cypher Params

```json
{
    "this_likesAggregate_node_name_AVERAGE_GTE": 10
}
```

---

## AVERAGE_LT

### GraphQL Input

```graphql
{
    posts(where: { likesAggregate: { node: { name_AVERAGE_LT: 10 } } }) {
        content
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Post)
WHERE apoc.cypher.runFirstColumn("
    MATCH (this)<-[this_likesAggregate_edge:LIKES]-(this_likesAggregate_node:User)
    WITH this_likesAggregate_node, this_likesAggregate_edge, size(this_likesAggregate_node.name) AS this_likesAggregate_node_name_AVERAGE_LT_SIZE
    RETURN avg(this_likesAggregate_node_name_AVERAGE_LT_SIZE) < toFloat($this_likesAggregate_node_name_AVERAGE_LT) ",
    { this: this, this_likesAggregate_node_name_AVERAGE_LT: $this_likesAggregate_node_name_AVERAGE_LT },
    false
)
RETURN this { .content } as this
```

### Expected Cypher Params

```json
{
    "this_likesAggregate_node_name_AVERAGE_LT": 10
}
```

---

## AVERAGE_LTE

### GraphQL Input

```graphql
{
    posts(where: { likesAggregate: { node: { name_AVERAGE_LTE: 10 } } }) {
        content
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Post)
WHERE apoc.cypher.runFirstColumn("
    MATCH (this)<-[this_likesAggregate_edge:LIKES]-(this_likesAggregate_node:User)
    WITH this_likesAggregate_node, this_likesAggregate_edge, size(this_likesAggregate_node.name) AS this_likesAggregate_node_name_AVERAGE_LTE_SIZE
    RETURN avg(this_likesAggregate_node_name_AVERAGE_LTE_SIZE) <= toFloat($this_likesAggregate_node_name_AVERAGE_LTE) ",
    { this: this, this_likesAggregate_node_name_AVERAGE_LTE: $this_likesAggregate_node_name_AVERAGE_LTE },
    false
)
RETURN this { .content } as this
```

### Expected Cypher Params

```json
{
    "this_likesAggregate_node_name_AVERAGE_LTE": 10
}
```

---
