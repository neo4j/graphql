# Remove `runFirstColumn` from Aggregate Where

## Problem

We are aiming to remove `apoc.runFirstColumn` use from our code base because it causes the following issues:
* Hard to maintain and compose queries
* Bad performance due to secondary processes being spawned for the queries
* apoc methods cannot be properly planned by Neo4j database, leading to worse performance.

## Current Solution

Currently, for the following type definitions:

```graphql
    type User {
        name: String!
    }

    type Post {
        content: String!
        likes: [User!]! @relationship(type: "LIKES", direction: IN)
    }
```

The following query:

```graphql
{
	posts(where: { likesAggregate: { count: 10 } }) {
		content
	}
}
```

Would produce the following cypher:

```cypher
MATCH (this:Post)
WHERE apoc.cypher.runFirstColumnSingle(
    "MATCH (this)<-[aggr_edge:LIKES]-(aggr_node:User)RETURN count(aggr_node) = 10",
    { this: this, aggr_count: 10 }
)
RETURN this { .content } AS this'
```

## Proposed Solution

Use a `CALL` clause to perform the query that is currently performed within `runFirstColumn`.

Therefore, the example query should produce the following cypher:

```cypher
MATCH(this:Post)
CALL {
    WITH this
    MATCH(this)<-[:LIKES]-(u:User)
    RETURN count(u) as thisLikesAggregateCount
}
WITH *
WHERE thisLikesAggregateCount = 10
RETURN this { .content } AS this
```

## Risks

A `CALL` clause may not be valid in all locations that a `WHERE` `runFirstColumn` is for some edge cases.

## Out of Scope

Removing `apoc.runFirstColumn` from other places such as queries for aggregate counts.
