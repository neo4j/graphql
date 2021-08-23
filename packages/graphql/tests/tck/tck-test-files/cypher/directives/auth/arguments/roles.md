# Cypher Auth Roles

Tests auth operations with roles

Schema:

```graphql
type History {
    url: String @auth(rules: [{ operations: [READ], roles: ["super-admin"] }])
}

type Comment {
    id: String
    content: String
    post: Post @relationship(type: "HAS_COMMENT", direction: IN)
}

type Post {
    id: String
    content: String
    creator: User @relationship(type: "HAS_POST", direction: OUT)
    comments: [Comment] @relationship(type: "HAS_COMMENT", direction: OUT)
}

type User {
    id: ID
    name: String
    password: String
    posts: [Post] @relationship(type: "HAS_POST", direction: OUT)
}

extend type User
    @auth(
        rules: [
            {
                operations: [READ, CREATE, UPDATE, CONNECT, DISCONNECT, DELETE]
                roles: ["admin"]
            }
        ]
    )

extend type Post
    @auth(
        rules: [
            {
                operations: [CONNECT, DISCONNECT, DELETE]
                roles: ["super-admin"]
            }
        ]
    )

extend type User {
    password: String
        @auth(
            rules: [
                { operations: [READ, CREATE, UPDATE], roles: ["super-admin"] }
            ]
        )
}

extend type User {
    history: [History]
        @cypher(statement: "MATCH (this)-[:HAS_HISTORY]->(h:History) RETURN h")
        @auth(rules: [{ operations: [READ], roles: ["super-admin"] }])
}
```

---

## Read Node

### GraphQL Input

```graphql
{
    users {
        id
        name
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:User)
CALL apoc.util.validate(NOT(ANY(r IN ["admin"] WHERE ANY(rr IN $auth.roles WHERE r = rr))), "@neo4j/graphql/FORBIDDEN", [0])
RETURN this { .id, .name } as this
```

### Expected Cypher Params

```json
{
    "auth": {
        "isAuthenticated": true,
        "roles": ["admin"],
        "jwt": {
            "roles": ["admin"],
            "sub": "super_admin"
        }
    }
}
```

### JWT Object

```json
{
    "sub": "super_admin",
    "roles": ["admin"]
}
```

---

## Read Node & Field

### GraphQL Input

```graphql
{
    users {
        id
        name
        password
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:User)
CALL apoc.util.validate(NOT(ANY(r IN ["admin"] WHERE ANY(rr IN $auth.roles WHERE r = rr))), "@neo4j/graphql/FORBIDDEN", [0])
WITH this
CALL apoc.util.validate(NOT(ANY(r IN ["super-admin"] WHERE ANY(rr IN $auth.roles WHERE r = rr))), "@neo4j/graphql/FORBIDDEN", [0])
RETURN this { .id, .name, .password } as this
```

### Expected Cypher Params

```json
{
    "auth": {
        "isAuthenticated": true,
        "roles": ["admin"],
        "jwt": {
            "roles": ["admin"],
            "sub": "super_admin"
        }
    }
}
```

### JWT Object

```json
{
    "sub": "super_admin",
    "roles": ["admin"]
}
```

---

## Read Node & Cypher Field

### GraphQL Input

```graphql
{
    users {
        history {
            url
        }
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:User)
CALL apoc.util.validate(NOT(ANY(r IN ["admin"] WHERE ANY(rr IN $auth.roles WHERE r = rr))), "@neo4j/graphql/FORBIDDEN", [0])
WITH this
CALL apoc.util.validate(NOT(ANY(r IN ["super-admin"] WHERE ANY(rr IN $auth.roles WHERE r = rr))), "@neo4j/graphql/FORBIDDEN", [0])
RETURN this {
    history: [this_history IN apoc.cypher.runFirstColumn("MATCH (this)-[:HAS_HISTORY]->(h:History) RETURN h", {this: this, auth: $auth}, true) WHERE apoc.util.validatePredicate(NOT(ANY(r IN ["super-admin"] WHERE ANY(rr IN $auth.roles WHERE r = rr))), "@neo4j/graphql/FORBIDDEN", [0]) | this_history { .url }]
} as this
```

### Expected Cypher Params

```json
{
    "auth": {
        "isAuthenticated": true,
        "roles": ["admin"],
        "jwt": {
            "roles": ["admin"],
            "sub": "super_admin"
        }
    }
}
```

### JWT Object

```json
{
    "sub": "super_admin",
    "roles": ["admin"]
}
```

---

## Create Node

### GraphQL Input

```graphql
mutation {
    createUsers(input: [{ id: "1" }]) {
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
  WITH this0
  CALL apoc.util.validate(NOT(ANY(r IN ["admin"] WHERE ANY(rr IN $auth.roles WHERE r = rr))), "@neo4j/graphql/FORBIDDEN", [0])
  RETURN this0
}

RETURN this0 { .id } AS this0
```

### Expected Cypher Params

```json
{
    "this0_id": "1",
    "auth": {
        "isAuthenticated": true,
        "roles": ["admin"],
        "jwt": {
            "roles": ["admin"],
            "sub": "super_admin"
        }
    }
}
```

### JWT Object

```json
{
    "sub": "super_admin",
    "roles": ["admin"]
}
```

---

## Create Node & Field

### GraphQL Input

```graphql
mutation {
    createUsers(input: [{ id: "1", password: "super-password" }]) {
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
  SET this0.password = $this0_password
  WITH this0
  CALL apoc.util.validate(NOT(ANY(r IN ["admin"] WHERE ANY(rr IN $auth.roles WHERE r = rr))), "@neo4j/graphql/FORBIDDEN", [0])
  WITH this0
  CALL apoc.util.validate(NOT(ANY(r IN ["super-admin"] WHERE ANY(rr IN $auth.roles WHERE r = rr))), "@neo4j/graphql/FORBIDDEN", [0])
  RETURN this0
}

RETURN this0 { .id } AS this0
```

### Expected Cypher Params

```json
{
    "this0_id": "1",
    "this0_password": "super-password",
    "auth": {
        "isAuthenticated": true,
        "roles": ["admin"],
        "jwt": {
            "roles": ["admin"],
            "sub": "super_admin"
        }
    }
}
```

### JWT Object

```json
{
    "sub": "super_admin",
    "roles": ["admin"]
}
```

---

## Update Node

### GraphQL Input

```graphql
mutation {
    updateUsers(where: { id: "1" }, update: { id: "id-1" }) {
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
CALL apoc.util.validate(NOT(ANY(r IN ["admin"] WHERE ANY(rr IN $auth.roles WHERE r = rr))), "@neo4j/graphql/FORBIDDEN", [0])

SET this.id = $this_update_id

RETURN this { .id } AS this
```

### Expected Cypher Params

```json
{
    "this_id": "1",
    "this_update_id": "id-1",
    "auth": {
        "isAuthenticated": true,
        "roles": ["admin"],
        "jwt": {
            "roles": ["admin"],
            "sub": "super_admin"
        }
    }
}
```

### JWT Object

```json
{
    "sub": "super_admin",
    "roles": ["admin"]
}
```

---

## Update Node & Field

### GraphQL Input

```graphql
mutation {
    updateUsers(where: { id: "1" }, update: { password: "password" }) {
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
CALL apoc.util.validate(NOT(ANY(r IN ["admin"] WHERE ANY(rr IN $auth.roles WHERE r = rr)) AND ANY(r IN ["super-admin"] WHERE ANY(rr IN $auth.roles WHERE r = rr))), "@neo4j/graphql/FORBIDDEN", [0])

SET this.password = $this_update_password

RETURN this { .id } AS this
```

### Expected Cypher Params

```json
{
    "this_id": "1",
    "this_update_password": "password",
    "auth": {
        "isAuthenticated": true,
        "roles": ["admin"],
        "jwt": {
            "roles": ["admin"],
            "sub": "super_admin"
        }
    }
}
```

### JWT Object

```json
{
    "sub": "super_admin",
    "roles": ["admin"]
}
```

---

## Connect

### GraphQL Input

```graphql
mutation {
    updateUsers(connect: { posts: {} }) {
        users {
            id
        }
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:User)

WITH this
CALL {
    WITH this
    OPTIONAL MATCH (this_connect_posts0_node:Post)

    WITH this, this_connect_posts0_node
    CALL apoc.util.validate(NOT(ANY(r IN ["admin"] WHERE ANY(rr IN $auth.roles WHERE r = rr)) AND ANY(r IN ["super-admin"] WHERE ANY(rr IN $auth.roles WHERE r = rr))), "@neo4j/graphql/FORBIDDEN", [0])

    FOREACH(_ IN CASE this_connect_posts0_node WHEN NULL THEN [] ELSE [1] END |
        MERGE (this)-[:HAS_POST]->(this_connect_posts0_node)
    )

    RETURN count(*)
}

RETURN this { .id } AS this
```

### Expected Cypher Params

```json
{
    "auth": {
        "isAuthenticated": true,
        "roles": ["admin"],
        "jwt": {
            "roles": ["admin"],
            "sub": "super_admin"
        }
    }
}
```

### JWT Object

```json
{
    "sub": "super_admin",
    "roles": ["admin"]
}
```

---

## Nested Connect

### GraphQL Input

```graphql
mutation {
    updateComments(
        update: {
            post: {
                update: {
                    node: {
                        creator: {
                            connect: { where: { node: { id: "user-id" } } }
                        }
                    }
                }
            }
        }
    ) {
        comments {
            content
        }
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Comment)
WITH this
OPTIONAL MATCH (this)<-[this_has_comment0_relationship:HAS_COMMENT]-(this_post0:Post)
CALL apoc.do.when(this_post0 IS NOT NULL, "
    WITH this, this_post0
    CALL {
        WITH this, this_post0
        OPTIONAL MATCH (this_post0_creator0_connect0_node:User)
        WHERE this_post0_creator0_connect0_node.id = $this_post0_creator0_connect0_node_id
        WITH this, this_post0, this_post0_creator0_connect0_node

        CALL apoc.util.validate(NOT(ANY(r IN [\"super-admin\"] WHERE ANY(rr IN $auth.roles WHERE r = rr)) AND ANY(r IN [\"admin\"] WHERE ANY(rr IN $auth.roles WHERE r = rr))), \"@neo4j/graphql/FORBIDDEN\", [0])

        FOREACH(_ IN CASE this_post0_creator0_connect0_node WHEN NULL THEN [] ELSE [1] END |
            MERGE (this_post0)-[:HAS_POST]->(this_post0_creator0_connect0_node)
        )

        RETURN count(*)
    }

    RETURN count(*)
", "", {this:this, updateComments: $updateComments, this_post0:this_post0, auth:$auth,this_post0_creator0_connect0_node_id:$this_post0_creator0_connect0_node_id}) YIELD value as _
RETURN this { .content } AS this
```

### Expected Cypher Params

```json
{
    "this_post0_creator0_connect0_node_id": "user-id",
    "auth": {
        "isAuthenticated": true,
        "roles": ["admin"],
        "jwt": {
            "roles": ["admin"],
            "sub": "super_admin"
        }
    },
    "updateComments": {
        "args": {
            "update": {
                "post": {
                    "update": {
                        "node": {
                            "creator": {
                                "connect": {
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
}
```

### JWT Object

```json
{
    "sub": "super_admin",
    "roles": ["admin"]
}
```

---

## Disconnect

### GraphQL Input

```graphql
mutation {
    updateUsers(disconnect: { posts: {} }) {
        users {
            id
        }
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:User)

WITH this
OPTIONAL MATCH (this)-[this_disconnect_posts0_rel:HAS_POST]->(this_disconnect_posts0:Post)

WITH this, this_disconnect_posts0, this_disconnect_posts0_rel
CALL apoc.util.validate(NOT(ANY(r IN ["admin"] WHERE ANY(rr IN $auth.roles WHERE r = rr)) AND ANY(r IN ["super-admin"] WHERE ANY(rr IN $auth.roles WHERE r = rr))), "@neo4j/graphql/FORBIDDEN", [0])

FOREACH(_ IN CASE this_disconnect_posts0 WHEN NULL THEN [] ELSE [1] END |
    DELETE this_disconnect_posts0_rel
)

RETURN this { .id } AS this
```

### Expected Cypher Params

```json
{
    "auth": {
        "isAuthenticated": true,
        "roles": ["admin"],
        "jwt": {
            "roles": ["admin"],
            "sub": "super_admin"
        }
    },
    "updateUsers": {
        "args": {
            "disconnect": {
                "posts": [{}]
            }
        }
    }
}
```

### JWT Object

```json
{
    "sub": "super_admin",
    "roles": ["admin"]
}
```

---

## Nested Disconnect

### GraphQL Input

```graphql
mutation {
    updateComments(
        update: {
            post: {
                update: {
                    node: {
                        creator: {
                            disconnect: { where: { node: { id: "user-id" } } }
                        }
                    }
                }
            }
        }
    ) {
        comments {
            content
        }
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Comment)

WITH this
OPTIONAL MATCH (this)<-[this_has_comment0_relationship:HAS_COMMENT]-(this_post0:Post)
CALL apoc.do.when(this_post0 IS NOT NULL, "
    WITH this, this_post0
    OPTIONAL MATCH (this_post0)-[this_post0_creator0_disconnect0_rel:HAS_POST]->(this_post0_creator0_disconnect0:User)
    WHERE this_post0_creator0_disconnect0.id = $updateComments.args.update.post.update.node.creator.disconnect.where.node.id
    WITH this, this_post0, this_post0_creator0_disconnect0, this_post0_creator0_disconnect0_rel
    CALL apoc.util.validate(NOT(ANY(r IN [\"super-admin\"] WHERE ANY(rr IN $auth.roles WHERE r = rr)) AND ANY(r IN [\"admin\"] WHERE ANY(rr IN $auth.roles WHERE r = rr))), \"@neo4j/graphql/FORBIDDEN\", [0])

    FOREACH(_ IN CASE this_post0_creator0_disconnect0 WHEN NULL THEN [] ELSE [1] END |
        DELETE this_post0_creator0_disconnect0_rel
    )

    RETURN count(*)
",
"",
{this:this, updateComments: $updateComments, this_post0:this_post0, auth:$auth}) YIELD value as _

RETURN this { .content } AS this
```

### Expected Cypher Params

```json
{
    "auth": {
        "isAuthenticated": true,
        "roles": ["admin"],
        "jwt": {
            "roles": ["admin"],
            "sub": "super_admin"
        }
    },
    "updateComments": {
        "args": {
            "update": {
                "post": {
                    "update": {
                        "node": {
                            "creator": {
                                "disconnect": {
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
}
```

### JWT Object

```json
{
    "sub": "super_admin",
    "roles": ["admin"]
}
```

---

## Delete

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

WITH this
CALL apoc.util.validate(NOT(ANY(r IN ["admin"] WHERE ANY(rr IN $auth.roles WHERE r = rr))), "@neo4j/graphql/FORBIDDEN", [0])

DETACH DELETE this
```

### Expected Cypher Params

```json
{
    "auth": {
        "isAuthenticated": true,
        "roles": ["admin"],
        "jwt": {
            "roles": ["admin"],
            "sub": "super_admin"
        }
    }
}
```

### JWT Object

```json
{
    "sub": "super_admin",
    "roles": ["admin"]
}
```

---

## Nested Delete

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

WITH this

OPTIONAL MATCH (this)-[this_posts0_relationship:HAS_POST]->(this_posts0:Post)

WITH this, this_posts0

CALL apoc.util.validate(NOT(ANY(r IN ["super-admin"] WHERE ANY(rr IN $auth.roles WHERE r = rr))), "@neo4j/graphql/FORBIDDEN", [0])

WITH this, this_posts0
CALL {
    WITH this_posts0
    FOREACH(_ IN CASE this_posts0 WHEN NULL THEN [] ELSE [1] END |
        DETACH DELETE this_posts0
    )
    RETURN count(*)
}

WITH this CALL apoc.util.validate(NOT(ANY(r IN ["admin"] WHERE ANY(rr IN $auth.roles WHERE r = rr))), "@neo4j/graphql/FORBIDDEN", [0])

DETACH DELETE this
```

### Expected Cypher Params

```json
{
    "auth": {
        "isAuthenticated": true,
        "roles": ["admin"],
        "jwt": {
            "roles": ["admin"],
            "sub": "super_admin"
        }
    }
}
```

### JWT Object

```json
{
    "sub": "super_admin",
    "roles": ["admin"]
}
```

---
