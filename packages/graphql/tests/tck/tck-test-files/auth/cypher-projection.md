## Cypher Auth Projection

Tests auth is added to projections in all operations

Schema:

```schema
type User {
    id: ID
    name: String
}

extend type User {
    id: ID @auth(rules: [{ operations: "*", allow: { id: "sub" } }])
}
```

---

### Update Node

**GraphQL input**

```graphql
mutation {
    updateUsers(update: { id: "new-id" }) {
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
CALL apoc.util.validate(NOT(this.id = $this_update_id_auth_allow0_id), "@neo4j/graphql/FORBIDDEN", [0])
SET this.id = $this_update_id
WITH this
CALL apoc.util.validate(NOT(this.id = $this_id_auth_allow0_id), "@neo4j/graphql/FORBIDDEN", [0])
RETURN this { .id } AS this
```

**Expected Cypher params**

```cypher-params
{
    "this_id_auth_allow0_id": "super_admin",
    "this_update_id": "new-id",
    "this_update_id_auth_allow0_id": "super_admin"
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
    createUsers(input: [{ id: "id-1" }, { id: "id-2" }]) {
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
    RETURN this0
}

CALL {
    CREATE (this1:User)
    SET this1.id = $this1_id
    RETURN this1
}

CALL apoc.util.validate(NOT(this0.id = $projection_id_auth_allow0_id), "@neo4j/graphql/FORBIDDEN", [0])
CALL apoc.util.validate(NOT(this1.id = $projection_id_auth_allow0_id), "@neo4j/graphql/FORBIDDEN", [0])

RETURN this0 { .id } AS this0, this1 { .id } AS this1
```

**Expected Cypher params**

```cypher-params
{
    "this0_id": "id-1",
    "this1_id": "id-2",
    "projection_id_auth_allow0_id": "super_admin"
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
