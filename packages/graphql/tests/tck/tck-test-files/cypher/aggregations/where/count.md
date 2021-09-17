# Cypher Aggregations where with count

Tests for queries inside the relationship where aggregation arg using the count key.

Schema:

```graphql
type User {
    name: String!
}

type Post {
    content: String!
    likes: [User] @relationship(type: "LIKES", direction: IN)
}
```

---

## Equality Count

### GraphQL Input

```graphql
{
    posts(where: { likesAggregate: { count: 10 } }) {
        content
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Post)
WHERE apoc.cypher.runFirstColumn("
    MATCH (this)<-[:LIKES]-(this_likesAggregate_node:User)
    RETURN count(this_likesAggregate_node) = $this_likesAggregate_count ",
    { this: this, this_likesAggregate_count: $this_likesAggregate_count },
    false
)
RETURN this { .content } as this
```

### Expected Cypher Params

```json
{
    "this_likesAggregate_count": {
        "high": 0,
        "low": 10
    }
}
```

---

## LT Count

### GraphQL Input

```graphql
{
    posts(where: { likesAggregate: { count_LT: 10 } }) {
        content
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Post)
WHERE apoc.cypher.runFirstColumn("
    MATCH (this)<-[:LIKES]-(this_likesAggregate_node:User)
    RETURN count(this_likesAggregate_node) < $this_likesAggregate_count_LT ",
    { this: this, this_likesAggregate_count_LT: $this_likesAggregate_count_LT },
    false
)
RETURN this { .content } as this
```

### Expected Cypher Params

```json
{
    "this_likesAggregate_count_LT": {
        "high": 0,
        "low": 10
    }
}
```

---

## LTE Count

### GraphQL Input

```graphql
{
    posts(where: { likesAggregate: { count_LTE: 10 } }) {
        content
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Post)
WHERE apoc.cypher.runFirstColumn("
    MATCH (this)<-[:LIKES]-(this_likesAggregate_node:User)
    RETURN count(this_likesAggregate_node) <= $this_likesAggregate_count_LTE ",
    { this: this, this_likesAggregate_count_LTE: $this_likesAggregate_count_LTE },
    false
)
RETURN this { .content } as this
```

### Expected Cypher Params

```json
{
    "this_likesAggregate_count_LTE": {
        "high": 0,
        "low": 10
    }
}
```

---

## GT Count

### GraphQL Input

```graphql
{
    posts(where: { likesAggregate: { count_GT: 10 } }) {
        content
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Post)
WHERE apoc.cypher.runFirstColumn("
    MATCH (this)<-[:LIKES]-(this_likesAggregate_node:User)
    RETURN count(this_likesAggregate_node) > $this_likesAggregate_count_GT ",
    { this: this, this_likesAggregate_count_GT: $this_likesAggregate_count_GT },
    false
)
RETURN this { .content } as this
```

### Expected Cypher Params

```json
{
    "this_likesAggregate_count_GT": {
        "high": 0,
        "low": 10
    }
}
```

---

## GTE Count

### GraphQL Input

```graphql
{
    posts(where: { likesAggregate: { count_GTE: 10 } }) {
        content
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Post)
WHERE apoc.cypher.runFirstColumn("
    MATCH (this)<-[:LIKES]-(this_likesAggregate_node:User)
    RETURN count(this_likesAggregate_node) >= $this_likesAggregate_count_GTE ",
    { this: this, this_likesAggregate_count_GTE: $this_likesAggregate_count_GTE },
    false
)
RETURN this { .content } as this
```

### Expected Cypher Params

```json
{
    "this_likesAggregate_count_GTE": {
        "high": 0,
        "low": 10
    }
}
```

---
