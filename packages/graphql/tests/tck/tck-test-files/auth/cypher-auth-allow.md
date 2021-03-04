## Cypher Auth Allow

Tests auth allow operations

Schema:

```schema
type Comment {
    id: ID
    content: String
    creator: User @relationship(type: "HAS_COMMENT", direction: "IN")
    post: Post @relationship(type: "HAS_COMMENT", direction: "IN")
}

type Post {
    id: ID
    content: String
    creator: User @relationship(type: "HAS_POST", direction: "IN")
    comments: [Comment] @relationship(type: "HAS_COMMENT", direction: "OUT")
}

type User {
    id: ID
    name: String
    posts: [Post] @relationship(type: "HAS_POST", direction: "OUT")
}

extend type User
    @auth(
        rules: [
            {
                operations: ["read", "update", "delete", "disconnect", "connect"]
                allow: { id: "$jwt.sub" }
            }
        ]
    )

extend type User {
    password: String!
        @auth(
            rules: [
                {
                    operations: ["read", "update", "delete"]
                    allow: { id: "$jwt.sub" }
                }
            ]
        )
}

extend type Post
    @auth(
        rules: [
            {
                operations: ["read", "update", "delete", "disconnect", "connect"]
                allow: { creator: { id: "$jwt.sub" } }
            }
        ]
    )

extend type Comment
    @auth(
        rules: [
            {
                operations: ["read", "update", "delete", "disconnect", "connect"]
                allow: { creator: { id: "$jwt.sub" } }
            }
        ]
    )
```

---

### Read Node

**GraphQL input**

```graphql
{
    users {
        id
    }
}
```

**Expected Cypher output**

```cypher
MATCH (this:User)
CALL apoc.util.validate(NOT(EXISTS(this.id) AND this.id = $params.this_auth_allow0_id), "@neo4j/graphql/FORBIDDEN", [0])
RETURN this { .id } as this
```

**Expected Cypher params**

```cypher-params
{
    "params": {
        "this_auth_allow0_id": "id-01"
    }
}
```

**JWT Object**

```jwt
{
    "sub": "id-01",
    "roles": ["admin"]
}
```

---

### Read Node & Protected Field

**GraphQL input**

```graphql
{
    users {
        password
    }
}
```

**Expected Cypher output**

```cypher
MATCH (this:User)
CALL apoc.util.validate(NOT(EXISTS(this.id) AND this.id = $params.this_auth_allow0_id), "@neo4j/graphql/FORBIDDEN", [0])
WITH this
CALL apoc.util.validate(NOT(EXISTS(this.id) AND this.id = $params.this_password_auth_allow0_id), "@neo4j/graphql/FORBIDDEN", [0])
RETURN this { .password } as this
```

**Expected Cypher params**

```cypher-params
{
    "params": {
        "this_auth_allow0_id": "id-01",
        "this_password_auth_allow0_id": "id-01"
    }
}
```

**JWT Object**

```jwt
{
    "sub": "id-01",
    "roles": ["admin"]
}
```

---

### Read Relationship

**GraphQL input**

```graphql
{
    users {
        id
        posts {
            content
        }
    }
}
```

**Expected Cypher output**

```cypher
MATCH (this:User)
CALL apoc.util.validate(NOT(EXISTS(this.id) AND this.id = $params.this_auth_allow0_id), "@neo4j/graphql/FORBIDDEN", [0])
RETURN this {
    .id,
    posts: [ (this)-[:HAS_POST]->(this_posts:Post) WHERE apoc.util.validatePredicate(NOT(EXISTS((this_posts)<-[:HAS_POST]-(:User)) AND ANY(creator IN [(this_posts)<-[:HAS_POST]-(creator:User) | creator] WHERE EXISTS(creator.id) AND creator.id = $params.this_posts_auth_allow0_creator_id)), "@neo4j/graphql/FORBIDDEN", [0]) | this_posts { .content } ]
} as this
```

**Expected Cypher params**

```cypher-params
{
    "params": {
        "this_auth_allow0_id": "id-01",
        "this_posts_auth_allow0_creator_id": "id-01"
    }
}
```

**JWT Object**

```jwt
{
    "sub": "id-01",
    "roles": ["admin"]
}
```

---

### Read Relationship & Protected Field

**GraphQL input**

```graphql
{
    posts {
        creator {
            password
        }
    }
}
```

**Expected Cypher output**

```cypher
MATCH (this:Post)
CALL apoc.util.validate(NOT(EXISTS((this)<-[:HAS_POST]-(:User)) AND ANY(creator IN [(this)<-[:HAS_POST]-(creator:User) | creator] WHERE EXISTS(creator.id) AND creator.id = $params.this_auth_allow0_creator_id)), "@neo4j/graphql/FORBIDDEN", [0])
RETURN this {
    creator: head([ (this)<-[:HAS_POST]-(this_creator:User) WHERE apoc.util.validatePredicate(NOT(EXISTS(this_creator.id) AND this_creator.id = $params.this_creator_auth_allow0_id AND EXISTS(this_creator.id) AND this_creator.id = $params.this_creator_password_auth_allow0_id), "@neo4j/graphql/FORBIDDEN", [0]) | this_creator {
        .password
    } ])
} as this
```

**Expected Cypher params**

```cypher-params
{
    "params": {
        "this_auth_allow0_creator_id": "id-01",
        "this_creator_auth_allow0_id": "id-01",
        "this_creator_password_auth_allow0_id": "id-01"
    }
}
```

**JWT Object**

```jwt
{
    "sub": "id-01",
    "roles": ["admin"]
}
```

---

### Read Two Relationships

**GraphQL input**

```graphql
{
    users(where: { id: "1" }) {
        id
        posts(where: { id: "1" }) {
            comments(where: { id: "1" }) {
                content
            }
        }
    }
}
```

**Expected Cypher output**

```cypher
MATCH (this:User)
WHERE this.id = $params.this_id
CALL apoc.util.validate(NOT(EXISTS(this.id) AND this.id = $params.this_auth_allow0_id), "@neo4j/graphql/FORBIDDEN", [0])
RETURN this {
    .id,
    posts: [ (this)-[:HAS_POST]->(this_posts:Post) WHERE this_posts.id = $params.this_posts_id AND apoc.util.validatePredicate(NOT(EXISTS((this_posts)<-[:HAS_POST]-(:User)) AND ANY(creator IN [(this_posts)<-[:HAS_POST]-(creator:User) | creator] WHERE EXISTS(creator.id) AND creator.id = $params.this_posts_auth_allow0_creator_id)), "@neo4j/graphql/FORBIDDEN", [0]) | this_posts { comments: [ (this_posts)-[:HAS_COMMENT]->(this_posts_comments:Comment) WHERE this_posts_comments.id = $params.this_posts_comments_id AND apoc.util.validatePredicate(NOT(EXISTS((this_posts_comments)<-[:HAS_COMMENT]-(:User)) AND ANY(creator IN [(this_posts_comments)<-[:HAS_COMMENT]-(creator:User) | creator] WHERE EXISTS(creator.id) AND creator.id = $params.this_posts_comments_auth_allow0_creator_id)), "@neo4j/graphql/FORBIDDEN", [0]) | this_posts_comments {
        .content
    } ] } ]
} as this
```

**Expected Cypher params**

```cypher-params
{
    "params": {
        "this_id": "1",
        "this_posts_comments_auth_allow0_creator_id": "id-01",
        "this_posts_comments_id": "1",
        "this_posts_id": "1",
        "this_posts_auth_allow0_creator_id": "id-01",
        "this_auth_allow0_id": "id-01"
    }
}
```

**JWT Object**

```jwt
{
    "sub": "id-01",
    "roles": ["admin"]
}
```

---

### Update Node

**GraphQL input**

```graphql
mutation {
    updateUsers(where: { id: "old-id" }, update: { id: "new-id" }) {
        users {
            id
        }
    }
}
```

**Expected Cypher output**

```cypher
MATCH (this:User)
WHERE this.id = $params.this_id

WITH this
CALL apoc.util.validate(NOT(EXISTS(this.id) AND this.id = $params.this_auth_allow0_id), "@neo4j/graphql/FORBIDDEN", [0])

SET this.id = $params.this_update_id

RETURN this { .id } AS this
```

**Expected Cypher params**

```cypher-params
{
   "params": {
        "this_id": "old-id",
        "this_auth_allow0_id": "old-id",
        "this_update_id": "new-id"
   }
}
```

**JWT Object**

```jwt
{
    "sub": "old-id",
    "roles": ["admin"]
}
```

---

### Update Node Property

**GraphQL input**

```graphql
mutation {
    updateUsers(where: { id: "id-01" }, update: { password: "new-password" }) {
        users {
            id
        }
    }
}
```

**Expected Cypher output**

```cypher
MATCH (this:User)
WHERE this.id = $params.this_id

WITH this
CALL apoc.util.validate(NOT(EXISTS(this.id) AND this.id = $params.this_auth_allow0_id AND EXISTS(this.id) AND this.id = $params.this_update_password_auth_allow0_id), "@neo4j/graphql/FORBIDDEN", [0])

SET this.password = $params.this_update_password

RETURN this { .id } AS this
```

**Expected Cypher params**

```cypher-params
{
    "params": {
        "this_id": "id-01",
        "this_auth_allow0_id": "id-01",
        "this_update_password_auth_allow0_id": "id-01",
        "this_update_password": "new-password"
    }
}
```

**JWT Object**

```jwt
{
    "sub": "id-01",
    "roles": ["admin"]
}
```

---

### Nested Update Node

**GraphQL input**

```graphql
mutation {
    updatePosts(
        where: { id: "post-id" }
        update: { creator: { update: { id: "new-id" } } }
    ) {
        posts {
            id
        }
    }
}
```

**Expected Cypher output**

```cypher
MATCH (this:Post)
WHERE this.id = $params.this_id

WITH this
CALL apoc.util.validate(NOT(EXISTS((this)<-[:HAS_POST]-(:User)) AND ANY(creator IN [(this)<-[:HAS_POST]-(creator:User) | creator] WHERE EXISTS(creator.id) AND creator.id = $params.this_auth_allow0_creator_id)), "@neo4j/graphql/FORBIDDEN", [0])
WITH this
OPTIONAL MATCH (this)<-[:HAS_POST]-(this_creator0:User)
CALL apoc.do.when(this_creator0 IS NOT NULL, "
    WITH this, this_creator0
    CALL apoc.util.validate(NOT(EXISTS(this_creator0.id) AND this_creator0.id = $params.this_creator0_auth_allow0_id), \"@neo4j/graphql/FORBIDDEN\", [0])
    SET this_creator0.id = $params.this_update_creator0_id
    RETURN count(*) ",
    "",
    {this:this, this_creator0:this_creator0, params:$params})
YIELD value as _

RETURN this { .id } AS this
```

**Expected Cypher params**

```cypher-params
{
    "params": {
        "this_id": "post-id",
        "this_auth_allow0_creator_id": "user-id",
        "this_creator0_auth_allow0_id": "user-id",
        "this_update_creator0_id": "new-id"
    }
}
```

**JWT Object**

```jwt
{
    "sub": "user-id",
    "roles": ["admin"]
}
```

---

### Nested Update Property

**GraphQL input**

```graphql
mutation {
    updatePosts(
        where: { id: "post-id" }
        update: { creator: { update: { password: "new-password" } } }
    ) {
        posts {
            id
        }
    }
}
```

**Expected Cypher output**

```cypher
MATCH (this:Post)
WHERE this.id = $params.this_id

WITH this
CALL apoc.util.validate(NOT(EXISTS((this)<-[:HAS_POST]-(:User)) AND ANY(creator IN [(this)<-[:HAS_POST]-(creator:User) | creator] WHERE EXISTS(creator.id) AND creator.id = $params.this_auth_allow0_creator_id)), "@neo4j/graphql/FORBIDDEN", [0]) WITH this OPTIONAL MATCH (this)<-[:HAS_POST]-(this_creator0:User)

CALL apoc.do.when(this_creator0 IS NOT NULL, "
    WITH this, this_creator0
    CALL apoc.util.validate(NOT(EXISTS(this_creator0.id) AND this_creator0.id = $params.this_creator0_auth_allow0_id AND EXISTS(this_creator0.id) AND this_creator0.id = $params.this_update_creator0_password_auth_allow0_id), \"@neo4j/graphql/FORBIDDEN\", [0])
    SET this_creator0.password = $params.this_update_creator0_password
    RETURN count(*)
    ",
    "",
    {this:this, this_creator0:this_creator0, params:$params}) YIELD value as _
    RETURN this { .id } AS this
```

**Expected Cypher params**

```cypher-params
{
    "params": {
        "this_id": "post-id",
        "this_auth_allow0_creator_id": "user-id",
        "this_creator0_auth_allow0_id": "user-id",
        "this_update_creator0_password": "new-password",
        "this_update_creator0_password_auth_allow0_id": "user-id"
    }
}
```

**JWT Object**

```jwt
{
    "sub": "user-id",
    "roles": ["admin"]
}
```

---

### Delete Node

**GraphQL input**

```graphql
mutation {
    deleteUsers(where: { id: "user-id" }) {
        nodesDeleted
    }
}
```

**Expected Cypher output**

```cypher
MATCH (this:User)
WHERE this.id = $params.this_id WITH this
CALL apoc.util.validate(NOT(EXISTS(this.id) AND this.id = $params.this_auth_allow0_id), "@neo4j/graphql/FORBIDDEN", [0])
DETACH DELETE this
```

**Expected Cypher params**

```cypher-params
{
    "params": {
        "this_id": "user-id",
        "this_auth_allow0_id": "user-id"
    }
}
```

**JWT Object**

```jwt
{
    "sub": "user-id",
    "roles": ["admin"]
}
```

---

### Nested Delete Node

**GraphQL input**

```graphql
mutation {
    deleteUsers(
        where: { id: "user-id" }
        delete: { posts: { where: { id: "post-id" } } }
    ) {
        nodesDeleted
    }
}
```

**Expected Cypher output**

```cypher
MATCH (this:User)
WHERE this.id = $params.this_id
WITH this
OPTIONAL MATCH (this)-[:HAS_POST]->(this_posts0:Post)
WHERE this_posts0.id = $params.this_posts0_id
WITH this, this_posts0
CALL apoc.util.validate(NOT(EXISTS((this_posts0)<-[:HAS_POST]-(:User)) AND ANY(creator IN [(this_posts0)<-[:HAS_POST]-(creator:User) | creator] WHERE EXISTS(creator.id) AND creator.id = $params.this_posts0_auth_allow0_creator_id)), "@neo4j/graphql/FORBIDDEN", [0])

FOREACH(_ IN CASE this_posts0 WHEN NULL THEN [] ELSE [1] END |
    DETACH DELETE this_posts0
)
WITH this
CALL apoc.util.validate(NOT(EXISTS(this.id) AND this.id = $params.this_auth_allow0_id), "@neo4j/graphql/FORBIDDEN", [0])
DETACH DELETE this
```

**Expected Cypher params**

```cypher-params
{
    "params": {
        "this_id": "user-id",
        "this_auth_allow0_id": "user-id",
        "this_posts0_auth_allow0_creator_id": "user-id",
        "this_posts0_id": "post-id"
    }
}
```

**JWT Object**

```jwt
{
    "sub": "user-id",
    "roles": ["admin"]
}
```

---

### Disconnect Node

**GraphQL input**

```graphql
mutation {
    updateUsers(
        where: { id: "user-id" }
        disconnect: { posts: { where: { id: "post-id" } } }
    ) {
        users {
            id
        }
    }
}
```

**Expected Cypher output**

```cypher
MATCH (this:User)
WHERE this.id = $params.this_id
WITH this
OPTIONAL MATCH (this)-[this_disconnect_posts0_rel:HAS_POST]->(this_disconnect_posts0:Post)
WHERE this_disconnect_posts0.id = $params.this_disconnect_posts0_id

WITH this, this_disconnect_posts0, this_disconnect_posts0_rel

CALL apoc.util.validate(NOT(EXISTS(this_disconnect_posts0.id) AND this_disconnect_posts0.id = $params.this_disconnect_posts0User0_allow_auth_allow0_id AND EXISTS((this_disconnect_posts0)<-[:HAS_POST]-(:User)) AND ANY(creator IN [(this_disconnect_posts0)<-[:HAS_POST]-(creator:User) | creator] WHERE EXISTS(creator.id) AND creator.id = $params.this_disconnect_posts0Post1_allow_auth_allow0_creator_id)), "@neo4j/graphql/FORBIDDEN", [0])

FOREACH(_ IN CASE this_disconnect_posts0 WHEN NULL THEN [] ELSE [1] END |
    DELETE this_disconnect_posts0_rel
)

RETURN this { .id } AS this
```

**Expected Cypher params**

```cypher-params
{
    "params": {
        "this_id": "user-id",
        "this_disconnect_posts0_id": "post-id",
        "this_disconnect_posts0User0_allow_auth_allow0_id": "user-id",
        "this_disconnect_posts0Post1_allow_auth_allow0_creator_id": "user-id"
    }
}
```

**JWT Object**

```jwt
{
    "sub": "user-id",
    "roles": ["admin"]
}
```

---

### Nested Disconnect Node

**GraphQL input**

```graphql
mutation {
    updateComments(
        where: { id: "comment-id" }
        update: {
            post: {
                disconnect: {
                    disconnect: { creator: { where: { id: "user-id" } } }
                }
            }
        }
    ) {
        comments {
            id
        }
    }
}
```

**Expected Cypher output**

```cypher
MATCH (this:Comment)
WHERE this.id = $params.this_id

WITH this
CALL apoc.util.validate(NOT(EXISTS((this)<-[:HAS_COMMENT]-(:User)) AND ANY(creator IN [(this)<-[:HAS_COMMENT]-(creator:User) | creator] WHERE EXISTS(creator.id) AND creator.id = $params.this_auth_allow0_creator_id)), "@neo4j/graphql/FORBIDDEN", [0])

WITH this
OPTIONAL MATCH (this)<-[this_post0_disconnect0_rel:HAS_COMMENT]-(this_post0_disconnect0:Post)
WITH this, this_post0_disconnect0, this_post0_disconnect0_rel

CALL apoc.util.validate(NOT(EXISTS((this_post0_disconnect0)<-[:HAS_COMMENT]-(:User)) AND ANY(creator IN [(this_post0_disconnect0)<-[:HAS_COMMENT]-(creator:User) | creator] WHERE EXISTS(creator.id) AND creator.id = $params.this_post0_disconnect0Comment0_allow_auth_allow0_creator_id) AND EXISTS((this_post0_disconnect0)<-[:HAS_POST]-(:User)) AND ANY(creator IN [(this_post0_disconnect0)<-[:HAS_POST]-(creator:User) | creator] WHERE EXISTS(creator.id) AND creator.id = $params.this_post0_disconnect0Post1_allow_auth_allow0_creator_id)), "@neo4j/graphql/FORBIDDEN", [0])

FOREACH(_ IN CASE this_post0_disconnect0 WHEN NULL THEN [] ELSE [1] END |
    DELETE this_post0_disconnect0_rel
)

WITH this, this_post0_disconnect0
OPTIONAL MATCH (this_post0_disconnect0)<-[this_post0_disconnect0_creator0_rel:HAS_POST]-(this_post0_disconnect0_creator0:User)
WHERE this_post0_disconnect0_creator0.id = $params.this_post0_disconnect0_creator0_id
WITH this, this_post0_disconnect0, this_post0_disconnect0_creator0, this_post0_disconnect0_creator0_rel

CALL apoc.util.validate(NOT(EXISTS((this_post0_disconnect0_creator0)<-[:HAS_POST]-(:User)) AND ANY(creator IN [(this_post0_disconnect0_creator0)<-[:HAS_POST]-(creator:User) | creator] WHERE EXISTS(creator.id) AND creator.id = $params.this_post0_disconnect0_creator0Post0_allow_auth_allow0_creator_id) AND EXISTS(this_post0_disconnect0_creator0.id) AND this_post0_disconnect0_creator0.id = $params.this_post0_disconnect0_creator0User1_allow_auth_allow0_id), "@neo4j/graphql/FORBIDDEN", [0])

FOREACH(_ IN CASE this_post0_disconnect0_creator0 WHEN NULL THEN [] ELSE [1] END |
    DELETE this_post0_disconnect0_creator0_rel
)

RETURN this { .id } AS this
```

**Expected Cypher params**

```cypher-params
{
    "params": {
        "this_id": "user-id",
        "this_auth_allow0_creator_id": "user-id",
        "this_id": "comment-id",
        "this_post0_disconnect0Comment0_allow_auth_allow0_creator_id": "user-id",
        "this_post0_disconnect0Post1_allow_auth_allow0_creator_id": "user-id",
        "this_post0_disconnect0_creator0Post0_allow_auth_allow0_creator_id": "user-id",
        "this_post0_disconnect0_creator0User1_allow_auth_allow0_id": "user-id",
        "this_post0_disconnect0_creator0_id": "user-id"
    }
}
```

**JWT Object**

```jwt
{
    "sub": "user-id",
    "roles": ["admin"]
}
```

---

### Connect Node

**GraphQL input**

```graphql
mutation {
    updateUsers(
        where: { id: "user-id" }
        connect: { posts: { where: { id: "post-id" } } }
    ) {
        users {
            id
        }
    }
}
```

**Expected Cypher output**

```cypher
MATCH (this:User)
WHERE this.id = $params.this_id
WITH this
OPTIONAL MATCH (this_connect_posts0:Post)
WHERE this_connect_posts0.id = $params.this_connect_posts0_id

WITH this, this_connect_posts0
CALL apoc.util.validate(NOT(EXISTS(this_connect_posts0.id) AND this_connect_posts0.id = $params.this_connect_posts0User0_allow_auth_allow0_id AND EXISTS((this_connect_posts0)<-[:HAS_POST]-(:User)) AND ANY(creator IN [(this_connect_posts0)<-[:HAS_POST]-(creator:User) | creator] WHERE EXISTS(creator.id) AND creator.id = $params.this_connect_posts0Post1_allow_auth_allow0_creator_id)), "@neo4j/graphql/FORBIDDEN", [0])

FOREACH(_ IN CASE this_connect_posts0 WHEN NULL THEN [] ELSE [1] END |
    MERGE (this)-[:HAS_POST]->(this_connect_posts0)
)

RETURN this { .id } AS this
```

**Expected Cypher params**

```cypher-params
{
    "params": {
        "this_id": "user-id",
        "this_connect_posts0_id": "post-id",
        "this_connect_posts0Post1_allow_auth_allow0_creator_id": "user-id",
        "this_connect_posts0User0_allow_auth_allow0_id": "user-id"
    }
}
```

**JWT Object**

```jwt
{
    "sub": "user-id",
    "roles": ["admin"]
}
```

---
