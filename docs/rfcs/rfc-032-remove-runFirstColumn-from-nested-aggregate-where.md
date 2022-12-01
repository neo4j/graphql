# Remove `runFirstColumn` from Aggregate Where

## Problem

The aim is to remove `apoc.runFirstColumn` use from the code base because it causes the following issues:
* Hard to maintain and compose queries
* Bad performance due to secondary processes being spawned for the queries
* apoc methods cannot be properly planned by Neo4j database, leading to worse performance.

A previous attempt was made to remove `apoc.runFirstColumn` from nested aggregate where. By replacing the following types/query/cypher:

Type defs:

```graphql
    type User {
        name: String!
    }

    type Post {
        content: String!
        likes: [User!]! @relationship(type: "LIKES", direction: IN)
    }
```

Query:

```graphql
{
	posts(where: { likesAggregate: { count: 10 } }) {
		content
	}
}
```

Cypher:

```cypher
MATCH (this:Post)
WHERE apoc.cypher.runFirstColumnSingle(
    "MATCH (this)<-[aggr_edge:LIKES]-(aggr_node:User)RETURN count(aggr_node) = 10",
    { this: this, aggr_count: 10 }
)
RETURN this { .content } AS this'
```

With a `CALL` that pre-computed the required `WHERE` predicates:

```cypher
MATCH(this:Post)
CALL {
    WITH this
    MATCH(this)<-[:LIKES]-(u:User)
    RETURN count(u) = 10 as thisLikesAggregateCount
}
WITH *
WHERE thisLikesAggregateCount = true
RETURN this { .content } AS this
```

This approach worked successfully for top-level where filters. However, it did not work for nested aggregate where filters. Take for example, the following types/mutation/cypher:

Type defs:

```graphql
type User {
    name: String!
    likedPosts: [Post!]! @relationship(type: "LIKES", direction: OUT)
}

type Post {
    id: ID
    content: String!
    likes: [User!]! @relationship(type: "LIKES", direction: IN)
}
```

Mutation:

```graphql
mutation {
    updateUsers(
        where: { name: "someUser" } # This is a top-level-where
        update: { 
            likedPosts: {
                where: { # This is a nested where
                    node: {
                        likesAggregate: {
                            count: 2
                        }
                    } 
                } 
                update: {
                    node: {
                        content: "New Content!"
                    } 
                } 
            } 
    }) {
        users {
            name
            likedPosts {
                id
                content
            }
        }
    }
}
```

Cypher:

```cypher
MATCH (this:`User`)
WHERE this.name = "someUser"
WITH this
OPTIONAL MATCH (this)-[this_likes0_relationship:LIKES]->(this_likedPosts0:Post) # Note this OPTIONAL MATCH
WHERE apoc.cypher.runFirstColumnSingle("
    MATCH (this_likedPosts0)<-[aggr_edge:LIKES]-(aggr_node:User)
    RETURN count(aggr_node) = 2
", { this_likedPosts0: this_likedPosts0 })
CALL apoc.do.when(this_likedPosts0 IS NOT NULL, "
    SET this_likedPosts0.content = $this_update_likedPosts0_content
    RETURN count(*) AS _
", "", {this:this, this_likedPosts0:this_likedPosts0})
YIELD value AS _
WITH *
CALL {
    WITH this
    MATCH (this)-[update_this0:LIKES]->(this_likedPosts:`Post`)
    WITH this_likedPosts { .id, .content } AS this_likedPosts
    RETURN collect(this_likedPosts) AS this_likedPosts
}
RETURN collect(DISTINCT this { .name, likedPosts: this_likedPosts }) AS data
```

Attempting to use the previous solution here, produces the following Cypher:

```cypher
MATCH (this:`User`)
WHERE this.name = "someUser"
WITH this
OPTIONAL MATCH (this)-[this_likes0_relationship:LIKES]->(this_likedPosts0:Post) # Note this OPTIONAL MATCH
CALL {
    WITH this_likedPosts0
    MATCH (this_likedPosts0)<-[aggr_edge:LIKES]-(aggr_node:User)
    RETURN count(aggr_node) = 2 AS this_likePosts0_aggrCount
}
WITH * // This line causes the issue
WHERE this_likePosts0_aggrCount = true
CALL apoc.do.when(this_likedPosts0 IS NOT NULL, "
    SET this_likedPosts0.content = $this_update_likedPosts0_content
    RETURN count(*) AS _
", "", {this:this, this_likedPosts0:this_likedPosts0})
YIELD value AS _
WITH *
CALL {
    WITH this
    MATCH (this)-[update_this0:LIKES]->(this_likedPosts:`Post`)
    WITH this_likedPosts { .id, .content } AS this_likedPosts
    RETURN collect(this_likedPosts) AS this_likedPosts
}
RETURN collect(DISTINCT this { .name, likedPosts: this_likedPosts }) AS data
```

Notice how a `WITH *` is required between the `CALL (subquery)` following the `OPTIONAL MATCH` and the `WHERE` clause. This is required, because applying a `WHERE` clause directly after a `CALL (subquery)` is invalid Cypher.

However, if a `WHERE` clause is not applied directly to an `OPTIONAL MATCH`, it behaves as though being applied to a standard `MATCH`. This means that instead of returning still returning `this` along with `null` for `this_likes0_relationship` and `this_likedPosts0` when the conditions of the `WHERE` clause are not met, the whole row is not returned. This means that the top-level node `this` is also filtered, which is not the desired outcome and results in some nodes not being updated as required.
