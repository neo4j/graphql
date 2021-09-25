# Cypher Aggregations where node with Duration

Tests for queries inside the relationship where aggregation arg using an Duration type.

Schema:

```graphql
type User {
    someDuration: Duration
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
    posts(where: { likesAggregate: { node: { someDuration_EQUAL: "P1Y" } } }) {
        content
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Post)
WHERE apoc.cypher.runFirstColumn("
    MATCH (this)<-[:LIKES]-(this_likesAggregate_node:User)
    RETURN this_likesAggregate_node.someDuration = $this_likesAggregate_node_someDuration_EQUAL ",
    { this: this, this_likesAggregate_node_someDuration_EQUAL: $this_likesAggregate_node_someDuration_EQUAL },
    false
)
RETURN this { .content } as this
```

### Expected Cypher Params

```json
{
    "this_likesAggregate_node_someDuration_EQUAL": {
        "months": 12,
        "days": 0,
        "seconds": {
            "high": 0,
            "low": 0
        },
        "nanoseconds": {
            "high": 0,
            "low": 0
        }
    }
}
```

---

## GT

### GraphQL Input

```graphql
{
    posts(where: { likesAggregate: { node: { someDuration_GT: "P1Y" } } }) {
        content
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Post)
WHERE apoc.cypher.runFirstColumn("
    MATCH (this)<-[:LIKES]-(this_likesAggregate_node:User)
    RETURN this_likesAggregate_node.someDuration > $this_likesAggregate_node_someDuration_GT ",
    { this: this, this_likesAggregate_node_someDuration_GT: $this_likesAggregate_node_someDuration_GT },
    false
)
RETURN this { .content } as this
```

### Expected Cypher Params

```json
{
    "this_likesAggregate_node_someDuration_GT": {
        "months": 12,
        "days": 0,
        "seconds": {
            "high": 0,
            "low": 0
        },
        "nanoseconds": {
            "high": 0,
            "low": 0
        }
    }
}
```

---

## GTE

### GraphQL Input

```graphql
{
    posts(where: { likesAggregate: { node: { someDuration_GTE: "P1Y" } } }) {
        content
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Post)
WHERE apoc.cypher.runFirstColumn("
    MATCH (this)<-[:LIKES]-(this_likesAggregate_node:User)
    RETURN this_likesAggregate_node.someDuration >= $this_likesAggregate_node_someDuration_GTE ",
    { this: this, this_likesAggregate_node_someDuration_GTE: $this_likesAggregate_node_someDuration_GTE },
    false
)
RETURN this { .content } as this
```

### Expected Cypher Params

```json
{
    "this_likesAggregate_node_someDuration_GTE": {
        "months": 12,
        "days": 0,
        "seconds": {
            "high": 0,
            "low": 0
        },
        "nanoseconds": {
            "high": 0,
            "low": 0
        }
    }
}
```

---

## LT

### GraphQL Input

```graphql
{
    posts(where: { likesAggregate: { node: { someDuration_LT: "P1Y" } } }) {
        content
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Post)
WHERE apoc.cypher.runFirstColumn("
    MATCH (this)<-[:LIKES]-(this_likesAggregate_node:User)
    RETURN this_likesAggregate_node.someDuration < $this_likesAggregate_node_someDuration_LT ",
    { this: this, this_likesAggregate_node_someDuration_LT: $this_likesAggregate_node_someDuration_LT },
    false
)
RETURN this { .content } as this
```

### Expected Cypher Params

```json
{
    "this_likesAggregate_node_someDuration_LT": {
        "months": 12,
        "days": 0,
        "seconds": {
            "high": 0,
            "low": 0
        },
        "nanoseconds": {
            "high": 0,
            "low": 0
        }
    }
}
```

---

## LTE

### GraphQL Input

```graphql
{
    posts(where: { likesAggregate: { node: { someDuration_LTE: "P1Y" } } }) {
        content
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Post)
WHERE apoc.cypher.runFirstColumn("
    MATCH (this)<-[:LIKES]-(this_likesAggregate_node:User)
    RETURN this_likesAggregate_node.someDuration <= $this_likesAggregate_node_someDuration_LTE ",
    { this: this, this_likesAggregate_node_someDuration_LTE: $this_likesAggregate_node_someDuration_LTE },
    false
)
RETURN this { .content } as this
```

### Expected Cypher Params

```json
{
    "this_likesAggregate_node_someDuration_LTE": {
        "months": 12,
        "days": 0,
        "seconds": {
            "high": 0,
            "low": 0
        },
        "nanoseconds": {
            "high": 0,
            "low": 0
        }
    }
}
```

---
