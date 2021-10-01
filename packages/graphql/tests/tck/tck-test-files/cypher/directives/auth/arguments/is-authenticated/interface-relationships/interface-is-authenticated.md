# Cypher Auth isAuthenticated

Tests auth isAuthenticated operation

Schema:

```graphql
type History {
    url: String @auth(rules: [{ operations: [READ], isAuthenticated: true }])
}

interface Content
    @auth(rules: [{ operations: [READ, CREATE, UPDATE, CONNECT, DISCONNECT, DELETE], isAuthenticated: true }]) {
    id: String
    content: String
}

type Comment implements Content {
    id: String
    content: String
}

type Post implements Content {
    id: String
    content: String
}

type User {
    id: ID
    name: String
    password: String
    content: [Content] @relationship(type: "HAS_CONTENT", direction: OUT)
}

extend type User
    @auth(rules: [{ operations: [READ, CREATE, UPDATE, CONNECT, DISCONNECT, DELETE], isAuthenticated: true }])

extend type User {
    password: String @auth(rules: [{ operations: [READ, CREATE, UPDATE], isAuthenticated: true }])
}

extend type User {
    history: [History]
        @cypher(statement: "MATCH (this)-[:HAS_HISTORY]->(h:History) RETURN h")
        @auth(rules: [{ operations: [READ], isAuthenticated: true }])
}
```

---

## Create Node

### GraphQL Input

```graphql
mutation {
    createPosts(input: [{ id: "1", content: "content" }]) {
        posts {
            id
        }
    }
}
```

### Expected Cypher Output

```cypher
CALL {
  CREATE (this0:Post)
  SET this0.id = $this0_id
  SET this0.content = $this0_content
  WITH this0
  CALL apoc.util.validate(NOT(apoc.util.validatePredicate(NOT($auth.isAuthenticated = true), "@neo4j/graphql/UNAUTHENTICATED", [0])), "@neo4j/graphql/FORBIDDEN", [0])
  RETURN this0
}

RETURN this0 { .id } AS this0
```

### Expected Cypher Params

```json
{
    "this0_id": "1",
    "this0_content": "content",
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
    updatePosts(where: { id: "1" }, update: { id: "id-1" }) {
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
CALL apoc.util.validate(NOT(apoc.util.validatePredicate(NOT($auth.isAuthenticated = true), "@neo4j/graphql/UNAUTHENTICATED", [0])), "@neo4j/graphql/FORBIDDEN", [0])

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

## Connect

### GraphQL Input

```graphql
mutation {
    updateUsers(connect: { content: {} }) {
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
    OPTIONAL MATCH (this_connect_content0_node:Comment)
    WITH this, this_connect_content0_node
    CALL apoc.util.validate(NOT(apoc.util.validatePredicate(NOT($auth.isAuthenticated = true), "@neo4j/graphql/UNAUTHENTICATED", [0]) AND apoc.util.validatePredicate(NOT($auth.isAuthenticated = true), "@neo4j/graphql/UNAUTHENTICATED", [0])), "@neo4j/graphql/FORBIDDEN", [0])
    FOREACH(_ IN CASE this WHEN NULL THEN [] ELSE [1] END |
        FOREACH(_ IN CASE this_connect_content0_node WHEN NULL THEN [] ELSE [1] END |
            MERGE (this)-[:HAS_CONTENT]->(this_connect_content0_node)
        )
    )
    RETURN count(*)
UNION
    WITH this
    OPTIONAL MATCH (this_connect_content0_node:Post) WITH this, this_connect_content0_node
    CALL apoc.util.validate(NOT(apoc.util.validatePredicate(NOT($auth.isAuthenticated = true), "@neo4j/graphql/UNAUTHENTICATED", [0]) AND apoc.util.validatePredicate(NOT($auth.isAuthenticated = true), "@neo4j/graphql/UNAUTHENTICATED", [0])), "@neo4j/graphql/FORBIDDEN", [0])
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

## Disconnect

### GraphQL Input

```graphql
mutation {
    updateUsers(disconnect: { content: {} }) {
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
    OPTIONAL MATCH (this)-[this_disconnect_content0_rel:HAS_CONTENT]->(this_disconnect_content0:Comment)
    WITH this, this_disconnect_content0, this_disconnect_content0_rel
    CALL apoc.util.validate(NOT(apoc.util.validatePredicate(NOT($auth.isAuthenticated = true), "@neo4j/graphql/UNAUTHENTICATED", [0]) AND apoc.util.validatePredicate(NOT($auth.isAuthenticated = true), "@neo4j/graphql/UNAUTHENTICATED", [0])), "@neo4j/graphql/FORBIDDEN", [0])
    FOREACH(_ IN CASE this_disconnect_content0 WHEN NULL THEN [] ELSE [1] END |
        DELETE this_disconnect_content0_rel
    )
    RETURN count(*)
UNION
    WITH this
    OPTIONAL MATCH (this)-[this_disconnect_content0_rel:HAS_CONTENT]->(this_disconnect_content0:Post)
    WITH this, this_disconnect_content0, this_disconnect_content0_rel CALL apoc.util.validate(NOT(apoc.util.validatePredicate(NOT($auth.isAuthenticated = true), "@neo4j/graphql/UNAUTHENTICATED", [0]) AND apoc.util.validatePredicate(NOT($auth.isAuthenticated = true), "@neo4j/graphql/UNAUTHENTICATED", [0])), "@neo4j/graphql/FORBIDDEN", [0])
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
                "content": [{}]
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
    deletePosts {
        nodesDeleted
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Post)

WITH this
CALL apoc.util.validate(NOT(apoc.util.validatePredicate(NOT($auth.isAuthenticated = true), "@neo4j/graphql/UNAUTHENTICATED", [0])), "@neo4j/graphql/FORBIDDEN", [0])

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
    deleteUsers(delete: { content: { where: {} } }) {
        nodesDeleted
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:User)

WITH this
OPTIONAL MATCH (this)-[this_content_Comment0_relationship:HAS_CONTENT]->(this_content_Comment0:Comment)
WITH this, this_content_Comment0
CALL apoc.util.validate(NOT(apoc.util.validatePredicate(NOT($auth.isAuthenticated = true), "@neo4j/graphql/UNAUTHENTICATED", [0])), "@neo4j/graphql/FORBIDDEN", [0])
FOREACH(_ IN CASE this_content_Comment0 WHEN NULL THEN [] ELSE [1] END |
    DETACH DELETE this_content_Comment0
)

WITH this
OPTIONAL MATCH (this)-[this_content_Post0_relationship:HAS_CONTENT]->(this_content_Post0:Post)
WITH this, this_content_Post0
CALL apoc.util.validate(NOT(apoc.util.validatePredicate(NOT($auth.isAuthenticated = true), "@neo4j/graphql/UNAUTHENTICATED", [0])), "@neo4j/graphql/FORBIDDEN", [0])
FOREACH(_ IN CASE this_content_Post0 WHEN NULL THEN [] ELSE [1] END |
    DETACH DELETE this_content_Post0
)

WITH this CALL apoc.util.validate(NOT(apoc.util.validatePredicate(NOT($auth.isAuthenticated = true), "@neo4j/graphql/UNAUTHENTICATED", [0])), "@neo4j/graphql/FORBIDDEN", [0])
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
