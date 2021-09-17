# Cypher Aggregations where with logical AND plus OR

Tests for queries inside the relationship where aggregation arg using the count key with AND plus OR.

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

## AND

### GraphQL Input

```graphql
{
    posts(
        where: { likesAggregate: { AND: [{ count_GT: 10 }, { count_LT: 20 }] } }
    ) {
        content
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Post)
WHERE apoc.cypher.runFirstColumn("
    MATCH (this)<-[:LIKES]-(this_likesAggregate_node:User) RETURN (count(this_likesAggregate_node) > $this_likesAggregate_AND_0_count_GT AND count(this_likesAggregate_node) < $this_likesAggregate_AND_1_count_LT) ",
    { this: this, this_likesAggregate_AND_0_count_GT: $this_likesAggregate_AND_0_count_GT, this_likesAggregate_AND_1_count_LT: $this_likesAggregate_AND_1_count_LT },
    false
)
RETURN this { .content } as this
```

### Expected Cypher Params

```json
{
    "this_likesAggregate_AND_0_count_GT": {
        "high": 0,
        "low": 10
    },
    "this_likesAggregate_AND_1_count_LT": {
        "high": 0,
        "low": 20
    }
}
```

---

## OR

### GraphQL Input

```graphql
{
    posts(
        where: { likesAggregate: { OR: [{ count_GT: 10 }, { count_LT: 20 }] } }
    ) {
        content
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Post)
WHERE apoc.cypher.runFirstColumn("
    MATCH (this)<-[:LIKES]-(this_likesAggregate_node:User)
    RETURN (count(this_likesAggregate_node) > $this_likesAggregate_OR_0_count_GT OR count(this_likesAggregate_node) < $this_likesAggregate_OR_1_count_LT) ",
    { this: this, this_likesAggregate_OR_0_count_GT: $this_likesAggregate_OR_0_count_GT, this_likesAggregate_OR_1_count_LT: $this_likesAggregate_OR_1_count_LT },
    false
)
RETURN this { .content } as this
```

### Expected Cypher Params

```json
{
    "this_likesAggregate_OR_0_count_GT": {
        "high": 0,
        "low": 10
    },
    "this_likesAggregate_OR_1_count_LT": {
        "high": 0,
        "low": 20
    }
}
```

---

## AND plus OR

### GraphQL Input

```graphql
{
    posts(
        where: {
            likesAggregate: {
                AND: [{ count_GT: 10 }, { count_LT: 20 }]
                OR: [{ count_GT: 10 }, { count_LT: 20 }]
            }
        }
    ) {
        content
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Post)
WHERE apoc.cypher.runFirstColumn("
    MATCH (this)<-[:LIKES]-(this_likesAggregate_node:User)
    RETURN (count(this_likesAggregate_node) > $this_likesAggregate_AND_0_count_GT AND count(this_likesAggregate_node) < $this_likesAggregate_AND_1_count_LT) AND (count(this_likesAggregate_node) > $this_likesAggregate_OR_0_count_GT OR count(this_likesAggregate_node) < $this_likesAggregate_OR_1_count_LT) ",
    { this: this, this_likesAggregate_AND_0_count_GT: $this_likesAggregate_AND_0_count_GT, this_likesAggregate_AND_1_count_LT: $this_likesAggregate_AND_1_count_LT, this_likesAggregate_OR_0_count_GT: $this_likesAggregate_OR_0_count_GT, this_likesAggregate_OR_1_count_LT: $this_likesAggregate_OR_1_count_LT },
    false
)
RETURN this { .content } as this
```

### Expected Cypher Params

```json
{
    "this_likesAggregate_AND_0_count_GT": {
        "high": 0,
        "low": 10
    },
    "this_likesAggregate_AND_1_count_LT": {
        "high": 0,
        "low": 20
    },
    "this_likesAggregate_OR_0_count_GT": {
        "high": 0,
        "low": 10
    },
    "this_likesAggregate_OR_1_count_LT": {
        "high": 0,
        "low": 20
    }
}
```

---
