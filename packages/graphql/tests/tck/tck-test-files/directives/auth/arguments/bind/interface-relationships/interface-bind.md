# Cypher Auth Allow

Tests auth allow operations

Schema:

```graphql
interface Content @auth(rules: [{ operations: [CREATE, CONNECT, DISCONNECT], bind: { creator: { id: "$jwt.sub" } } }]) {
    id: ID
    creator: User @relationship(type: "HAS_CONTENT", direction: IN)
}

type Comment implements Content {
    id: ID
    creator: User
}

type Post implements Content {
    id: ID
    creator: User
}

type User {
    id: ID
    name: String
    content: [Content] @relationship(type: "HAS_CONTENT", direction: OUT)
}

extend type User @auth(rules: [{ operations: [CREATE, UPDATE, CONNECT, DISCONNECT], bind: { id: "$jwt.sub" } }])
```

---

## Create Nested Node

### GraphQL Input

```graphql
mutation {
    createUsers(
        input: [
            {
                id: "user-id"
                name: "bob"
                content: {
                    create: [
                        { node: { Post: { id: "post-id-1", creator: { create: { node: { id: "some-user-id" } } } } } }
                    ]
                }
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
    SET this0.id = $this0_id SET
    this0.name = $this0_name

    WITH this0
    CREATE (this0_contentPost0_node:Post)
    SET this0_contentPost0_node.id = $this0_contentPost0_node_id

    WITH this0, this0_contentPost0_node
    CREATE (this0_contentPost0_node_creator0_node:User)
    SET this0_contentPost0_node_creator0_node.id = $this0_contentPost0_node_creator0_node_id

    WITH this0, this0_contentPost0_node, this0_contentPost0_node_creator0_node
    CALL apoc.util.validate(NOT(this0_contentPost0_node_creator0_node.id IS NOT NULL AND this0_contentPost0_node_creator0_node.id = $this0_contentPost0_node_creator0_node_auth_bind0_id), "@neo4j/graphql/FORBIDDEN", [0])

    MERGE (this0_contentPost0_node)<-[:HAS_CONTENT]-(this0_contentPost0_node_creator0_node)

    WITH this0, this0_contentPost0_node
    CALL apoc.util.validate(NOT(EXISTS((this0_contentPost0_node)<-[:HAS_CONTENT]-(:User)) AND ALL(creator IN [(this0_contentPost0_node)<-[:HAS_CONTENT]-(creator:User) | creator] WHERE creator.id IS NOT NULL AND creator.id = $this0_contentPost0_node_auth_bind0_creator_id)), "@neo4j/graphql/FORBIDDEN", [0])

    MERGE (this0)-[:HAS_CONTENT]->(this0_contentPost0_node)

    WITH this0
    CALL apoc.util.validate(NOT(this0.id IS NOT NULL AND this0.id = $this0_auth_bind0_id), "@neo4j/graphql/FORBIDDEN", [0])

    RETURN this0
}

RETURN this0 { .id } AS this0
```

### Expected Cypher Params

```json
{
    "this0_id": "user-id",
    "this0_name": "bob",
    "this0_contentPost0_node_id": "post-id-1",
    "this0_auth_bind0_id": "id-01",
    "this0_contentPost0_node_auth_bind0_creator_id": "id-01",
    "this0_contentPost0_node_creator0_node_auth_bind0_id": "id-01",
    "this0_contentPost0_node_creator0_node_id": "some-user-id"
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
    updateUsers(
        where: { id: "id-01" }
        update: {
            content: {
                where: { node: { id: "post-id" } }
                update: { node: { creator: { update: { node: { id: "not bound" } } } } }
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
MATCH (this:User)
WHERE this.id = $this_id

WITH this
CALL {
    WITH this
    OPTIONAL MATCH (this)-[this_has_content0_relationship:HAS_CONTENT]->(this_content0:Comment)
    WHERE this_content0.id = $updateUsers.args.update.content[0].where.node.id
    CALL apoc.do.when(this_content0 IS NOT NULL, "
        WITH this, this_content0
        OPTIONAL MATCH (this_content0)<-[this_content0_has_content0_relationship:HAS_CONTENT]-(this_content0_creator0:User)
        CALL apoc.do.when(this_content0_creator0 IS NOT NULL, \"
            SET this_content0_creator0.id = $this_update_content0_creator0_id
            WITH this, this_content0, this_content0_creator0
            CALL apoc.util.validate(NOT(this_content0_creator0.id IS NOT NULL AND this_content0_creator0.id = $this_content0_creator0_auth_bind0_id), \"@neo4j/graphql/FORBIDDEN\", [0])
            RETURN count(*)
        \", \"\",
        {this:this, this_content0:this_content0, updateUsers: $updateUsers, this_content0_creator0:this_content0_creator0, auth:$auth,this_update_content0_creator0_id:$this_update_content0_creator0_id,this_content0_creator0_auth_bind0_id:$this_content0_creator0_auth_bind0_id})
        YIELD value as _
        RETURN count(*)
    ", "",
    {this:this, updateUsers: $updateUsers, this_content0:this_content0, auth:$auth,this_update_content0_creator0_id:$this_update_content0_creator0_id,this_content0_creator0_auth_bind0_id:$this_content0_creator0_auth_bind0_id})
    YIELD value as _
    RETURN count(*)
UNION
    WITH this
    OPTIONAL MATCH (this)-[this_has_content0_relationship:HAS_CONTENT]->(this_content0:Post)
    WHERE this_content0.id = $updateUsers.args.update.content[0].where.node.id
    CALL apoc.do.when(this_content0 IS NOT NULL, "
        WITH this, this_content0
        OPTIONAL MATCH (this_content0)<-[this_content0_has_content0_relationship:HAS_CONTENT]-(this_content0_creator0:User)
        CALL apoc.do.when(this_content0_creator0 IS NOT NULL, \"
            SET this_content0_creator0.id = $this_update_content0_creator0_id
            WITH this, this_content0, this_content0_creator0
            CALL apoc.util.validate(NOT(this_content0_creator0.id IS NOT NULL AND this_content0_creator0.id = $this_content0_creator0_auth_bind0_id), \"@neo4j/graphql/FORBIDDEN\", [0])
            RETURN count(*)
        \", \"\",
        {this:this, this_content0:this_content0, updateUsers: $updateUsers, this_content0_creator0:this_content0_creator0, auth:$auth,this_update_content0_creator0_id:$this_update_content0_creator0_id,this_content0_creator0_auth_bind0_id:$this_content0_creator0_auth_bind0_id})
        YIELD value as _
        RETURN count(*)
    ", "",
    {this:this, updateUsers: $updateUsers, this_content0:this_content0, auth:$auth,this_update_content0_creator0_id:$this_update_content0_creator0_id,this_content0_creator0_auth_bind0_id:$this_content0_creator0_auth_bind0_id})
    YIELD value as _
    RETURN count(*)
}

WITH this
CALL apoc.util.validate(NOT(this.id IS NOT NULL AND this.id = $this_auth_bind0_id), "@neo4j/graphql/FORBIDDEN", [0])
RETURN this { .id } AS this
```

### Expected Cypher Params

```json
{
    "this_id": "id-01",
    "this_content0_creator0_auth_bind0_id": "id-01",
    "this_update_content0_creator0_id": "not bound",
    "this_auth_bind0_id": "id-01",
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
                "content": [
                    {
                        "update": {
                            "node": {
                                "creator": {
                                    "update": {
                                        "node": {
                                            "id": "not bound"
                                        }
                                    }
                                }
                            }
                        },
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
    "sub": "id-01",
    "roles": ["admin"]
}
```

---

## Connect Node

### GraphQL Input

```graphql
mutation {
    updateUsers(where: { id: "user-id" }, connect: { content: { where: { node: { id: "content-id" } } } }) {
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
    WITH this, this_connect_content0_node
    CALL apoc.util.validate(NOT(this_connect_content0_node.id IS NOT NULL AND this_connect_content0_node.id = $this_connect_content0_nodeUser0_bind_auth_bind0_id AND EXISTS((this_connect_content0_node)<-[:HAS_CONTENT]-(:User)) AND ALL(creator IN [(this_connect_content0_node)<-[:HAS_CONTENT]-(creator:User) | creator] WHERE creator.id IS NOT NULL AND creator.id = $this_connect_content0_nodeComment1_bind_auth_bind0_creator_id)), "@neo4j/graphql/FORBIDDEN", [0])
    RETURN count(*)
UNION
    WITH this
    OPTIONAL MATCH (this_connect_content0_node:Post)
    WHERE this_connect_content0_node.id = $this_connect_content0_node_id
    FOREACH(_ IN CASE this WHEN NULL THEN [] ELSE [1] END |
        FOREACH(_ IN CASE this_connect_content0_node WHEN NULL THEN [] ELSE [1] END |
            MERGE (this)-[:HAS_CONTENT]->(this_connect_content0_node)
        )
    )
    WITH this, this_connect_content0_node
    CALL apoc.util.validate(NOT(this_connect_content0_node.id IS NOT NULL AND this_connect_content0_node.id = $this_connect_content0_nodeUser0_bind_auth_bind0_id AND EXISTS((this_connect_content0_node)<-[:HAS_CONTENT]-(:User)) AND ALL(creator IN [(this_connect_content0_node)<-[:HAS_CONTENT]-(creator:User) | creator] WHERE creator.id IS NOT NULL AND creator.id = $this_connect_content0_nodePost1_bind_auth_bind0_creator_id)), "@neo4j/graphql/FORBIDDEN", [0])
    RETURN count(*)
}
RETURN this { .id } AS this
```

### Expected Cypher Params

```json
{
    "this_connect_content0_nodeComment1_bind_auth_bind0_creator_id": "id-01",
    "this_connect_content0_nodePost1_bind_auth_bind0_creator_id": "id-01",
    "this_connect_content0_nodeUser0_bind_auth_bind0_id": "id-01",
    "this_connect_content0_node_id": "content-id",
    "this_id": "user-id"
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

## Disconnect Node

### GraphQL Input

```graphql
mutation {
    updateUsers(where: { id: "user-id" }, disconnect: { content: { where: { node: { id: "content-id" } } } }) {
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
    WHERE this_disconnect_content0.id = $updateUsers.args.disconnect.content[0].where.node.id
    FOREACH(_ IN CASE this_disconnect_content0 WHEN NULL THEN [] ELSE [1] END |
        DELETE this_disconnect_content0_rel
    )
    WITH this, this_disconnect_content0
    CALL apoc.util.validate(NOT(this_disconnect_content0.id IS NOT NULL AND this_disconnect_content0.id = $this_disconnect_content0User0_bind_auth_bind0_id AND EXISTS((this_disconnect_content0)<-[:HAS_CONTENT]-(:User)) AND ALL(creator IN [(this_disconnect_content0)<-[:HAS_CONTENT]-(creator:User) | creator] WHERE creator.id IS NOT NULL AND creator.id = $this_disconnect_content0Comment1_bind_auth_bind0_creator_id)), "@neo4j/graphql/FORBIDDEN", [0])
    RETURN count(*)
UNION
    WITH this
    OPTIONAL MATCH (this)-[this_disconnect_content0_rel:HAS_CONTENT]->(this_disconnect_content0:Post)
    WHERE this_disconnect_content0.id = $updateUsers.args.disconnect.content[0].where.node.id
    FOREACH(_ IN CASE this_disconnect_content0 WHEN NULL THEN [] ELSE [1] END |
        DELETE this_disconnect_content0_rel
    )
    WITH this, this_disconnect_content0
    CALL apoc.util.validate(NOT(this_disconnect_content0.id IS NOT NULL AND this_disconnect_content0.id = $this_disconnect_content0User0_bind_auth_bind0_id AND EXISTS((this_disconnect_content0)<-[:HAS_CONTENT]-(:User)) AND ALL(creator IN [(this_disconnect_content0)<-[:HAS_CONTENT]-(creator:User) | creator] WHERE creator.id IS NOT NULL AND creator.id = $this_disconnect_content0Post1_bind_auth_bind0_creator_id)), "@neo4j/graphql/FORBIDDEN", [0])
    RETURN count(*)
}
RETURN this { .id } AS this
```

### Expected Cypher Params

```json
{
    "this_disconnect_content0Comment1_bind_auth_bind0_creator_id": "id-01",
    "this_disconnect_content0Post1_bind_auth_bind0_creator_id": "id-01",
    "this_disconnect_content0User0_bind_auth_bind0_id": "id-01",
    "this_id": "user-id",
    "updateUsers": {
        "args": {
            "disconnect": {
                "content": [
                    {
                        "where": {
                            "node": {
                                "id": "content-id"
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
