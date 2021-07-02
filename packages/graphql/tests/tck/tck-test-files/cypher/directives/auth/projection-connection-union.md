## Cypher Auth Projection On Connections On Unions

Tests auth is added to projection connections

Schema:

```schema
type Post {
    content: String
    creator: User @relationship(type: "HAS_POST", direction: IN)
}

type User {
    id: ID
    name: String
    content: [Content] @relationship(type: "PUBLISHED", direction: OUT)
}

union Content = Post

extend type User @auth(rules: [{ allow: { id: "$jwt.sub" } }])
extend type Post @auth(rules: [{ allow: { creator: { id: "$jwt.sub" } } }])
```

---

### Two connection

**GraphQL input**

```graphql
{
    users {
        contentConnection {
            edges {
                node {
                    ... on Post {
                        content
                        creatorConnection {
                            edges {
                                node {
                                    name
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}
```

**Expected Cypher output**

```cypher
MATCH (this:User)
CALL apoc.util.validate(NOT(EXISTS(this.id) AND this.id = $this_auth_allow0_id), "@neo4j/graphql/FORBIDDEN", [0])
CALL {
    WITH this
    CALL {
        WITH this
        OPTIONAL MATCH (this)-[this_published:PUBLISHED]->(this_Post:Post)
        CALL apoc.util.validate(NOT(EXISTS((this_Post)<-[:HAS_POST]-(:User)) AND ANY(creator IN [(this_Post)<-[:HAS_POST]-(creator:User) | creator] WHERE EXISTS(creator.id) AND creator.id = $this_Post_auth_allow0_creator_id)), "@neo4j/graphql/FORBIDDEN", [0])
        CALL {
            WITH this_Post
            MATCH (this_Post)<-[this_Post_has_post:HAS_POST]-(this_Post_user:User)
            CALL apoc.util.validate(NOT(EXISTS(this_Post_user.id) AND this_Post_user.id = $this_Post_user_auth_allow0_id), "@neo4j/graphql/FORBIDDEN", [0])
            WITH collect({ node: { name: this_Post_user.name } }) AS edges
            RETURN { edges: edges, totalCount: size(edges) } AS creatorConnection
        }
        WITH { node: { __resolveType: "Post", content: this_Post.content, creatorConnection: creatorConnection } } AS edge
        RETURN edge
    }
    WITH collect(edge) as edges, count(edge) as totalCount
    RETURN { edges: edges, totalCount: totalCount } AS contentConnection
}
RETURN this { contentConnection } as this
```

**Expected Cypher params**

```cypher-params
{
    "this_Post_auth_allow0_creator_id": "super_admin",
    "this_Post_user_auth_allow0_id": "super_admin",
    "this_auth_allow0_id": "super_admin"
}
```

**JWT Object**

```jwt
{
    "sub": "super_admin"
}
```

---
