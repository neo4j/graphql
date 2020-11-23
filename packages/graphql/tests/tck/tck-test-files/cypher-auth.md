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
    },
    {
        operations: ["update"],
        allow: { id: "update_id" }
    }
]) {
    id: ID
    name: String
}

type Color @auth(rules: [
    {
        operations: ["read"],
        allow: { id: "read_id", name: "read_color" }
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

### Multi Auth Read

**GraphQL input**

```graphql
{
  Colors(where: {id: "123"}) {
    id
    name
  }
}
```

**Expected Cypher output**

```cypher
MATCH (this:Color) 
WHERE this.id = $this_id
CALL apoc.util.validate(NOT(this.id = $this_auth0_id AND this.name = $this_auth0_name), "Forbidden", [0])
RETURN this { .id, .name } as this
```

**Expected Cypher params**

```cypher-params
{
    "this_id": "123",
    "this_auth0_id": "super_admin_read_id",
    "this_auth0_name": "red"
}
```

**JWT Object**
```jwt
{
    "read_id": "super_admin_read_id",
    "read_color": "red"
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

### Simple Auth Update

**GraphQL input**

```graphql
mutation {
  updateProducts(where: {id: "123"}, update: {name: "Pringles"}) {
    name
  }
}
```

**Expected Cypher output**

```cypher
MATCH (this:Product) 
WHERE this.id = $this_id 
CALL apoc.util.validate(NOT(this.id = $this_auth0_id), "Forbidden", [0]) 
SET this.name = $this_update_name 
RETURN this { .name } AS this
```

**Expected Cypher params**

```cypher-params
{
    "this_id": "123",
    "this_auth0_id": "super_admin_update_id",
    "this_update_name": "Pringles"
}
```

**JWT Object**
```jwt
{
    "update_id": "super_admin_update_id"
}
```

---