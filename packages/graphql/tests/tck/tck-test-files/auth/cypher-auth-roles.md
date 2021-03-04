## Cypher Auth Roles

Tests auth operations with roles

Schema:

```schema
type History {
    url: String @auth(rules: [{ operations: ["read"], roles: ["super-admin"] }])
}

type Comment {
    id: String
    content: String
    post: Post @relationship(type: "HAS_COMMENT", direction: "IN")
}

type Post {
    id: String
    content: String
    creator: User @relationship(type: "HAS_POST", direction: "OUT")
    comments: [Comment] @relationship(type: "HAS_COMMENT", direction: "OUT")
}

type User {
    id: ID
    name: String
    password: String
    posts: [Post] @relationship(type: "HAS_POST", direction: "OUT")
}

extend type User
    @auth(
        rules: [
            {
                operations: [
                    "read"
                    "create"
                    "update"
                    "connect"
                    "disconnect"
                    "delete"
                ]
                roles: ["admin"]
            }
        ]
    )

extend type Post
    @auth(
        rules: [
            { operations: ["connect", "disconnect", "delete"], roles: ["super-admin"] }
        ]
    )

extend type User {
    password: String
        @auth(
            rules: [
                {
                    operations: ["read", "create", "update"]
                    roles: ["super-admin"]
                }
            ]
        )
}

extend type User {
    history: [History]
        @cypher(statement: "MATCH (this)-[:HAS_HISTORY]->(h:History) RETURN h")
        @auth(rules: [{ operations: ["read"], roles: ["super-admin"] }])
}
```

---

### Read Node

**GraphQL input**

```graphql
{
    users {
        id
        name
    }
}
```

**Expected Cypher output**

```cypher
MATCH (this:User)
CALL apoc.util.validate(NOT(ANY(r IN ["admin"] WHERE ANY(rr IN $params.auth.roles WHERE r = rr))), "@neo4j/graphql/FORBIDDEN", [0])
RETURN this { .id, .name } as this
```

**Expected Cypher params**

```cypher-params
{
    "params": {
            "auth": {
            "isAuthenticated": true,
            "roles": ["admin"],
            "jwt": {
                "roles": [
                    "admin"
                ],
                "sub": "super_admin"
            }
        }
    }
}
```

**JWT Object**

```jwt
{
    "sub": "super_admin",
    "roles": ["admin"]
}
```

---

### Read Node & Field

**GraphQL input**

```graphql
{
    users {
        id
        name
        password
    }
}
```

**Expected Cypher output**

```cypher
MATCH (this:User)
CALL apoc.util.validate(NOT(ANY(r IN ["admin"] WHERE ANY(rr IN $params.auth.roles WHERE r = rr))), "@neo4j/graphql/FORBIDDEN", [0])
WITH this
CALL apoc.util.validate(NOT(ANY(r IN ["super-admin"] WHERE ANY(rr IN $params.auth.roles WHERE r = rr))), "@neo4j/graphql/FORBIDDEN", [0])
RETURN this { .id, .name, .password } as this
```

**Expected Cypher params**

```cypher-params
{
    "params": {
            "auth": {
            "isAuthenticated": true,
            "roles": ["admin"],
            "jwt": {
                "roles": [
                    "admin"
                ],
                "sub": "super_admin"
            }
        }
    }
}
```

**JWT Object**

```jwt
{
    "sub": "super_admin",
    "roles": ["admin"]
}
```

---

### Read Node & Cypher Field

**GraphQL input**

```graphql
{
    users {
        history {
            url
        }
    }
}
```

**Expected Cypher output**

```cypher
MATCH (this:User)
CALL apoc.util.validate(NOT(ANY(r IN ["admin"] WHERE ANY(rr IN $params.auth.roles WHERE r = rr))), "@neo4j/graphql/FORBIDDEN", [0])
WITH this
CALL apoc.util.validate(NOT(ANY(r IN ["super-admin"] WHERE ANY(rr IN $params.auth.roles WHERE r = rr))), "@neo4j/graphql/FORBIDDEN", [0])
RETURN this {
    history: [this_history IN apoc.cypher.runFirstColumn("MATCH (this)-[:HAS_HISTORY]->(h:History) RETURN h", {this: this, params: $params, auth: $params.auth}, true) WHERE apoc.util.validatePredicate(NOT(ANY(r IN ["super-admin"] WHERE ANY(rr IN $params.auth.roles WHERE r = rr))), "@neo4j/graphql/FORBIDDEN", [0]) | this_history { .url }]
} as this
```

**Expected Cypher params**

```cypher-params
{
    "params": {
        "auth": {
            "isAuthenticated": true,
            "roles": ["admin"],
            "jwt": {
                 "roles": [
                     "admin"
                 ],
                 "sub": "super_admin"
            }
        }
    }
}
```

**JWT Object**

```jwt
{
    "sub": "super_admin",
    "roles": ["admin"]
}
```

---

### Create Node

**GraphQL input**

```graphql
mutation {
    createUsers(input: [{ id: "1" }]) {
        users {
            id
        }
    }
}
```

**Expected Cypher output**

```cypher
CALL {
  CREATE (this0:User)
  SET this0.id = $params.this0_id
  WITH this0
  CALL apoc.util.validate(NOT(ANY(r IN ["admin"] WHERE ANY(rr IN $params.auth.roles WHERE r = rr))), "@neo4j/graphql/FORBIDDEN", [0])
  RETURN this0
}

RETURN this0 { .id } AS this0
```

**Expected Cypher params**

```cypher-params
{
    "params": {
        "this0_id": "1",
        "auth": {
            "isAuthenticated": true,
            "roles": ["admin"],
            "jwt": {
                "roles": [
                    "admin"
                ],
                "sub": "super_admin"
            }
        }
    }
}
```

**JWT Object**

```jwt
{
    "sub": "super_admin",
    "roles": ["admin"]
}
```

---

### Create Node & Field

**GraphQL input**

```graphql
mutation {
    createUsers(input: [{ id: "1", password: "super-password" }]) {
        users {
            id
        }
    }
}
```

**Expected Cypher output**

```cypher
CALL {
  CREATE (this0:User)
  SET this0.id = $params.this0_id
  SET this0.password = $params.this0_password
  WITH this0
  CALL apoc.util.validate(NOT(ANY(r IN ["admin"] WHERE ANY(rr IN $params.auth.roles WHERE r = rr))), "@neo4j/graphql/FORBIDDEN", [0])
  WITH this0
  CALL apoc.util.validate(NOT(ANY(r IN ["super-admin"] WHERE ANY(rr IN $params.auth.roles WHERE r = rr))), "@neo4j/graphql/FORBIDDEN", [0])
  RETURN this0
}

RETURN this0 { .id } AS this0
```

**Expected Cypher params**

```cypher-params
{
    "params": {
        "this0_id": "1",
        "this0_password": "super-password",
        "auth": {
            "isAuthenticated": true,
            "roles": ["admin"],
            "jwt": {
                "roles": [
                    "admin"
                ],
                "sub": "super_admin"
            }
        }
    }
}
```

**JWT Object**

```jwt
{
    "sub": "super_admin",
    "roles": ["admin"]
}
```

---

### Update Node

**GraphQL input**

```graphql
mutation {
    updateUsers(where: { id: "1" }, update: { id: "id-1" }) {
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
CALL apoc.util.validate(NOT(ANY(r IN ["admin"] WHERE ANY(rr IN $params.auth.roles WHERE r = rr))), "@neo4j/graphql/FORBIDDEN", [0])

SET this.id = $params.this_update_id

RETURN this { .id } AS this
```

**Expected Cypher params**

```cypher-params
{
    "params": {
        "this_id": "1",
        "this_update_id": "id-1",
        "auth": {
            "isAuthenticated": true,
            "roles": ["admin"],
            "jwt": {
                "roles": [
                    "admin"
                ],
                "sub": "super_admin"
            }
        }
    }
}
```

**JWT Object**

```jwt
{
    "sub": "super_admin",
    "roles": ["admin"]
}
```

---

### Update Node & Field

**GraphQL input**

```graphql
mutation {
    updateUsers(where: { id: "1" }, update: { password: "password" }) {
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
CALL apoc.util.validate(NOT(ANY(r IN ["admin"] WHERE ANY(rr IN $params.auth.roles WHERE r = rr)) AND ANY(r IN ["super-admin"] WHERE ANY(rr IN $params.auth.roles WHERE r = rr))), "@neo4j/graphql/FORBIDDEN", [0])

SET this.password = $params.this_update_password

RETURN this { .id } AS this
```

**Expected Cypher params**

```cypher-params
{
    "params": {
        "this_id": "1",
        "this_update_password": "password",
        "auth": {
            "isAuthenticated": true,
            "roles": ["admin"],
            "jwt": {
                "roles": [
                    "admin"
                ],
                "sub": "super_admin"
            }
        }
    }
}
```

**JWT Object**

```jwt
{
    "sub": "super_admin",
    "roles": ["admin"]
}
```

---

### Connect

**GraphQL input**

```graphql
mutation {
    updateUsers(connect: { posts: {} }) {
        users {
            id
        }
    }
}
```

**Expected Cypher output**

```cypher
MATCH (this:User)

WITH this
OPTIONAL MATCH (this_connect_posts0:Post)

WITH this, this_connect_posts0
CALL apoc.util.validate(NOT(ANY(r IN ["admin"] WHERE ANY(rr IN $params.auth.roles WHERE r = rr)) AND ANY(r IN ["super-admin"] WHERE ANY(rr IN $params.auth.roles WHERE r = rr))), "@neo4j/graphql/FORBIDDEN", [0])

FOREACH(_ IN CASE this_connect_posts0 WHEN NULL THEN [] ELSE [1] END |
    MERGE (this)-[:HAS_POST]->(this_connect_posts0)
)

RETURN this { .id } AS this
```

**Expected Cypher params**

```cypher-params
{
    "params": {
        "auth": {
            "isAuthenticated": true,
            "roles": ["admin"],
            "jwt": {
                "roles": [
                    "admin"
                ],
                "sub": "super_admin"
            }
        }
    }
}
```

**JWT Object**

```jwt
{
    "sub": "super_admin",
    "roles": ["admin"]
}
```

---

### Nested Connect

**GraphQL input**

```graphql
mutation {
    updateComments(
        update: {
            post: {
                update: { creator: { connect: { where: { id: "user-id" } } } }
            }
        }
    ) {
        comments {
            content
        }
    }
}
```

**Expected Cypher output**

```cypher
MATCH (this:Comment)
WITH this
OPTIONAL MATCH (this)<-[:HAS_COMMENT]-(this_post0:Post)
CALL apoc.do.when(this_post0 IS NOT NULL,
"
    WITH this, this_post0
    OPTIONAL MATCH (this_post0_creator0_connect0:User)
    WHERE this_post0_creator0_connect0.id = $params.this_post0_creator0_connect0_id
    WITH this, this_post0, this_post0_creator0_connect0

    CALL apoc.util.validate(NOT(ANY(r IN [\"super-admin\"] WHERE ANY(rr IN $params.auth.roles WHERE r = rr)) AND ANY(r IN [\"admin\"] WHERE ANY(rr IN $params.auth.roles WHERE r = rr))), \"@neo4j/graphql/FORBIDDEN\", [0])

    FOREACH(_ IN CASE this_post0_creator0_connect0 WHEN NULL THEN [] ELSE [1] END |
        MERGE (this_post0)-[:HAS_POST]->(this_post0_creator0_connect0)
    )

    RETURN count(*)
",
"",
{this:this, this_post0:this_post0, params:$params}) YIELD value as _

RETURN this { .content } AS this
```

**Expected Cypher params**

```cypher-params
{
    "params": {
        "this_post0_creator0_connect0_id": "user-id",
        "auth": {
            "isAuthenticated": true,
            "roles": ["admin"],
            "jwt": {
                "roles": [
                    "admin"
                ],
                "sub": "super_admin"
            }
        }
    }
}
```

**JWT Object**

```jwt
{
    "sub": "super_admin",
    "roles": ["admin"]
}
```

---

### Disconnect

**GraphQL input**

```graphql
mutation {
    updateUsers(disconnect: { posts: {} }) {
        users {
            id
        }
    }
}
```

**Expected Cypher output**

```cypher
MATCH (this:User)

WITH this
OPTIONAL MATCH (this)-[this_disconnect_posts0_rel:HAS_POST]->(this_disconnect_posts0:Post)

WITH this, this_disconnect_posts0, this_disconnect_posts0_rel
CALL apoc.util.validate(NOT(ANY(r IN ["admin"] WHERE ANY(rr IN $params.auth.roles WHERE r = rr)) AND ANY(r IN ["super-admin"] WHERE ANY(rr IN $params.auth.roles WHERE r = rr))), "@neo4j/graphql/FORBIDDEN", [0])

FOREACH(_ IN CASE this_disconnect_posts0 WHEN NULL THEN [] ELSE [1] END |
    DELETE this_disconnect_posts0_rel
)

RETURN this { .id } AS this
```

**Expected Cypher params**

```cypher-params
{
    "params": {
        "auth": {
            "isAuthenticated": true,
            "roles": ["admin"],
            "jwt": {
                "roles": [
                    "admin"
                ],
                "sub": "super_admin"
            }
        }
    }
}
```

**JWT Object**

```jwt
{
    "sub": "super_admin",
    "roles": ["admin"]
}
```

---

### Nested Disconnect

**GraphQL input**

```graphql
mutation {
    updateComments(
        update: {
            post: {
                update: {
                    creator: { disconnect: { where: { id: "user-id" } } }
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

**Expected Cypher output**

```cypher
MATCH (this:Comment)

WITH this
OPTIONAL MATCH (this)<-[:HAS_COMMENT]-(this_post0:Post)
CALL apoc.do.when(this_post0 IS NOT NULL, "
    WITH this, this_post0
    OPTIONAL MATCH (this_post0)-[this_post0_creator0_disconnect0_rel:HAS_POST]->(this_post0_creator0_disconnect0:User)
    WHERE this_post0_creator0_disconnect0.id = $params.this_post0_creator0_disconnect0_id
    WITH this, this_post0, this_post0_creator0_disconnect0, this_post0_creator0_disconnect0_rel
    CALL apoc.util.validate(NOT(ANY(r IN [\"super-admin\"] WHERE ANY(rr IN $params.auth.roles WHERE r = rr)) AND ANY(r IN [\"admin\"] WHERE ANY(rr IN $params.auth.roles WHERE r = rr))), \"@neo4j/graphql/FORBIDDEN\", [0])

    FOREACH(_ IN CASE this_post0_creator0_disconnect0 WHEN NULL THEN [] ELSE [1] END |
        DELETE this_post0_creator0_disconnect0_rel
    )

    RETURN count(*)
",
"",
{this:this, this_post0:this_post0, params:$params}) YIELD value as _

RETURN this { .content } AS this
```

**Expected Cypher params**

```cypher-params
{
    "params": {
        "this_post0_creator0_disconnect0_id": "user-id",
        "auth": {
            "isAuthenticated": true,
            "roles": ["admin"],
            "jwt": {
                "roles": [
                    "admin"
                ],
                "sub": "super_admin"
            }
        }
    }
}
```

**JWT Object**

```jwt
{
    "sub": "super_admin",
    "roles": ["admin"]
}
```

---

### Delete

**GraphQL input**

```graphql
mutation {
    deleteUsers {
        nodesDeleted
    }
}
```

**Expected Cypher output**

```cypher
MATCH (this:User)

WITH this
CALL apoc.util.validate(NOT(ANY(r IN ["admin"] WHERE ANY(rr IN $params.auth.roles WHERE r = rr))), "@neo4j/graphql/FORBIDDEN", [0])

DETACH DELETE this
```

**Expected Cypher params**

```cypher-params
{
    "params": {
        "auth": {
            "isAuthenticated": true,
            "roles": ["admin"],
            "jwt": {
                "roles": [
                    "admin"
                ],
                "sub": "super_admin"
            }
        }
    }
}
```

**JWT Object**

```jwt
{
    "sub": "super_admin",
    "roles": ["admin"]
}
```

---

### Nested Delete

**GraphQL input**

```graphql
mutation {
    deleteUsers(delete: { posts: { where: {} } }) {
        nodesDeleted
    }
}
```

**Expected Cypher output**

```cypher
MATCH (this:User)

WITH this

OPTIONAL MATCH (this)-[:HAS_POST]->(this_posts0:Post)

WITH this, this_posts0

CALL apoc.util.validate(NOT(ANY(r IN ["super-admin"] WHERE ANY(rr IN $params.auth.roles WHERE r = rr))), "@neo4j/graphql/FORBIDDEN", [0])

FOREACH(_ IN CASE this_posts0 WHEN NULL THEN [] ELSE [1] END |
    DETACH DELETE this_posts0
)

WITH this CALL apoc.util.validate(NOT(ANY(r IN ["admin"] WHERE ANY(rr IN $params.auth.roles WHERE r = rr))), "@neo4j/graphql/FORBIDDEN", [0])

DETACH DELETE this
```

**Expected Cypher params**

```cypher-params
{
    "params": {
        "auth": {
            "isAuthenticated": true,
            "roles": ["admin"],
            "jwt": {
                "roles": [
                    "admin"
                ],
                "sub": "super_admin"
            }
        }
    }
}
```

**JWT Object**

```jwt
{
    "sub": "super_admin",
    "roles": ["admin"]
}
```

---
