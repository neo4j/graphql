# Cypher Auth Where

Tests auth `where` operations

Schema:

```graphql
union Search = Post

type User {
    id: ID
    name: String
    posts: [Post] @relationship(type: "HAS_POST", direction: OUT)
    content: [Search] @relationship(type: "HAS_POST", direction: OUT) # something to test unions
}

type Post {
    id: ID
    content: String
    creator: User @relationship(type: "HAS_POST", direction: IN)
}

extend type User
    @auth(
        rules: [
            {
                operations: [READ, UPDATE, DELETE, CONNECT, DISCONNECT]
                where: { id: "$jwt.sub" }
            }
        ]
    )

extend type User {
    password: String!
        @auth(rules: [{ operations: [READ], where: { id: "$jwt.sub" } }])
}

extend type Post {
    secretKey: String!
        @auth(
            rules: [
                { operations: [READ], where: { creator: { id: "$jwt.sub" } } }
            ]
        )
}

extend type Post
    @auth(
        rules: [
            {
                operations: [READ, UPDATE, DELETE, CONNECT, DISCONNECT]
                where: { creator: { id: "$jwt.sub" } }
            }
        ]
    )
```

---

## Read Node

### GraphQL Input

```graphql
{
    users {
        id
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:User)
WHERE this.id IS NOT NULL AND this.id = $this_auth_where0_id
RETURN this { .id } as this
```

### Expected Cypher Params

```json
{
    "this_auth_where0_id": "id-01"
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

## Read Node + User Defined Where

### GraphQL Input

```graphql
{
    users(where: { name: "bob" }) {
        id
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:User)
WHERE this.name = $this_name AND this.id IS NOT NULL AND this.id = $this_auth_where0_id
RETURN this { .id } as this
```

### Expected Cypher Params

```json
{
    "this_auth_where0_id": "id-01",
    "this_name": "bob"
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

## Read Relationship

### GraphQL Input

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

### Expected Cypher Output

```cypher
MATCH (this:User)
WHERE this.id IS NOT NULL AND this.id = $this_auth_where0_id
RETURN this {
    .id,
    posts: [ (this)-[:HAS_POST]->(this_posts:Post) WHERE EXISTS((this_posts)<-[:HAS_POST]-(:User)) AND ALL(creator IN [(this_posts)<-[:HAS_POST]-(creator:User) | creator] WHERE creator.id IS NOT NULL AND creator.id = $this_posts_auth_where0_creator_id) | this_posts { .content } ]
} as this
```

### Expected Cypher Params

```json
{
    "this_auth_where0_id": "id-01",
    "this_posts_auth_where0_creator_id": "id-01"
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

## Read Connection

### GraphQL Input

```graphql
{
    users {
        id
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

### Expected Cypher Output

```cypher
MATCH (this:User)
WHERE this.id IS NOT NULL AND this.id = $this_auth_where0_id
CALL {
    WITH this MATCH (this)-[this_has_post_relationship:HAS_POST]->(this_post:Post)
    WHERE EXISTS((this_post)<-[:HAS_POST]-(:User)) AND ALL(creator IN [(this_post)<-[:HAS_POST]-(creator:User) | creator] WHERE creator.id IS NOT NULL AND creator.id = $this_post_auth_where0_creator_id)
    WITH collect({ node: { content: this_post.content } }) AS edges
    RETURN { edges: edges, totalCount: size(edges) } AS postsConnection
}
RETURN this { .id, postsConnection } as this
```

### Expected Cypher Params

```json
{
    "this_auth_where0_id": "id-01",
    "this_post_auth_where0_creator_id": "id-01"
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

## Read Connection + User Defined Where

### GraphQL Input

```graphql
{
    users {
        id
        postsConnection(where: { node: { id: "some-id" } }) {
            edges {
                node {
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
WHERE this.id IS NOT NULL AND this.id = $this_auth_where0_id
CALL {
    WITH this MATCH (this)-[this_has_post_relationship:HAS_POST]->(this_post:Post)
    WHERE this_post.id = $this_postsConnection.args.where.node.id AND EXISTS((this_post)<-[:HAS_POST]-(:User)) AND ALL(creator IN [(this_post)<-[:HAS_POST]-(creator:User) | creator] WHERE creator.id IS NOT NULL AND creator.id = $this_post_auth_where0_creator_id)
    WITH collect({ node: { content: this_post.content } }) AS edges
    RETURN { edges: edges, totalCount: size(edges) } AS postsConnection
}
RETURN this { .id, postsConnection } as this
```

### Expected Cypher Params

```json
{
    "this_auth_where0_id": "id-01",
    "this_post_auth_where0_creator_id": "id-01",
    "this_postsConnection": {
        "args": {
            "where": {
                "node": {
                    "id": "some-id"
                }
            }
        }
    }
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

## Read Union Relationship + User Defined Where

### GraphQL Input

```graphql
{
    users {
        id
        posts(where: { content: "cool" }) {
            content
        }
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:User)
WHERE this.id IS NOT NULL AND this.id = $this_auth_where0_id

RETURN this {
    .id,
    posts: [ (this)-[:HAS_POST]->(this_posts:Post) WHERE this_posts.content = $this_posts_content AND EXISTS((this_posts)<-[:HAS_POST]-(:User)) AND ALL(creator IN [(this_posts)<-[:HAS_POST]-(creator:User) | creator] WHERE creator.id IS NOT NULL AND creator.id = $this_posts_auth_where0_creator_id) | this_posts { .content } ]
} as this
```

### Expected Cypher Params

```json
{
    "this_posts_content": "cool",
    "this_auth_where0_id": "id-01",
    "this_posts_auth_where0_creator_id": "id-01"
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

## Read Union

### GraphQL Input

```graphql
{
    users {
        id
        content {
            ... on Post {
                id
            }
        }
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:User)
WHERE this.id IS NOT NULL AND this.id = $this_auth_where0_id
RETURN this {
    .id,
    content: [this_content IN [(this)-[:HAS_POST]->(this_content) WHERE ("Post" IN labels(this_content)) | head( [ this_content IN [this_content] WHERE ("Post" IN labels(this_content)) AND EXISTS((this_content)<-[:HAS_POST]-(:User)) AND ALL(creator IN [(this_content)<-[:HAS_POST]-(creator:User) | creator] WHERE creator.id IS NOT NULL AND creator.id = $this_content_Post_auth_where0_creator_id) | this_content { __resolveType: "Post", .id } ] ) ] WHERE this_content IS NOT NULL]
} as this
```

### Expected Cypher Params

```json
{
    "this_auth_where0_id": "id-01",
    "this_content_Post_auth_where0_creator_id": "id-01"
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

## Read Union Using Connection

### GraphQL Input

```graphql
{
    users {
        id
        contentConnection {
            edges {
                node {
                    ... on Post {
                        id
                    }
                }
            }
        }
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:User)
WHERE this.id IS NOT NULL AND this.id = $this_auth_where0_id
CALL {
    WITH this
    CALL {
        WITH this
        MATCH (this)-[this_has_post_relationship:HAS_POST]->(this_Post:Post)
        WHERE EXISTS((this_Post)<-[:HAS_POST]-(:User)) AND ALL(creator IN [(this_Post)<-[:HAS_POST]-(creator:User) | creator] WHERE creator.id IS NOT NULL AND creator.id = $this_Post_auth_where0_creator_id)
        WITH { node: { __resolveType: "Post", id: this_Post.id } } AS edge
        RETURN edge
    }
    WITH collect(edge) as edges, count(edge) as totalCount
    RETURN { edges: edges, totalCount: totalCount } AS contentConnection
}
RETURN this { .id, contentConnection } as this
```

### Expected Cypher Params

```json
{
    "this_auth_where0_id": "id-01",
    "this_Post_auth_where0_creator_id": "id-01"
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

## Read Union Using Connection + User Defined Where

### GraphQL Input

```graphql
{
    users {
        id
        contentConnection(where: { Post: { node: { id: "some-id" } } }) {
            edges {
                node {
                    ... on Post {
                        id
                    }
                }
            }
        }
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:User)
WHERE this.id IS NOT NULL AND this.id = $this_auth_where0_id
CALL {
    WITH this
    CALL {
        WITH this
        MATCH (this)-[this_has_post_relationship:HAS_POST]->(this_Post:Post)
        WHERE this_Post.id = $this_contentConnection.args.where.Post.node.id AND EXISTS((this_Post)<-[:HAS_POST]-(:User)) AND ALL(creator IN [(this_Post)<-[:HAS_POST]-(creator:User) | creator] WHERE creator.id IS NOT NULL AND creator.id = $this_Post_auth_where0_creator_id)
        WITH { node: { __resolveType: "Post", id: this_Post.id } } AS edge
        RETURN edge
    }
    WITH collect(edge) as edges, count(edge) as totalCount
    RETURN { edges: edges, totalCount: totalCount } AS contentConnection
}
RETURN this { .id, contentConnection } as this
```

### Expected Cypher Params

```json
{
    "this_auth_where0_id": "id-01",
    "this_Post_auth_where0_creator_id": "id-01",
    "this_contentConnection": {
        "args": {
            "where": {
                "Post": {
                    "node": {
                        "id": "some-id"
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
    "sub": "id-01",
    "roles": ["admin"]
}
```

---

## Update Node

### GraphQL Input

```graphql
mutation {
    updateUsers(update: { name: "Bob" }) {
        users {
            id
        }
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:User)
WHERE this.id IS NOT NULL AND this.id = $this_auth_where0_id
SET this.name = $this_update_name
RETURN this { .id } AS this
```

### Expected Cypher Params

```json
{
    "this_update_name": "Bob",
    "this_auth_where0_id": "id-01"
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

## Update Node + User Defined Where

### GraphQL Input

```graphql
mutation {
    updateUsers(where: { name: "bob" }, update: { name: "Bob" }) {
        users {
            id
        }
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:User)
WHERE this.name = $this_name AND this.id IS NOT NULL AND this.id = $this_auth_where0_id
SET this.name = $this_update_name
RETURN this { .id } AS this
```

### Expected Cypher Params

```json
{
    "this_update_name": "Bob",
    "this_auth_where0_id": "id-01",
    "this_name": "bob"
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

## Update Nested Node

### GraphQL Input

```graphql
mutation {
    updateUsers(update: { posts: { update: { node: { id: "new-id" } } } }) {
        users {
            id
            posts {
                id
            }
        }
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:User)
WHERE this.id IS NOT NULL AND this.id = $this_auth_where0_id

WITH this OPTIONAL MATCH (this)-[this_has_post0_relationship:HAS_POST]->(this_posts0:Post)
WHERE EXISTS((this_posts0)<-[:HAS_POST]-(:User)) AND ALL(creator IN [(this_posts0)<-[:HAS_POST]-(creator:User) | creator] WHERE creator.id IS NOT NULL AND creator.id = $this_posts0_auth_where0_creator_id)

CALL apoc.do.when(this_posts0 IS NOT NULL, " SET this_posts0.id = $this_update_posts0_id RETURN count(*) ", "", {this:this, updateUsers: $updateUsers, this_posts0:this_posts0, auth:$auth,this_update_posts0_id:$this_update_posts0_id}) YIELD value as _

RETURN this {
    .id,
    posts: [ (this)-[:HAS_POST]->(this_posts:Post) WHERE EXISTS((this_posts)<-[:HAS_POST]-(:User)) AND ALL(creator IN [(this_posts)<-[:HAS_POST]-(creator:User) | creator] WHERE creator.id IS NOT NULL AND creator.id = $this_posts_auth_where0_creator_id) | this_posts { .id } ]
} AS this
```

### Expected Cypher Params

```json
{
    "this_posts_auth_where0_creator_id": "id-01",
    "this_posts0_auth_where0_creator_id": "id-01",
    "this_update_posts0_id": "new-id",
    "this_auth_where0_id": "id-01",
    "auth": {
        "isAuthenticated": true,
        "jwt": {
            "roles": ["admin"],
            "sub": "id-01"
        },
        "roles": ["admin"]
    },
    "updateUsers": {
        "args": {
            "update": {
                "posts": [
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
    "sub": "id-01",
    "roles": ["admin"]
}
```

---

## Delete Node

### GraphQL Input

```graphql
mutation {
    deleteUsers {
        nodesDeleted
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:User)
WHERE this.id IS NOT NULL AND this.id = $this_auth_where0_id
DETACH DELETE this
```

### Expected Cypher Params

```json
{
    "this_auth_where0_id": "id-01"
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

## Delete Node + User Defined Where

### GraphQL Input

```graphql
mutation {
    deleteUsers(where: { name: "Bob" }) {
        nodesDeleted
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:User)
WHERE this.name = $this_name AND this.id IS NOT NULL AND this.id = $this_auth_where0_id
DETACH DELETE this
```

### Expected Cypher Params

```json
{
    "this_auth_where0_id": "id-01",
    "this_name": "Bob"
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

## Delete Nested Node

### GraphQL Input

```graphql
mutation {
    deleteUsers(delete: { posts: { where: {} } }) {
        nodesDeleted
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:User)
WHERE this.id IS NOT NULL AND this.id = $this_auth_where0_id

WITH this
OPTIONAL MATCH (this)-[this_posts0_relationship:HAS_POST]->(this_posts0:Post)
WHERE EXISTS((this_posts0)<-[:HAS_POST]-(:User)) AND ALL(creator IN [(this_posts0)<-[:HAS_POST]-(creator:User) | creator] WHERE creator.id IS NOT NULL AND creator.id = $this_posts0_auth_where0_creator_id)

WITH this, this_posts0
CALL {
    WITH this_posts0
    FOREACH(_ IN CASE this_posts0 WHEN NULL THEN [] ELSE [1] END | DETACH DELETE this_posts0 )
    RETURN count(*)
}

DETACH DELETE this
```

### Expected Cypher Params

```json
{
    "this_auth_where0_id": "id-01",
    "this_posts0_auth_where0_creator_id": "id-01"
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

## Connect Node (from create)

### GraphQL Input

```graphql
mutation {
    createUsers(
        input: [
            {
                id: "123"
                name: "Bob"
                password: "password"
                posts: { connect: { where: { node: {} } } }
            }
        ]
    ) {
        users {
            id
        }
    }
}
```

### Expected Cypher Output

```cypher
CALL {
    CREATE (this0:User)
    SET this0.id = $this0_id
    SET this0.name = $this0_name
    SET this0.password = $this0_password

    WITH this0
    CALL {
        WITH this0
        OPTIONAL MATCH (this0_posts_connect0_node:Post)
        WHERE EXISTS((this0_posts_connect0_node)<-[:HAS_POST]-(:User)) AND ALL(creator IN [(this0_posts_connect0_node)<-[:HAS_POST]-(creator:User) | creator] WHERE creator.id IS NOT NULL AND creator.id = $this0_posts_connect0_node_auth_where0_creator_id)

        FOREACH(_ IN CASE this0_posts_connect0_node WHEN NULL THEN [] ELSE [1] END | MERGE (this0)-[:HAS_POST]->(this0_posts_connect0_node) )

        RETURN count(*)
    }

    RETURN this0
}

RETURN this0 { .id } AS this0
```

### Expected Cypher Params

```json
{
    "this0_id": "123",
    "this0_name": "Bob",
    "this0_password": "password",
    "this0_posts_connect0_node_auth_where0_creator_id": "id-01"
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

## Connect Node + User Defined Where (from create)

### GraphQL Input

```graphql
mutation {
    createUsers(
        input: [
            {
                id: "123"
                name: "Bob"
                password: "password"
                posts: { connect: { where: { node: { id: "post-id" } } } }
            }
        ]
    ) {
        users {
            id
        }
    }
}
```

### Expected Cypher Output

```cypher
CALL {
    CREATE (this0:User)
    SET this0.id = $this0_id
    SET this0.name = $this0_name
    SET this0.password = $this0_password
    WITH this0
    CALL {
        WITH this0
        OPTIONAL MATCH (this0_posts_connect0_node:Post)
        WHERE this0_posts_connect0_node.id = $this0_posts_connect0_node_id AND EXISTS((this0_posts_connect0_node)<-[:HAS_POST]-(:User)) AND ALL(creator IN [(this0_posts_connect0_node)<-[:HAS_POST]-(creator:User) | creator] WHERE creator.id IS NOT NULL AND creator.id = $this0_posts_connect0_node_auth_where0_creator_id)

        FOREACH(_ IN CASE this0_posts_connect0_node WHEN NULL THEN [] ELSE [1] END | MERGE (this0)-[:HAS_POST]->(this0_posts_connect0_node) )

        RETURN count(*)
    }
    RETURN this0
}

RETURN this0 { .id } AS this0
```

### Expected Cypher Params

```json
{
    "this0_id": "123",
    "this0_name": "Bob",
    "this0_password": "password",
    "this0_posts_connect0_node_auth_where0_creator_id": "id-01",
    "this0_posts_connect0_node_id": "post-id"
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

## Connect Node (from update update)

### GraphQL Input

```graphql
mutation {
    updateUsers(update: { posts: { connect: { where: { node: {} } } } }) {
        users {
            id
        }
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:User)

WHERE this.id IS NOT NULL AND this.id = $this_auth_where0_id

WITH this
WHERE this.id IS NOT NULL AND this.id = $this_auth_where0_id

WITH this
CALL {
    WITH this
    OPTIONAL MATCH (this_posts0_connect0_node:Post)
    WHERE EXISTS((this_posts0_connect0_node)<-[:HAS_POST]-(:User)) AND ALL(creator IN [(this_posts0_connect0_node)<-[:HAS_POST]-(creator:User) | creator] WHERE creator.id IS NOT NULL AND creator.id = $this_posts0_connect0_node_auth_where0_creator_id)

    FOREACH(_ IN CASE this_posts0_connect0_node WHEN NULL THEN [] ELSE [1] END | MERGE (this)-[:HAS_POST]->(this_posts0_connect0_node) )

    RETURN count(*)
}

RETURN this { .id } AS this
```

### Expected Cypher Params

```json
{
    "this_auth_where0_id": "id-01",
    "this_posts0_connect0_node_auth_where0_creator_id": "id-01"
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

## Connect Node + User Defined Where (from update update)

### GraphQL Input

```graphql
mutation {
    updateUsers(
        update: { posts: { connect: { where: { node: { id: "new-id" } } } } }
    ) {
        users {
            id
        }
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:User)
WHERE this.id IS NOT NULL AND this.id = $this_auth_where0_id

WITH this
WHERE this.id IS NOT NULL AND this.id = $this_auth_where0_id

WITH this
CALL {
    WITH this
    OPTIONAL MATCH (this_posts0_connect0_node:Post)
    WHERE this_posts0_connect0_node.id = $this_posts0_connect0_node_id AND EXISTS((this_posts0_connect0_node)<-[:HAS_POST]-(:User)) AND ALL(creator IN [(this_posts0_connect0_node)<-[:HAS_POST]-(creator:User) | creator] WHERE creator.id IS NOT NULL AND creator.id = $this_posts0_connect0_node_auth_where0_creator_id)

    FOREACH(_ IN CASE this_posts0_connect0_node WHEN NULL THEN [] ELSE [1] END | MERGE (this)-[:HAS_POST]->(this_posts0_connect0_node) )

    RETURN count(*)
}

RETURN this { .id } AS this
```

### Expected Cypher Params

```json
{
    "this_auth_where0_id": "id-01",
    "this_posts0_connect0_node_auth_where0_creator_id": "id-01",
    "this_posts0_connect0_node_id": "new-id"
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

## Connect Node (from update connect)

### GraphQL Input

```graphql
mutation {
    updateUsers(connect: { posts: { where: { node: {} } } }) {
        users {
            id
        }
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:User)
WHERE this.id IS NOT NULL AND this.id = $this_auth_where0_id

WITH this
WHERE this.id IS NOT NULL AND this.id = $this_auth_where0_id

WITH this
CALL {
    WITH this
    OPTIONAL MATCH (this_connect_posts0_node:Post)
    WHERE EXISTS((this_connect_posts0_node)<-[:HAS_POST]-(:User)) AND ALL(creator IN [(this_connect_posts0_node)<-[:HAS_POST]-(creator:User) | creator] WHERE creator.id IS NOT NULL AND creator.id = $this_connect_posts0_node_auth_where0_creator_id)

    FOREACH(_ IN CASE this_connect_posts0_node WHEN NULL THEN [] ELSE [1] END | MERGE (this)-[:HAS_POST]->(this_connect_posts0_node) )

    RETURN count(*)
}

RETURN this { .id } AS this
```

### Expected Cypher Params

```json
{
    "this_auth_where0_id": "id-01",
    "this_connect_posts0_node_auth_where0_creator_id": "id-01"
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

## Connect Node + User Defined Where (from update connect)

### GraphQL Input

```graphql
mutation {
    updateUsers(connect: { posts: { where: { node: { id: "some-id" } } } }) {
        users {
            id
        }
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:User)
WHERE this.id IS NOT NULL AND this.id = $this_auth_where0_id

WITH this
WHERE this.id IS NOT NULL AND this.id = $this_auth_where0_id

WITH this
CALL {
    WITH this
    OPTIONAL MATCH (this_connect_posts0_node:Post)
    WHERE this_connect_posts0_node.id = $this_connect_posts0_node_id AND EXISTS((this_connect_posts0_node)<-[:HAS_POST]-(:User)) AND ALL(creator IN [(this_connect_posts0_node)<-[:HAS_POST]-(creator:User) | creator] WHERE creator.id IS NOT NULL AND creator.id = $this_connect_posts0_node_auth_where0_creator_id)

    FOREACH(_ IN CASE this_connect_posts0_node WHEN NULL THEN [] ELSE [1] END | MERGE (this)-[:HAS_POST]->(this_connect_posts0_node) )

    RETURN count(*)
}

RETURN this { .id } AS this
```

### Expected Cypher Params

```json
{
    "this_auth_where0_id": "id-01",
    "this_connect_posts0_node_auth_where0_creator_id": "id-01",
    "this_connect_posts0_node_id": "some-id"
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

## Disconnect Node (from update update)

### GraphQL Input

```graphql
mutation {
    updateUsers(update: { posts: { disconnect: { where: {} } } }) {
        users {
            id
        }
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:User)
WHERE this.id IS NOT NULL AND this.id = $this_auth_where0_id

WITH this
WHERE this.id IS NOT NULL AND this.id = $this_auth_where0_id

WITH this
CALL {
    WITH this
    OPTIONAL MATCH (this)-[this_posts0_disconnect0_rel:HAS_POST]->(this_posts0_disconnect0:Post)
    WHERE EXISTS((this_posts0_disconnect0)<-[:HAS_POST]-(:User)) AND ALL(creator IN [(this_posts0_disconnect0)<-[:HAS_POST]-(creator:User) | creator] WHERE creator.id IS NOT NULL AND creator.id = $this_posts0_disconnect0_auth_where0_creator_id)

    FOREACH(_ IN CASE this_posts0_disconnect0 WHEN NULL THEN [] ELSE [1] END | DELETE this_posts0_disconnect0_rel )

    RETURN count(*)
}

RETURN this { .id } AS this
```

### Expected Cypher Params

```json
{
    "this_auth_where0_id": "id-01",
    "this_posts0_disconnect0_auth_where0_creator_id": "id-01"
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

## Disconnect Node + User Defined Where (from update update)

### GraphQL Input

```graphql
mutation {
    updateUsers(
        update: {
            posts: [{ disconnect: { where: { node: { id: "new-id" } } } }]
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
MATCH (this:User)
WHERE this.id IS NOT NULL AND this.id = $this_auth_where0_id

WITH this
WHERE this.id IS NOT NULL AND this.id = $this_auth_where0_id

WITH this
CALL {
WITH this
    OPTIONAL MATCH (this)-[this_posts0_disconnect0_rel:HAS_POST]->(this_posts0_disconnect0:Post) WHERE this_posts0_disconnect0.id = $updateUsers.args.update.posts[0].disconnect[0].where.node.id AND EXISTS((this_posts0_disconnect0)<-[:HAS_POST]-(:User)) AND ALL(creator IN [(this_posts0_disconnect0)<-[:HAS_POST]-(creator:User) | creator] WHERE creator.id IS NOT NULL AND creator.id = $this_posts0_disconnect0_auth_where0_creator_id)

    FOREACH(_ IN CASE this_posts0_disconnect0 WHEN NULL THEN [] ELSE [1] END | DELETE this_posts0_disconnect0_rel )

    RETURN count(*)
}

RETURN this { .id } AS this
```

### Expected Cypher Params

```json
{
    "this_auth_where0_id": "id-01",
    "this_posts0_disconnect0_auth_where0_creator_id": "id-01",
    "updateUsers": {
        "args": {
            "update": {
                "posts": [
                    {
                        "disconnect": [
                            {
                                "where": {
                                    "node": {
                                        "id": "new-id"
                                    }
                                }
                            }
                        ]
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
    "sub": "id-01",
    "roles": ["admin"]
}
```

---

## Disconnect Node (from update disconnect)

### GraphQL Input

```graphql
mutation {
    updateUsers(disconnect: { posts: { where: {} } }) {
        users {
            id
        }
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:User)
WHERE this.id IS NOT NULL AND this.id = $this_auth_where0_id

WITH this
WHERE this.id IS NOT NULL AND this.id = $this_auth_where0_id

WITH this
CALL {
    WITH this OPTIONAL MATCH (this)-[this_disconnect_posts0_rel:HAS_POST]->(this_disconnect_posts0:Post) WHERE EXISTS((this_disconnect_posts0)<-[:HAS_POST]-(:User)) AND ALL(creator IN [(this_disconnect_posts0)<-[:HAS_POST]-(creator:User) | creator] WHERE creator.id IS NOT NULL AND creator.id = $this_disconnect_posts0_auth_where0_creator_id)

    FOREACH(_ IN CASE this_disconnect_posts0 WHEN NULL THEN [] ELSE [1] END |
        DELETE this_disconnect_posts0_rel
    )

    RETURN count(*)
}

RETURN this { .id } AS this
```

### Expected Cypher Params

```json
{
    "this_auth_where0_id": "id-01",
    "this_disconnect_posts0_auth_where0_creator_id": "id-01",
    "updateUsers": {
        "args": {
            "disconnect": {
                "posts": [
                    {
                        "where": {}
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
    "sub": "id-01",
    "roles": ["admin"]
}
```

---

## Disconnect Node + User Defined Where (from update disconnect)

### GraphQL Input

```graphql
mutation {
    updateUsers(disconnect: { posts: { where: { node: { id: "some-id" } } } }) {
        users {
            id
        }
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:User)
WHERE this.id IS NOT NULL AND this.id = $this_auth_where0_id

WITH this
WHERE this.id IS NOT NULL AND this.id = $this_auth_where0_id

WITH this
CALL {
    WITH this OPTIONAL MATCH (this)-[this_disconnect_posts0_rel:HAS_POST]->(this_disconnect_posts0:Post) WHERE this_disconnect_posts0.id = $updateUsers.args.disconnect.posts[0].where.node.id AND EXISTS((this_disconnect_posts0)<-[:HAS_POST]-(:User)) AND ALL(creator IN [(this_disconnect_posts0)<-[:HAS_POST]-(creator:User) | creator] WHERE creator.id IS NOT NULL AND creator.id = $this_disconnect_posts0_auth_where0_creator_id)

    FOREACH(_ IN CASE this_disconnect_posts0 WHEN NULL THEN [] ELSE [1] END |
        DELETE this_disconnect_posts0_rel
    )

    RETURN count(*)
}

RETURN this { .id } AS this
```

### Expected Cypher Params

```json
{
    "this_auth_where0_id": "id-01",
    "this_disconnect_posts0_auth_where0_creator_id": "id-01",
    "updateUsers": {
        "args": {
            "disconnect": {
                "posts": [
                    {
                        "where": {
                            "node": {
                                "id": "some-id"
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
    "sub": "id-01",
    "roles": ["admin"]
}
```

---
