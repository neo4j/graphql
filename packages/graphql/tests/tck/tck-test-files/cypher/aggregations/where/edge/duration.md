# Cypher Aggregations where edge with Duration

Tests for queries inside the relationship where aggregation arg using an Duration type.

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
    someDuration: Duration
    someDurationAlias: Duration @alias(property: "_someDurationAlias")
}
```

---

## EQUAL

### GraphQL Input

```graphql
{
    posts(where: { likesAggregate: { edge: { someDuration_EQUAL: "P1Y" } } }) {
        content
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Post)
WHERE apoc.cypher.runFirstColumn("
    MATCH (this)<-[this_likesAggregate_edge:LIKES]-(this_likesAggregate_node:User)
    RETURN this_likesAggregate_edge.someDuration = $this_likesAggregate_edge_someDuration_EQUAL ",
    { this: this, this_likesAggregate_edge_someDuration_EQUAL: $this_likesAggregate_edge_someDuration_EQUAL },
    false
)
RETURN this { .content } as this
```

### Expected Cypher Params

```json
{
    "this_likesAggregate_edge_someDuration_EQUAL": {
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

## EQUAL with alias

### GraphQL Input

```graphql
{
    posts(where: { likesAggregate: { edge: { someDurationAlias_EQUAL: "P1Y" } } }) {
        content
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Post)
WHERE apoc.cypher.runFirstColumn("
    MATCH (this)<-[this_likesAggregate_edge:LIKES]-(this_likesAggregate_node:User)
    RETURN this_likesAggregate_edge._someDurationAlias = $this_likesAggregate_edge_someDurationAlias_EQUAL ",
    { this: this, this_likesAggregate_edge_someDurationAlias_EQUAL: $this_likesAggregate_edge_someDurationAlias_EQUAL },
    false
)
RETURN this { .content } as this
```

### Expected Cypher Params

```json
{
    "this_likesAggregate_edge_someDurationAlias_EQUAL": {
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
    posts(where: { likesAggregate: { edge: { someDuration_GT: "P1Y" } } }) {
        content
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Post)
WHERE apoc.cypher.runFirstColumn("
    MATCH (this)<-[this_likesAggregate_edge:LIKES]-(this_likesAggregate_node:User)
    RETURN this_likesAggregate_edge.someDuration > $this_likesAggregate_edge_someDuration_GT ",
    { this: this, this_likesAggregate_edge_someDuration_GT: $this_likesAggregate_edge_someDuration_GT },
    false
)
RETURN this { .content } as this
```

### Expected Cypher Params

```json
{
    "this_likesAggregate_edge_someDuration_GT": {
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
    posts(where: { likesAggregate: { edge: { someDuration_GTE: "P1Y" } } }) {
        content
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Post)
WHERE apoc.cypher.runFirstColumn("
    MATCH (this)<-[this_likesAggregate_edge:LIKES]-(this_likesAggregate_node:User)
    RETURN this_likesAggregate_edge.someDuration >= $this_likesAggregate_edge_someDuration_GTE ",
    { this: this, this_likesAggregate_edge_someDuration_GTE: $this_likesAggregate_edge_someDuration_GTE },
    false
)
RETURN this { .content } as this
```

### Expected Cypher Params

```json
{
    "this_likesAggregate_edge_someDuration_GTE": {
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
    posts(where: { likesAggregate: { edge: { someDuration_LT: "P1Y" } } }) {
        content
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Post)
WHERE apoc.cypher.runFirstColumn("
    MATCH (this)<-[this_likesAggregate_edge:LIKES]-(this_likesAggregate_node:User)
    RETURN this_likesAggregate_edge.someDuration < $this_likesAggregate_edge_someDuration_LT ",
    { this: this, this_likesAggregate_edge_someDuration_LT: $this_likesAggregate_edge_someDuration_LT },
    false
)
RETURN this { .content } as this
```

### Expected Cypher Params

```json
{
    "this_likesAggregate_edge_someDuration_LT": {
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
    posts(where: { likesAggregate: { edge: { someDuration_LTE: "P1Y" } } }) {
        content
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Post)
WHERE apoc.cypher.runFirstColumn("
    MATCH (this)<-[this_likesAggregate_edge:LIKES]-(this_likesAggregate_node:User)
    RETURN this_likesAggregate_edge.someDuration <= $this_likesAggregate_edge_someDuration_LTE ",
    { this: this, this_likesAggregate_edge_someDuration_LTE: $this_likesAggregate_edge_someDuration_LTE },
    false
)
RETURN this { .content } as this
```

### Expected Cypher Params

```json
{
    "this_likesAggregate_edge_someDuration_LTE": {
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

## AVERAGE_EQUAL

### GraphQL Input

```graphql
{
    posts(where: { likesAggregate: { edge: { someDuration_AVERAGE_EQUAL: "P1Y" } } }) {
        content
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Post)
WHERE apoc.cypher.runFirstColumn("
    MATCH (this)<-[this_likesAggregate_edge:LIKES]-(this_likesAggregate_node:User)
    RETURN avg(this_likesAggregate_edge.someDuration) = $this_likesAggregate_edge_someDuration_AVERAGE_EQUAL ",
    { this: this, this_likesAggregate_edge_someDuration_AVERAGE_EQUAL: $this_likesAggregate_edge_someDuration_AVERAGE_EQUAL },
    false
)
RETURN this { .content } as this
```

### Expected Cypher Params

```json
{
    "this_likesAggregate_edge_someDuration_AVERAGE_EQUAL": {
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

## AVERAGE_GT

### GraphQL Input

```graphql
{
    posts(where: { likesAggregate: { edge: { someDuration_AVERAGE_GT: "P1Y" } } }) {
        content
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Post)
WHERE apoc.cypher.runFirstColumn("
    MATCH (this)<-[this_likesAggregate_edge:LIKES]-(this_likesAggregate_node:User)
    RETURN avg(this_likesAggregate_edge.someDuration) > $this_likesAggregate_edge_someDuration_AVERAGE_GT ",
    { this: this, this_likesAggregate_edge_someDuration_AVERAGE_GT: $this_likesAggregate_edge_someDuration_AVERAGE_GT },
    false
)
RETURN this { .content } as this
```

### Expected Cypher Params

```json
{
    "this_likesAggregate_edge_someDuration_AVERAGE_GT": {
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

## AVERAGE_GTE

### GraphQL Input

```graphql
{
    posts(where: { likesAggregate: { edge: { someDuration_AVERAGE_GTE: "P1Y" } } }) {
        content
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Post)
WHERE apoc.cypher.runFirstColumn("
    MATCH (this)<-[this_likesAggregate_edge:LIKES]-(this_likesAggregate_node:User)
    RETURN avg(this_likesAggregate_edge.someDuration) >= $this_likesAggregate_edge_someDuration_AVERAGE_GTE ",
    { this: this, this_likesAggregate_edge_someDuration_AVERAGE_GTE: $this_likesAggregate_edge_someDuration_AVERAGE_GTE },
    false
)
RETURN this { .content } as this
```

### Expected Cypher Params

```json
{
    "this_likesAggregate_edge_someDuration_AVERAGE_GTE": {
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

## AVERAGE_LT

### GraphQL Input

```graphql
{
    posts(where: { likesAggregate: { edge: { someDuration_AVERAGE_LT: "P1Y" } } }) {
        content
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Post)
WHERE apoc.cypher.runFirstColumn("
    MATCH (this)<-[this_likesAggregate_edge:LIKES]-(this_likesAggregate_node:User)
    RETURN avg(this_likesAggregate_edge.someDuration) < $this_likesAggregate_edge_someDuration_AVERAGE_LT ",
    { this: this, this_likesAggregate_edge_someDuration_AVERAGE_LT: $this_likesAggregate_edge_someDuration_AVERAGE_LT },
    false
)
RETURN this { .content } as this
```

### Expected Cypher Params

```json
{
    "this_likesAggregate_edge_someDuration_AVERAGE_LT": {
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

## AVERAGE_LTE

### GraphQL Input

```graphql
{
    posts(where: { likesAggregate: { edge: { someDuration_AVERAGE_LTE: "P1Y" } } }) {
        content
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Post)
WHERE apoc.cypher.runFirstColumn("
    MATCH (this)<-[this_likesAggregate_edge:LIKES]-(this_likesAggregate_node:User)
    RETURN avg(this_likesAggregate_edge.someDuration) <= $this_likesAggregate_edge_someDuration_AVERAGE_LTE ",
    { this: this, this_likesAggregate_edge_someDuration_AVERAGE_LTE: $this_likesAggregate_edge_someDuration_AVERAGE_LTE },
    false
)
RETURN this { .content } as this
```

### Expected Cypher Params

```json
{
    "this_likesAggregate_edge_someDuration_AVERAGE_LTE": {
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

## MIN_EQUAL

### GraphQL Input

```graphql
{
    posts(where: { likesAggregate: { edge: { someDuration_MIN_EQUAL: "P1Y" } } }) {
        content
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Post)
WHERE apoc.cypher.runFirstColumn("
    MATCH (this)<-[this_likesAggregate_edge:LIKES]-(this_likesAggregate_node:User)
    RETURN min(this_likesAggregate_edge.someDuration) = $this_likesAggregate_edge_someDuration_MIN_EQUAL ",
    { this: this, this_likesAggregate_edge_someDuration_MIN_EQUAL: $this_likesAggregate_edge_someDuration_MIN_EQUAL },
    false
)
RETURN this { .content } as this
```

### Expected Cypher Params

```json
{
    "this_likesAggregate_edge_someDuration_MIN_EQUAL": {
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

## MIN_GT

### GraphQL Input

```graphql
{
    posts(where: { likesAggregate: { edge: { someDuration_MIN_GT: "P1Y" } } }) {
        content
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Post)
WHERE apoc.cypher.runFirstColumn("
    MATCH (this)<-[this_likesAggregate_edge:LIKES]-(this_likesAggregate_node:User)
    RETURN min(this_likesAggregate_edge.someDuration) > $this_likesAggregate_edge_someDuration_MIN_GT ",
    { this: this, this_likesAggregate_edge_someDuration_MIN_GT: $this_likesAggregate_edge_someDuration_MIN_GT },
    false
)
RETURN this { .content } as this
```

### Expected Cypher Params

```json
{
    "this_likesAggregate_edge_someDuration_MIN_GT": {
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

## MIN_GTE

### GraphQL Input

```graphql
{
    posts(where: { likesAggregate: { edge: { someDuration_MIN_GTE: "P1Y" } } }) {
        content
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Post)
WHERE apoc.cypher.runFirstColumn("
    MATCH (this)<-[this_likesAggregate_edge:LIKES]-(this_likesAggregate_node:User)
    RETURN min(this_likesAggregate_edge.someDuration) >= $this_likesAggregate_edge_someDuration_MIN_GTE ",
    { this: this, this_likesAggregate_edge_someDuration_MIN_GTE: $this_likesAggregate_edge_someDuration_MIN_GTE },
    false
)
RETURN this { .content } as this
```

### Expected Cypher Params

```json
{
    "this_likesAggregate_edge_someDuration_MIN_GTE": {
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

## MIN_LT

### GraphQL Input

```graphql
{
    posts(where: { likesAggregate: { edge: { someDuration_MIN_LT: "P1Y" } } }) {
        content
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Post)
WHERE apoc.cypher.runFirstColumn("
    MATCH (this)<-[this_likesAggregate_edge:LIKES]-(this_likesAggregate_node:User)
    RETURN min(this_likesAggregate_edge.someDuration) < $this_likesAggregate_edge_someDuration_MIN_LT ",
    { this: this, this_likesAggregate_edge_someDuration_MIN_LT: $this_likesAggregate_edge_someDuration_MIN_LT },
    false
)
RETURN this { .content } as this
```

### Expected Cypher Params

```json
{
    "this_likesAggregate_edge_someDuration_MIN_LT": {
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

## MIN_LTE

### GraphQL Input

```graphql
{
    posts(where: { likesAggregate: { edge: { someDuration_MIN_LTE: "P1Y" } } }) {
        content
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Post)
WHERE apoc.cypher.runFirstColumn("
    MATCH (this)<-[this_likesAggregate_edge:LIKES]-(this_likesAggregate_node:User)
    RETURN min(this_likesAggregate_edge.someDuration) <= $this_likesAggregate_edge_someDuration_MIN_LTE ",
    { this: this, this_likesAggregate_edge_someDuration_MIN_LTE: $this_likesAggregate_edge_someDuration_MIN_LTE },
    false
)
RETURN this { .content } as this
```

### Expected Cypher Params

```json
{
    "this_likesAggregate_edge_someDuration_MIN_LTE": {
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

## MAX_EQUAL

### GraphQL Input

```graphql
{
    posts(where: { likesAggregate: { edge: { someDuration_MAX_EQUAL: "P1Y" } } }) {
        content
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Post)
WHERE apoc.cypher.runFirstColumn("
    MATCH (this)<-[this_likesAggregate_edge:LIKES]-(this_likesAggregate_node:User)
    RETURN max(this_likesAggregate_edge.someDuration) = $this_likesAggregate_edge_someDuration_MAX_EQUAL ",
    { this: this, this_likesAggregate_edge_someDuration_MAX_EQUAL: $this_likesAggregate_edge_someDuration_MAX_EQUAL },
    false
)
RETURN this { .content } as this
```

### Expected Cypher Params

```json
{
    "this_likesAggregate_edge_someDuration_MAX_EQUAL": {
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

## MAX_GT

### GraphQL Input

```graphql
{
    posts(where: { likesAggregate: { edge: { someDuration_MAX_GT: "P1Y" } } }) {
        content
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Post)
WHERE apoc.cypher.runFirstColumn("
    MATCH (this)<-[this_likesAggregate_edge:LIKES]-(this_likesAggregate_node:User)
    RETURN max(this_likesAggregate_edge.someDuration) > $this_likesAggregate_edge_someDuration_MAX_GT ",
    { this: this, this_likesAggregate_edge_someDuration_MAX_GT: $this_likesAggregate_edge_someDuration_MAX_GT },
    false
)
RETURN this { .content } as this
```

### Expected Cypher Params

```json
{
    "this_likesAggregate_edge_someDuration_MAX_GT": {
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

## MAX_GTE

### GraphQL Input

```graphql
{
    posts(where: { likesAggregate: { edge: { someDuration_MAX_GTE: "P1Y" } } }) {
        content
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Post)
WHERE apoc.cypher.runFirstColumn("
    MATCH (this)<-[this_likesAggregate_edge:LIKES]-(this_likesAggregate_node:User)
    RETURN max(this_likesAggregate_edge.someDuration) >= $this_likesAggregate_edge_someDuration_MAX_GTE ",
    { this: this, this_likesAggregate_edge_someDuration_MAX_GTE: $this_likesAggregate_edge_someDuration_MAX_GTE },
    false
)
RETURN this { .content } as this
```

### Expected Cypher Params

```json
{
    "this_likesAggregate_edge_someDuration_MAX_GTE": {
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

## MAX_LT

### GraphQL Input

```graphql
{
    posts(where: { likesAggregate: { edge: { someDuration_MAX_LT: "P1Y" } } }) {
        content
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Post)
WHERE apoc.cypher.runFirstColumn("
    MATCH (this)<-[this_likesAggregate_edge:LIKES]-(this_likesAggregate_node:User)
    RETURN max(this_likesAggregate_edge.someDuration) < $this_likesAggregate_edge_someDuration_MAX_LT ",
    { this: this, this_likesAggregate_edge_someDuration_MAX_LT: $this_likesAggregate_edge_someDuration_MAX_LT },
    false
)
RETURN this { .content } as this
```

### Expected Cypher Params

```json
{
    "this_likesAggregate_edge_someDuration_MAX_LT": {
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

## MAX_LTE

### GraphQL Input

```graphql
{
    posts(where: { likesAggregate: { edge: { someDuration_MAX_LTE: "P1Y" } } }) {
        content
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Post)
WHERE apoc.cypher.runFirstColumn("
    MATCH (this)<-[this_likesAggregate_edge:LIKES]-(this_likesAggregate_node:User)
    RETURN max(this_likesAggregate_edge.someDuration) <= $this_likesAggregate_edge_someDuration_MAX_LTE ",
    { this: this, this_likesAggregate_edge_someDuration_MAX_LTE: $this_likesAggregate_edge_someDuration_MAX_LTE },
    false
)
RETURN this { .content } as this
```

### Expected Cypher Params

```json
{
    "this_likesAggregate_edge_someDuration_MAX_LTE": {
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
