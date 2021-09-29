# @auth allow on specific interface implementation

Tests auth allow operations

Schema:

```graphql
interface Content {
    id: ID
    content: String
    creator: User @relationship(type: "HAS_CONTENT", direction: IN)
}

type Comment implements Content {
    id: ID
    content: String
    creator: User
    post: Post @relationship(type: "HAS_COMMENT", direction: IN)
}

type Post implements Content
    @auth(
        rules: [{ operations: [READ, UPDATE, DELETE, DISCONNECT, CONNECT], allow: { creator: { id: "$jwt.sub" } } }]
    ) {
    id: ID
    content: String
    creator: User
    comments: [Comment] @relationship(type: "HAS_COMMENT", direction: OUT)
}

type User {
    id: ID
    name: String
    content: [Content!]! @relationship(type: "HAS_CONTENT", direction: OUT)
}

extend type User @auth(rules: [{ operations: [READ, UPDATE, DELETE, DISCONNECT, CONNECT], allow: { id: "$jwt.sub" } }])

extend type User {
    password: String! @auth(rules: [{ operations: [READ, UPDATE, DELETE], allow: { id: "$jwt.sub" } }])
}
```

---

## read allow protected interface relationship

### GraphQL Input

```graphql
{
    users {
        id
        content {
            id
            content
        }
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:User)
CALL apoc.util.validate(NOT(this.id IS NOT NULL AND this.id = $this_auth_allow0_id), "@neo4j/graphql/FORBIDDEN", [0])
WITH this
CALL {
    WITH this
    MATCH (this)-[:HAS_CONTENT]->(this_Comment:Comment)
    RETURN { __resolveType: "Comment", id: this_Comment.id, content: this_Comment.content } AS content
UNION
    WITH this
    MATCH (this)-[:HAS_CONTENT]->(this_Post:Post)
    CALL apoc.util.validate(NOT(EXISTS((this_Post)<-[:HAS_CONTENT]-(:User)) AND ANY(creator IN [(this_Post)<-[:HAS_CONTENT]-(creator:User) | creator] WHERE creator.id IS NOT NULL AND creator.id = $this_Post_auth_allow0_creator_id)), "@neo4j/graphql/FORBIDDEN", [0])
    RETURN { __resolveType: "Post", id: this_Post.id, content: this_Post.content } AS content
}
RETURN this { .id, content: collect(content) } as this
```

### Expected Cypher Params

```json
{
    "this_auth_allow0_id": "id-01",
    "this_Post_auth_allow0_creator_id": "id-01"
}
```

### JWT Object

```json
{
    "sub": "id-01",
    "roles": ["admin"]
}
```

---

## Read Two Relationships

### GraphQL Input

```graphql
{
    users(where: { id: "1" }) {
        id
        content(where: { id: "1" }) {
            ... on Post {
                comments(where: { id: "1" }) {
                    content
                }
            }
        }
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:User)
WHERE this.id = $this_id
CALL apoc.util.validate(NOT(this.id IS NOT NULL AND this.id = $this_auth_allow0_id), "@neo4j/graphql/FORBIDDEN", [0])
WITH this
CALL {
    WITH this
    MATCH (this)-[:HAS_CONTENT]->(this_Comment:Comment)
    WHERE this_Comment.id = $this_content.args.where.id
    RETURN { __resolveType: "Comment" } AS content
UNION
    WITH this
    MATCH (this)-[:HAS_CONTENT]->(this_Post:Post)
    CALL apoc.util.validate(NOT(EXISTS((this_Post)<-[:HAS_CONTENT]-(:User)) AND ANY(creator IN [(this_Post)<-[:HAS_CONTENT]-(creator:User) | creator] WHERE creator.id IS NOT NULL AND creator.id = $this_Post_auth_allow0_creator_id)), "@neo4j/graphql/FORBIDDEN", [0])
    WHERE this_Post.id = $this_content.args.where.id
    RETURN {
        __resolveType: "Post",
        comments: [ (this_Post)-[:HAS_COMMENT]->(this_Post_comments:Comment) WHERE this_Post_comments.id = $this_Post_comments_id | this_Post_comments { .content } ]
    } AS content
}
RETURN this { .id, content: collect(content) } as this
```

### Expected Cypher Params

```json
{
    "this_id": "1",
    "this_content": {
        "args": {
            "where": {
                "id": "1"
            }
        }
    },
    "this_Post_auth_allow0_creator_id": "id-01",
    "this_auth_allow0_id": "id-01"
}
```

### JWT Object

```json
{
    "sub": "id-01",
    "roles": ["admin"]
}
```

---

## Nested Update Node

### GraphQL Input

```graphql
mutation {
    updateUsers(where: { id: "user-id" }, update: { content: { update: { node: { id: "new-id" } } } }) {
        users {
            id
            content {
                id
            }
        }
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:User)
WHERE this.id = $this_id
WITH this
CALL apoc.util.validate(NOT(this.id IS NOT NULL AND this.id = $this_auth_allow0_id), "@neo4j/graphql/FORBIDDEN", [0])
WITH this
CALL {
    WITH this
    OPTIONAL MATCH (this)-[this_has_content0_relationship:HAS_CONTENT]->(this_content0:Comment)
    CALL apoc.do.when(this_content0 IS NOT NULL, "
        SET this_content0.id = $this_update_content0_id RETURN count(*)
    ", "", {this:this, updateUsers: $updateUsers, this_content0:this_content0, auth:$auth,this_update_content0_id:$this_update_content0_id}) YIELD value as _
    RETURN count(*)
UNION
    WITH this
    OPTIONAL MATCH (this)-[this_has_content0_relationship:HAS_CONTENT]->(this_content0:Post)
    CALL apoc.do.when(this_content0 IS NOT NULL, "
        WITH this, this_content0
        CALL apoc.util.validate(NOT(EXISTS((this_content0)<-[:HAS_CONTENT]-(:User)) AND ANY(creator IN [(this_content0)<-[:HAS_CONTENT]-(creator:User) | creator] WHERE creator.id IS NOT NULL AND creator.id = $this_content0_auth_allow0_creator_id)), \"@neo4j/graphql/FORBIDDEN\", [0])
        SET this_content0.id = $this_update_content0_id RETURN count(*)
    ", "", {this:this, updateUsers: $updateUsers, this_content0:this_content0, auth:$auth,this_update_content0_id:$this_update_content0_id,this_content0_auth_allow0_creator_id:$this_content0_auth_allow0_creator_id}) YIELD value as _
    RETURN count(*)
}

WITH this
CALL {
    WITH this
    MATCH (this)-[:HAS_CONTENT]->(this_Comment:Comment)
    RETURN { __resolveType: "Comment", id: this_Comment.id } AS content
UNION
    WITH this
    MATCH (this)-[:HAS_CONTENT]->(this_Post:Post)
    CALL apoc.util.validate(NOT(EXISTS((this_Post)<-[:HAS_CONTENT]-(:User)) AND ANY(creator IN [(this_Post)<-[:HAS_CONTENT]-(creator:User) | creator] WHERE creator.id IS NOT NULL AND creator.id = $this_Post_auth_allow0_creator_id)), "@neo4j/graphql/FORBIDDEN", [0])
    RETURN { __resolveType: "Post", id: this_Post.id } AS content
}
RETURN this { .id, content: collect(content) } AS this
```

### Expected Cypher Params

```json
{
    "this_Post_auth_allow0_creator_id": "user-id",
    "this_auth_allow0_id": "user-id",
    "this_content0_auth_allow0_creator_id": "user-id",
    "this_id": "user-id",
    "this_update_content0_id": "new-id",
    "auth": {
        "isAuthenticated": true,
        "jwt": {
            "roles": ["admin"],
            "sub": "user-id"
        },
        "roles": ["admin"]
    },
    "updateUsers": {
        "args": {
            "update": {
                "content": [
                    {
                        "update": {
                            "node": {
                                "id": "new-id"
                            }
                        }
                    }
                ]
            }
        }
    }
}
```

### JWT Object

```json
{
    "sub": "user-id",
    "roles": ["admin"]
}
```

---

## Nested Update Property

### GraphQL Input

```graphql
mutation {
    updatePosts(where: { id: "post-id" }, update: { creator: { update: { node: { password: "new-password" } } } }) {
        posts {
            id
        }
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Post)
WHERE this.id = $this_id

WITH this
CALL apoc.util.validate(NOT(EXISTS((this)<-[:HAS_CONTENT]-(:User)) AND ANY(creator IN [(this)<-[:HAS_CONTENT]-(creator:User) | creator] WHERE creator.id IS NOT NULL AND creator.id = $this_auth_allow0_creator_id)), "@neo4j/graphql/FORBIDDEN", [0])
WITH this OPTIONAL MATCH (this)<-[this_has_content0_relationship:HAS_CONTENT]-(this_creator0:User)

CALL apoc.do.when(this_creator0 IS NOT NULL, "
    WITH this, this_creator0
    CALL apoc.util.validate(NOT(this_creator0.id IS NOT NULL AND this_creator0.id = $this_creator0_auth_allow0_id AND this_creator0.id IS NOT NULL AND this_creator0.id = $this_update_creator0_password_auth_allow0_id), \"@neo4j/graphql/FORBIDDEN\", [0])
    SET this_creator0.password = $this_update_creator0_password
    RETURN count(*)
    ",
    "",
    {this:this, updatePosts: $updatePosts, this_creator0:this_creator0, auth:$auth,this_update_creator0_password:$this_update_creator0_password,this_update_creator0_password_auth_allow0_id:$this_update_creator0_password_auth_allow0_id,this_creator0_auth_allow0_id:$this_creator0_auth_allow0_id}) YIELD value as _
    RETURN this { .id } AS this
```

### Expected Cypher Params

```json
{
    "this_id": "post-id",
    "this_auth_allow0_creator_id": "user-id",
    "this_creator0_auth_allow0_id": "user-id",
    "this_update_creator0_password": "new-password",
    "this_update_creator0_password_auth_allow0_id": "user-id",
    "auth": {
        "isAuthenticated": true,
        "jwt": {
            "roles": ["admin"],
            "sub": "user-id"
        },
        "roles": ["admin"]
    },
    "updatePosts": {
        "args": {
            "update": {
                "creator": {
                    "update": {
                        "node": {
                            "password": "new-password"
                        }
                    }
                }
            }
        }
    }
}
```

### JWT Object

```json
{
    "sub": "user-id",
    "roles": ["admin"]
}
```

---

## Nested Delete Node

### GraphQL Input

```graphql
mutation {
    deleteUsers(where: { id: "user-id" }, delete: { content: { where: { node: { id: "post-id" } } } }) {
        nodesDeleted
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:User)
WHERE this.id = $this_id
WITH this

OPTIONAL MATCH (this)-[this_comment0_relationship:HAS_CONTENT]->(this_comment0:Comment)
WHERE this_comment0.id = $this_deleteUsers.args.delete.content[0].where.node.id
FOREACH(_ IN CASE this_comment0 WHEN NULL THEN [] ELSE [1] END |
    DETACH DELETE this_comment0
)
WITH this

OPTIONAL MATCH (this)-[this_post0_relationship:HAS_CONTENT]->(this_post0:Post)
WHERE this_post0.id = $this_deleteUsers.args.delete.content[0].where.node.id
WITH this, this_post0
CALL apoc.util.validate(NOT(EXISTS((this_post0)<-[:HAS_CONTENT]-(:User)) AND ANY(creator IN [(this_post0)<-[:HAS_CONTENT]-(creator:User) | creator] WHERE creator.id IS NOT NULL AND creator.id = $this_post0_auth_allow0_creator_id)), "@neo4j/graphql/FORBIDDEN", [0])
FOREACH(_ IN CASE this_post0 WHEN NULL THEN [] ELSE [1] END |
    DETACH DELETE this_post0
)

WITH this
CALL apoc.util.validate(NOT(this.id IS NOT NULL AND this.id = $this_auth_allow0_id), "@neo4j/graphql/FORBIDDEN", [0])
DETACH DELETE this
```

### Expected Cypher Params

```json
{
    "this_id": "user-id",
    "this_auth_allow0_id": "user-id",
    "this_posts0_auth_allow0_creator_id": "user-id",
    "this_deleteUsers": {
        "args": {
            "delete": {
                "posts": [
                    {
                        "where": {
                            "node": {
                                "id": "post-id"
                            }
                        }
                    }
                ]
            }
        }
    }
}
```

### JWT Object

```json
{
    "sub": "user-id",
    "roles": ["admin"]
}
```

---

## Disconnect Node

### GraphQL Input

```graphql
mutation {
    updateUsers(where: { id: "user-id" }, disconnect: { content: { where: { node: { id: "post-id" } } } }) {
        users {
            id
        }
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:User)
WHERE this.id = $this_id
WITH this
CALL {
    WITH this
    OPTIONAL MATCH (this)-[this_disconnect_content0_rel:HAS_CONTENT]->(this_disconnect_content0:Comment)
    WHERE this_disconnect_content0.id = $updateUsers.args.disconnect.content[0].where.node.id WITH this, this_disconnect_content0, this_disconnect_content0_rel
    FOREACH(_ IN CASE this_disconnect_content0 WHEN NULL THEN [] ELSE [1] END |
        DELETE this_disconnect_content0_rel
    )
    RETURN count(*)
UNION
    WITH this
    OPTIONAL MATCH (this)-[this_disconnect_content0_rel:HAS_CONTENT]->(this_disconnect_content0:Post)
    WHERE this_disconnect_content0.id = $updateUsers.args.disconnect.content[0].where.node.id WITH this, this_disconnect_content0, this_disconnect_content0_rel
    CALL apoc.util.validate(NOT(this_disconnect_content0.id IS NOT NULL AND this_disconnect_content0.id = $this_disconnect_content0User0_allow_auth_allow0_id AND EXISTS((this_disconnect_content0)<-[:HAS_CONTENT]-(:User)) AND ANY(creator IN [(this_disconnect_content0)<-[:HAS_CONTENT]-(creator:User) | creator] WHERE creator.id IS NOT NULL AND creator.id = $this_disconnect_content0Post1_allow_auth_allow0_creator_id)), "@neo4j/graphql/FORBIDDEN", [0])
    FOREACH(_ IN CASE this_disconnect_content0 WHEN NULL THEN [] ELSE [1] END |
        DELETE this_disconnect_content0_rel
    )
    RETURN count(*)
}
RETURN this { .id } AS this
```

### Expected Cypher Params

```json
{
    "this_id": "user-id",
    "this_disconnect_posts0User0_allow_auth_allow0_id": "user-id",
    "this_disconnect_posts0Post1_allow_auth_allow0_creator_id": "user-id",
    "updateUsers": {
        "args": {
            "disconnect": {
                "posts": [
                    {
                        "where": {
                            "node": {
                                "id": "post-id"
                            }
                        }
                    }
                ]
            }
        }
    }
}
```

### JWT Object

```json
{
    "sub": "user-id",
    "roles": ["admin"]
}
```

---

## Nested Disconnect Node

### GraphQL Input

```graphql
mutation {
    updateUsers(
        where: { id: "user-id" }
        disconnect: {
            content: {
                where: { node: { id: "post-id" } }
                disconnect: { _on: { Post: { comments: { where: { id: "comment-id" } } } } }
            }
        }
    ) {
        users {
            id
        }
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Comment)
WHERE this.id = $this_id

WITH this
CALL apoc.util.validate(NOT(EXISTS((this)<-[:HAS_COMMENT]-(:User)) AND ANY(creator IN [(this)<-[:HAS_COMMENT]-(creator:User) | creator] WHERE creator.id IS NOT NULL AND creator.id = $this_auth_allow0_creator_id)), "@neo4j/graphql/FORBIDDEN", [0])

WITH this
CALL {
    WITH this
    OPTIONAL MATCH (this)<-[this_post0_disconnect0_rel:HAS_COMMENT]-(this_post0_disconnect0:Post)
    WITH this, this_post0_disconnect0, this_post0_disconnect0_rel

    CALL apoc.util.validate(NOT(EXISTS((this_post0_disconnect0)<-[:HAS_COMMENT]-(:User)) AND ANY(creator IN [(this_post0_disconnect0)<-[:HAS_COMMENT]-(creator:User) | creator] WHERE creator.id IS NOT NULL AND creator.id = $this_post0_disconnect0Comment0_allow_auth_allow0_creator_id) AND EXISTS((this_post0_disconnect0)<-[:HAS_POST]-(:User)) AND ANY(creator IN [(this_post0_disconnect0)<-[:HAS_POST]-(creator:User) | creator] WHERE creator.id IS NOT NULL AND creator.id = $this_post0_disconnect0Post1_allow_auth_allow0_creator_id)), "@neo4j/graphql/FORBIDDEN", [0])

    FOREACH(_ IN CASE this_post0_disconnect0 WHEN NULL THEN [] ELSE [1] END |
        DELETE this_post0_disconnect0_rel
    )

    WITH this, this_post0_disconnect0
    CALL {
        WITH this, this_post0_disconnect0
        OPTIONAL MATCH (this_post0_disconnect0)<-[this_post0_disconnect0_creator0_rel:HAS_POST]-(this_post0_disconnect0_creator0:User)
        WHERE this_post0_disconnect0_creator0.id = $updateComments.args.update.post.disconnect.disconnect.creator.where.node.id
        WITH this, this_post0_disconnect0, this_post0_disconnect0_creator0, this_post0_disconnect0_creator0_rel

        CALL apoc.util.validate(NOT(EXISTS((this_post0_disconnect0_creator0)<-[:HAS_POST]-(:User)) AND ANY(creator IN [(this_post0_disconnect0_creator0)<-[:HAS_POST]-(creator:User) | creator] WHERE creator.id IS NOT NULL AND creator.id = $this_post0_disconnect0_creator0Post0_allow_auth_allow0_creator_id) AND this_post0_disconnect0_creator0.id IS NOT NULL AND this_post0_disconnect0_creator0.id = $this_post0_disconnect0_creator0User1_allow_auth_allow0_id), "@neo4j/graphql/FORBIDDEN", [0])

        FOREACH(_ IN CASE this_post0_disconnect0_creator0 WHEN NULL THEN [] ELSE [1] END |
            DELETE this_post0_disconnect0_creator0_rel
        )

        RETURN count(*)
    }

    RETURN count(*)
}

RETURN this { .id } AS this
```

### Expected Cypher Params

```json
{
    "this_id": "comment-id",
    "this_auth_allow0_creator_id": "user-id",
    "this_post0_disconnect0Comment0_allow_auth_allow0_creator_id": "user-id",
    "this_post0_disconnect0Post1_allow_auth_allow0_creator_id": "user-id",
    "this_post0_disconnect0_creator0Post0_allow_auth_allow0_creator_id": "user-id",
    "this_post0_disconnect0_creator0User1_allow_auth_allow0_id": "user-id",
    "updateComments": {
        "args": {
            "update": {
                "post": {
                    "disconnect": {
                        "disconnect": {
                            "creator": {
                                "where": {
                                    "node": {
                                        "id": "user-id"
                                    }
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

### JWT Object

```json
{
    "sub": "user-id",
    "roles": ["admin"]
}
```

---

## Connect Node

### GraphQL Input

```graphql
mutation {
    updateUsers(where: { id: "user-id" }, connect: { content: { where: { node: { id: "post-id" } } } }) {
        users {
            id
        }
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:User)
WHERE this.id = $this_id
WITH this
CALL {
    WITH this
    OPTIONAL MATCH (this_connect_content0_node:Comment)
    WHERE this_connect_content0_node.id = $this_connect_content0_node_id
    FOREACH(_ IN CASE this WHEN NULL THEN [] ELSE [1] END |
        FOREACH(_ IN CASE this_connect_content0_node WHEN NULL THEN [] ELSE [1] END |
            MERGE (this)-[:HAS_CONTENT]->(this_connect_content0_node)
        )
    )
    RETURN count(*)
UNION
    WITH this
    OPTIONAL MATCH (this_connect_content0_node:Post)
    WHERE this_connect_content0_node.id = $this_connect_content0_node_id
    WITH this, this_connect_content0_node
    CALL apoc.util.validate(NOT(this_connect_content0_node.id IS NOT NULL AND this_connect_content0_node.id = $this_connect_content0_nodeUser0_allow_auth_allow0_id AND EXISTS((this_connect_content0_node)<-[:HAS_CONTENT]-(:User)) AND ANY(creator IN [(this_connect_content0_node)<-[:HAS_CONTENT]-(creator:User) | creator] WHERE creator.id IS NOT NULL AND creator.id = $this_connect_content0_nodePost1_allow_auth_allow0_creator_id)), "@neo4j/graphql/FORBIDDEN", [0])
    FOREACH(_ IN CASE this WHEN NULL THEN [] ELSE [1] END |
        FOREACH(_ IN CASE this_connect_content0_node WHEN NULL THEN [] ELSE [1] END |
            MERGE (this)-[:HAS_CONTENT]->(this_connect_content0_node)
        )
    )
    RETURN count(*)
}
RETURN this { .id } AS this
```

### Expected Cypher Params

```json
{
    "this_id": "user-id",
    "this_connect_posts0_node_id": "post-id",
    "this_connect_posts0_nodePost1_allow_auth_allow0_creator_id": "user-id",
    "this_connect_posts0_nodeUser0_allow_auth_allow0_id": "user-id"
}
```

### JWT Object

```json
{
    "sub": "user-id",
    "roles": ["admin"]
}
```

---
