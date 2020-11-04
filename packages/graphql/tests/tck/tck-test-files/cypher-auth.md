## Cypher Auth

Tests auth operations.

Schema:

```schema
type Product @auth(rules: [
    {
        operations: ["read"],
        allow: { id: "read_id" }
    },
    {
        operations: ["delete"],
        allow: { id: "delete_id" }
    }
]) {
    id: ID
    name: String
}
```

---

### Simple Auth Read

**GraphQL input**

```graphql
{
  Products(where: {id: "123"}) {
    id
    name
  }
}
```

**Expected Cypher output**

```cypher
MATCH (this:Product) 
WHERE this.id = $this_id
CALL apoc.util.validate(NOT(this.id = $this_auth0_id), "Forbidden", [0])
RETURN this { .id, .name } as this
```

**Expected Cypher params**

```cypher-params
{
    "this_id": "123",
    "this_auth0_id": "super_admin_read_id"
}
```

**JWT Object**
```jwt
{
    "read_id": "super_admin_read_id"
}
```

---

### Simple Auth Delete

**GraphQL input**

```graphql
mutation {
  deleteProducts(where: {id: "123"}) {
    nodesDeleted
  }
}
```

**Expected Cypher output**

```cypher
MATCH (this:Product) 
WHERE this.id = $this_id
CALL apoc.util.validate(NOT(this.id = $this_auth0_id), "Forbidden", [0])
DETACH DELETE this
```

**Expected Cypher params**

```cypher-params
{
    "this_id": "123",
    "this_auth0_id": "super_admin_delete_id"
}
```

**JWT Object**
```jwt
{
    "delete_id": "super_admin_delete_id"
}
```

---