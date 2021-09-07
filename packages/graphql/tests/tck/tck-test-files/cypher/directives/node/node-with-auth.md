# Node Directive

Custom label using @node.

Schema:

```graphql

type Post @node(label:"Comment") {
    id: ID
    content: String
    creator: User @relationship(type: "HAS_POST", direction: IN)
}

extend type Post
    @auth(rules: [{ operations: [DELETE], roles: ["admin"] }])

type User @node(label:"Person") {
    id: ID
    name: String
    posts: [Post] @relationship(type: "HAS_POST", direction: OUT)
}

extend type User
    @auth(
        rules: [
            {
                operations: [READ, UPDATE, DELETE, DISCONNECT, CONNECT]
                allow: { id: "$jwt.sub" }
            }
        ]
    )


```

---

## Read User

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
MATCH (this:Person)
CALL apoc.util.validate(NOT(this.id IS NOT NULL AND this.id = $this_auth_allow0_id), "@neo4j/graphql/FORBIDDEN", [0])
RETURN this { .id } as this
```

### Expected Cypher Params

```json
{
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

## Admin Deletes Post

### GraphQL Input

```graphql
mutation {
    deletePosts(where: {
        creator: {
            id:"123"
        }
    }) {
        nodesDeleted
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Comment) WHERE EXISTS((this)<-[:HAS_POST]-(:Person)) AND ANY(this_creator IN [(this)<-[:HAS_POST]-(this_creator:Person) | this_creator] WHERE this_creator.id = $this_creator_id) WITH this CALL apoc.util.validate(NOT(ANY(r IN ["admin"] WHERE ANY(rr IN $auth.roles WHERE r = rr))), "@neo4j/graphql/FORBIDDEN", [0]) DETACH DELETE this
```

### Expected Cypher Params

```json
{
    "this_creator_id": "123",
    "auth": {
        "isAuthenticated": true,
        "roles": ["admin"],
        "jwt": {
            "roles": ["admin"],
            "sub": "id-01"
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
