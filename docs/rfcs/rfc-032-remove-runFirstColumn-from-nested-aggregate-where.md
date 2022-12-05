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
OPTIONAL MATCH (this)-[this_likes0_relationship:LIKES]->(this_likedPosts0:Post) // Note this OPTIONAL MATCH
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
OPTIONAL MATCH (this)-[this_likes0_relationship:LIKES]->(this_likedPosts0:Post) // Note this OPTIONAL MATCH
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

## Proposed Solution

A `WITH CASE` clause can be used to apply the predicates and returning the nodes/relations when conditions are met and `null` when the conditions are not met. This means that the same behaviour is maintained, as when the `WHERE` clause is applied directly to the `OPTIONAL MATCH`:

```cypher
MATCH (this:`User`)
WHERE this.name = "someUser"
WITH this
OPTIONAL MATCH (this)-[this_likes0_relationship:LIKES]->(this_likedPosts0:Post)
CALL {
    WITH this_likedPosts0
    MATCH (this_likedPosts0)<-[aggr_edge:LIKES]-(aggr_node:User)
    RETURN count(aggr_node) = 2 AS this_likePosts0_aggrCount
}
WITH DISTINCT *, CASE this_likePosts0_aggrCount = true
    WHEN true THEN [this_likes0_relationship, this_likedPosts0]
    ELSE [null, null]
END AS someVar
WITH *, someVar[0] AS this_likes0_relationship, someVar[1] AS this_likedPosts0
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

Note that a `DISTINCT` has been used to reduce the cardinality without losing any data.

## Risks

There is a slight change to the cardinality with this solution.

Consider, the Cypher in the proposed solution and the case where "someUser" has liked 2 posts. One of these posts has 2 likes whilst the other does not. In this case the proposed Cypher would produce the following results:

| this       | this_likes0_relationship | this_likedPosts0 |
|------------|--------------------------|------------------|
| this       | null                     | null             |
| this       | this_likes0_relationship | this_likedPosts0 |

Note that the row where `this_likes0_relationship` and `this_likedPosts0` are null has been kept. However, if the `WHERE` clause was applied directly to the `OPTIONAL MATCH` the `null` row would have been removed (assuming there are cases for the same `this` node where they are not `null`):

| this       | this_likes0_relationship | this_likedPosts0 |
|------------|--------------------------|------------------|
| this       | this_likes0_relationship | this_likedPosts0 |


This means that there is an extra occurrence of `this`. This is unlikely to cause an issue as `this` is not manipulated at the nested level and the duplication can be removed by adding `WITH DISTINCT this` between nested blocks. For example, this is the query we would propose for deleting an interface using a nested aggregation filter:

Current cypher:

```cypher
MATCH (this:`Actor`)
WITH *
WHERE this.name = "actorName"
WITH this
OPTIONAL MATCH (this)-[this_actedIn_Movie0_relationship:ACTED_IN]->(this_actedIn_Movie0:Movie)
WITH *
WHERE this_actedIn_Movie0.title = "movieTitle"
WITH this, collect(DISTINCT this_actedIn_Movie0) AS this_actedIn_Movie0_to_delete
CALL {
    WITH this_actedIn_Movie0_to_delete
    UNWIND this_actedIn_Movie0_to_delete AS x
    DETACH DELETE x
    RETURN count(*) AS _
}
WITH this
OPTIONAL MATCH (this)-[this_actedIn_Series0_relationship:ACTED_IN]->(this_actedIn_Series0:Series)
WITH *
WHERE this_actedIn_Series0.title = "movieTitle"
WITH this, collect(DISTINCT this_actedIn_Series0) AS this_actedIn_Series0_to_delete
CALL {
    WITH this_actedIn_Series0_to_delete
    UNWIND this_actedIn_Series0_to_delete AS x
    DETACH DELETE x
    RETURN count(*) AS _
}
DETACH DELETE this
```

Proposed cypher:

```cypher
MATCH (this:`Actor`)
WITH *
WHERE this.name = "actorName"
WITH this
OPTIONAL MATCH (this)-[this_actedIn_Movie0_relationship:ACTED_IN]->(this_actedIn_Movie0:Movie)
WITH DISTINCT *, CASE this_actedIn_Movie0.title = "movieTitle"
    WHEN true THEN [this_actedIn_Movie0_relationship, this_actedIn_Movie0]
    ELSE [null, null]
END AS someVar
WITH DISTINCT *, someVar[0] AS this_actedIn_Movie0_relationship, someVar[1] AS this_actedIn_Movie0
WITH this, collect(DISTINCT this_actedIn_Movie0) AS this_actedIn_Movie0_to_delete
CALL {
    WITH this_actedIn_Movie0_to_delete
    UNWIND this_actedIn_Movie0_to_delete AS x
    DETACH DELETE x
    RETURN count(*) AS _
}
WITH DISTINCT this // Duplicate this is now removed
OPTIONAL MATCH (this)-[this_actedIn_Series0_relationship:ACTED_IN]->(this_actedIn_Series0:Series)
WITH DISTINCT this, CASE this_actedIn_Series0.title = "movieTitle"
    WHEN true THEN [this_actedIn_Series0_relationship, this_actedIn_Series0]
    ELSE [null, null]
END AS someVar
WITH DISTINCT *, someVar[0] AS this_actedIn_Series0_relationship, someVar[1] AS this_actedIn_Series0
WITH this, collect(DISTINCT this_actedIn_Series0) AS this_actedIn_Series0_to_delete
CALL {
    WITH this_actedIn_Series0_to_delete
    UNWIND this_actedIn_Series0_to_delete AS x
    DETACH DELETE x
    RETURN count(*) AS _
}
WITH DISTINCT this // Duplicate this is now removed
DETACH DELETE this
```

The extra occurrences of `this_likes0_relationship` and `this_likedPosts0` are always going to be null so no data will accidentally be manipulated/returned involving these relations/nodes.
