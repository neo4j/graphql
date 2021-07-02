## Cypher Auth Projection On Connections

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
    posts: [Post] @relationship(type: "HAS_POST", direction: OUT)
}

extend type User @auth(rules: [{ allow: { id: "$jwt.sub" } }])
extend type Post @auth(rules: [{ allow: { creator: { id: "$jwt.sub" } } }])
```

---

### One connection

**GraphQL input**

```graphql
{
    users {
        name
        postsConnection {
            edges {
                node {
                    content
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
    MATCH (this)-[this_has_post:HAS_POST]->(this_post:Post)
    CALL apoc.util.validate(NOT(EXISTS((this_post)<-[:HAS_POST]-(:User)) AND ANY(creator IN [(this_post)<-[:HAS_POST]-(creator:User) | creator] WHERE EXISTS(creator.id) AND creator.id = $this_post_auth_allow0_creator_id)), "@neo4j/graphql/FORBIDDEN", [0])
    WITH collect({ node: { content: this_post.content } }) AS edges
    RETURN { edges: edges, totalCount: size(edges) } AS postsConnection
}
RETURN this { .name, postsConnection } as this
```

**Expected Cypher params**

```cypher-params
{
    "this_post_auth_allow0_creator_id": "super_admin",
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

### Two connection

**GraphQL input**

```graphql
{
    users {
        name
        postsConnection {
            edges {
                node {
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
```

**Expected Cypher output**

```cypher
MATCH (this:User)
CALL apoc.util.validate(NOT(EXISTS(this.id) AND this.id = $this_auth_allow0_id), "@neo4j/graphql/FORBIDDEN", [0])
CALL {
    WITH this
    MATCH (this)-[this_has_post:HAS_POST]->(this_post:Post)
    CALL apoc.util.validate(NOT(EXISTS((this_post)<-[:HAS_POST]-(:User)) AND ANY(creator IN [(this_post)<-[:HAS_POST]-(creator:User) | creator] WHERE EXISTS(creator.id) AND creator.id = $this_post_auth_allow0_creator_id)), "@neo4j/graphql/FORBIDDEN", [0])
    CALL {
        WITH this_post
        MATCH (this_post)<-[this_post_has_post:HAS_POST]-(this_post_user:User)
        CALL apoc.util.validate(NOT(EXISTS(this_post_user.id) AND this_post_user.id = $this_post_user_auth_allow0_id), "@neo4j/graphql/FORBIDDEN", [0])
        WITH collect({ node: { name: this_post_user.name } }) AS edges
        RETURN { edges: edges, totalCount: size(edges) } AS creatorConnection
    }
    WITH collect({ node: { content: this_post.content, creatorConnection: creatorConnection } }) AS edges
    RETURN { edges: edges, totalCount: size(edges) } AS postsConnection
}
RETURN this { .name, postsConnection } as this
```

**Expected Cypher params**

```cypher-params
{
    "this_post_auth_allow0_creator_id": "super_admin",
    "this_post_user_auth_allow0_id": "super_admin",
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
