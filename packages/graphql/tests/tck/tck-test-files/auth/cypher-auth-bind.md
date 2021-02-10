## Cypher Auth Allow

Tests auth allow operations

Schema:

```schema
type Post {
    id: ID
    creator: User @relationship(type: "HAS_POST", direction: "IN")
}

type User {
    id: ID
    name: String
    posts: [Post] @relationship(type: "HAS_POST", direction: "IN")
}

extend type User
    @auth(
        rules: [
            {
                operations: ["create", "update"]
                bind: { id: "sub" }
            }
        ]
    )

extend type Post
    @auth(
        rules: [
            {
                operations: ["create"]
                bind: { creator: { id: "sub" } }
            }
        ]
    )
```

---

### Create Node

**GraphQL input**

```graphql
mutation {
    createUsers(input: [{ id: "user-id", name: "bob" }]) {
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
    SET this0.name = $this0_name
    WITH this0
    CALL apoc.util.validate(NOT(this0.id = $this0_auth_bind0_id), "@neo4j/graphql/FORBIDDEN", [0])
    RETURN this0
}
RETURN this0 { .id } AS this0
```

**Expected Cypher params**

```cypher-params
{
    "this0_id": "user-id",
    "this0_name": "bob",
    "this0_auth_bind0_id": "id-01"
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

### Create Nested Node

**GraphQL input**

```graphql
mutation {
    createUsers(
        input: [
            {
                id: "user-id"
                name: "bob"
                posts: {
                    create: [
                        {
                            id: "post-id-1"
                            creator: { create: { id: "some-user-id" } }
                        }
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

**Expected Cypher output**

```cypher
CALL {
    CREATE (this0:User)
    SET this0.id = $this0_id SET
    this0.name = $this0_name

    WITH this0
    CREATE (this0_posts0:Post)
    SET this0_posts0.id = $this0_posts0_id

    WITH this0, this0_posts0
    CREATE (this0_posts0_creator0:User)
    SET this0_posts0_creator0.id = $this0_posts0_creator0_id

    WITH this0, this0_posts0, this0_posts0_creator0
    CALL apoc.util.validate(NOT(this0_posts0_creator0.id = $this0_posts0_creator0_auth_bind0_id), "@neo4j/graphql/FORBIDDEN", [0])

    MERGE (this0_posts0)<-[:HAS_POST]-(this0_posts0_creator0)

    WITH this0, this0_posts0
    CALL apoc.util.validate(NOT(EXISTS((this0_posts0)<-[:HAS_POST]-(:User)) AND ALL(creator IN [(this0_posts0)<-[:HAS_POST]-(creator:User) | creator] WHERE creator.id = $this0_posts0_auth_bind0_creator_id)), "@neo4j/graphql/FORBIDDEN", [0])

    MERGE (this0)<-[:HAS_POST]-(this0_posts0)

    WITH this0
    CALL apoc.util.validate(NOT(this0.id = $this0_auth_bind0_id), "@neo4j/graphql/FORBIDDEN", [0])

    RETURN this0
}

RETURN this0 { .id } AS this0
```

**Expected Cypher params**

```cypher-params
{
    "this0_id": "user-id",
    "this0_name": "bob",
    "this0_posts0_id": "post-id-1",
    "this0_auth_bind0_id": "id-01",
    "this0_posts0_auth_bind0_creator_id": "id-01",
    "this0_posts0_creator0_auth_bind0_id": "id-01",
    "this0_posts0_creator0_id": "some-user-id"
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
    updateUsers(where: { id: "id-01" }, update: { id: "not bound" }) {
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
SET this.id = $this_update_id

WITH this
CALL apoc.util.validate(NOT(this.id = $this_auth_bind0_id), "@neo4j/graphql/FORBIDDEN", [0])

RETURN this { .id } AS this
```

**Expected Cypher params**

```cypher-params
{
    "this_id": "id-01",
    "this_update_id": "not bound",
    "this_auth_bind0_id": "id-01"
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
