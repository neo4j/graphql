## Cypher Auth isAuthenticated

Tests auth isAuthenticated operation

Schema:

```schema
type History {
    url: String @auth(rules: [{ operations: [READ], isAuthenticated: true }])
}

type Post {
    id: String
    content: String
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
                isAuthenticated: true
            }
        ]
    )

extend type Post @auth(rules: [{ operations: [CONNECT, DISCONNECT, DELETE], isAuthenticated: true }])

extend type User {
    password: String
        @auth(
            rules: [
                {
                    operations: [READ, CREATE, UPDATE]
                    isAuthenticated: true
                }
            ]
        )
}

extend type User {
    history: [History]
        @cypher(statement: "MATCH (this)-[:HAS_HISTORY]->(h:History) RETURN h")
        @auth(rules: [{ operations: [READ], isAuthenticated: true }])
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
CALL apoc.util.validate(NOT(apoc.util.validatePredicate(NOT($auth.isAuthenticated = true), "@neo4j/graphql/UNAUTHENTICATED", [0])), "@neo4j/graphql/FORBIDDEN", [0])
RETURN this { .id, .name } as this
```

**Expected Cypher params**

```cypher-params
{
    "auth": {
      "isAuthenticated": true,
      "roles": [
        "admin"
      ],
      "jwt": {
        "roles": [
            "admin"
        ],
        "sub": "super_admin"
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
CALL apoc.util.validate(NOT(apoc.util.validatePredicate(NOT($auth.isAuthenticated = true), "@neo4j/graphql/UNAUTHENTICATED", [0])), "@neo4j/graphql/FORBIDDEN", [0])
WITH this
CALL apoc.util.validate(NOT(apoc.util.validatePredicate(NOT($auth.isAuthenticated = true), "@neo4j/graphql/UNAUTHENTICATED", [0])), "@neo4j/graphql/FORBIDDEN", [0])
RETURN this { .id, .name, .password } as this
```

**Expected Cypher params**

```cypher-params
{
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
CALL apoc.util.validate(NOT(apoc.util.validatePredicate(NOT($auth.isAuthenticated = true), "@neo4j/graphql/UNAUTHENTICATED", [0])), "@neo4j/graphql/FORBIDDEN", [0])
WITH this
CALL apoc.util.validate(NOT(apoc.util.validatePredicate(NOT($auth.isAuthenticated = true), "@neo4j/graphql/UNAUTHENTICATED", [0])), "@neo4j/graphql/FORBIDDEN", [0])
RETURN this {
    history: [this_history IN apoc.cypher.runFirstColumn("MATCH (this)-[:HAS_HISTORY]->(h:History) RETURN h", {this: this, auth: $auth}, true) WHERE apoc.util.validatePredicate(NOT(apoc.util.validatePredicate(NOT($auth.isAuthenticated = true), "@neo4j/graphql/UNAUTHENTICATED", [0])), "@neo4j/graphql/FORBIDDEN", [0]) | this_history { .url }]
} as this
```

**Expected Cypher params**

```cypher-params
{
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
  SET this0.id = $this0_id
  WITH this0
  CALL apoc.util.validate(NOT(apoc.util.validatePredicate(NOT($auth.isAuthenticated = true), "@neo4j/graphql/UNAUTHENTICATED", [0])), "@neo4j/graphql/FORBIDDEN", [0])
  RETURN this0
}

RETURN this0 { .id } AS this0
```

**Expected Cypher params**

```cypher-params
{
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
  SET this0.id = $this0_id
  SET this0.password = $this0_password
  WITH this0
  CALL apoc.util.validate(NOT(apoc.util.validatePredicate(NOT($auth.isAuthenticated = true), "@neo4j/graphql/UNAUTHENTICATED", [0])), "@neo4j/graphql/FORBIDDEN", [0])
  WITH this0
  CALL apoc.util.validate(NOT(apoc.util.validatePredicate(NOT($auth.isAuthenticated = true), "@neo4j/graphql/UNAUTHENTICATED", [0])), "@neo4j/graphql/FORBIDDEN", [0])
  RETURN this0
}

RETURN this0 { .id } AS this0
```

**Expected Cypher params**

```cypher-params
{
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
WHERE this.id = $this_id

WITH this
CALL apoc.util.validate(NOT(apoc.util.validatePredicate(NOT($auth.isAuthenticated = true), "@neo4j/graphql/UNAUTHENTICATED", [0])), "@neo4j/graphql/FORBIDDEN", [0])

SET this.id = $this_update_id

RETURN this { .id } AS this
```

**Expected Cypher params**

```cypher-params
{
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
WHERE this.id = $this_id

WITH this
CALL apoc.util.validate(NOT(apoc.util.validatePredicate(NOT($auth.isAuthenticated = true), "@neo4j/graphql/UNAUTHENTICATED", [0]) AND apoc.util.validatePredicate(NOT($auth.isAuthenticated = true), "@neo4j/graphql/UNAUTHENTICATED", [0])), "@neo4j/graphql/FORBIDDEN", [0])

SET this.password = $this_update_password

RETURN this { .id } AS this
```

**Expected Cypher params**

```cypher-params
{
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
OPTIONAL MATCH (this_connect_posts0_node:Post)

WITH this, this_connect_posts0_node
CALL apoc.util.validate(NOT(apoc.util.validatePredicate(NOT($auth.isAuthenticated = true), "@neo4j/graphql/UNAUTHENTICATED", [0]) AND apoc.util.validatePredicate(NOT($auth.isAuthenticated = true), "@neo4j/graphql/UNAUTHENTICATED", [0])), "@neo4j/graphql/FORBIDDEN", [0])

FOREACH(_ IN CASE this_connect_posts0_node WHEN NULL THEN [] ELSE [1] END |
    MERGE (this)-[:HAS_POST]->(this_connect_posts0_node)
)

RETURN this { .id } AS this
```

**Expected Cypher params**

```cypher-params
{
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
CALL apoc.util.validate(NOT(apoc.util.validatePredicate(NOT($auth.isAuthenticated = true), "@neo4j/graphql/UNAUTHENTICATED", [0]) AND apoc.util.validatePredicate(NOT($auth.isAuthenticated = true), "@neo4j/graphql/UNAUTHENTICATED", [0])), "@neo4j/graphql/FORBIDDEN", [0])

FOREACH(_ IN CASE this_disconnect_posts0 WHEN NULL THEN [] ELSE [1] END | DELETE this_disconnect_posts0_rel )

RETURN this { .id } AS this
```

**Expected Cypher params**

```cypher-params
{
    "auth": {
        "isAuthenticated": true,
        "roles": ["admin"],
        "jwt": {
            "roles": [
                "admin"
            ],
            "sub": "super_admin"
        }
    },
    "updateUsers": {
        "args": {
            "disconnect": {
                "posts": [
                    {}
                ]
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
CALL apoc.util.validate(NOT(apoc.util.validatePredicate(NOT($auth.isAuthenticated = true), "@neo4j/graphql/UNAUTHENTICATED", [0])), "@neo4j/graphql/FORBIDDEN", [0])

DETACH DELETE this
```

**Expected Cypher params**

```cypher-params
{
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
OPTIONAL MATCH (this)-[this_posts0_relationship:HAS_POST]->(this_posts0:Post)
WITH this, this_posts0
CALL apoc.util.validate(NOT(apoc.util.validatePredicate(NOT($auth.isAuthenticated = true), "@neo4j/graphql/UNAUTHENTICATED", [0])), "@neo4j/graphql/FORBIDDEN", [0])

FOREACH(_ IN CASE this_posts0 WHEN NULL THEN [] ELSE [1] END |
    DETACH DELETE this_posts0
)

WITH this
CALL apoc.util.validate(NOT(apoc.util.validatePredicate(NOT($auth.isAuthenticated = true), "@neo4j/graphql/UNAUTHENTICATED", [0])), "@neo4j/graphql/FORBIDDEN", [0])

DETACH DELETE this
```

**Expected Cypher params**

```cypher-params
{
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
```

**JWT Object**

```jwt
{
    "sub": "super_admin",
    "roles": ["admin"]
}
```

---
