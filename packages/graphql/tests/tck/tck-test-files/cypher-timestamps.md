## Cypher TimeStamps

Tests TimeStamps operations. ⚠ The string in params is actually an object but the test suite turns it into a string when calling `JSON.stringify`.

Schema:

```schema
type Movie {
    id: ID
    name: String
    createdAt: DateTime @autogenerate(operations: ["create"])
    updatedAt: DateTime @autogenerate(operations: ["update"])
}
```

---

### Simple Create

**GraphQL input**

```graphql
mutation {
    createMovies(input: [{ id: "123" }]) {
        id
    }
}
```

**Expected Cypher output**

```cypher
CALL {
    CREATE (this0:Movie)
    SET this0.createdAt = datetime()
    SET this0.id = $this0_id
    RETURN this0
}
RETURN this0 { .id } AS this0
```

**Expected Cypher params**

```cypher-params
{
    "this0_id": "123"
}
```

---

### Simple Update

**GraphQL input**

```graphql
mutation {
    updateMovies(update: { id: "123", name: "dan" }) {
        id
    }
}
```

**Expected Cypher output**

```cypher
MATCH (this:Movie)
SET this.updatedAt = datetime()
SET this.id = $this_update_id
SET this.name = $this_update_name
RETURN this { .id } AS this
```

**Expected Cypher params**

```cypher-params
{
    "this_update_id": "123",
    "this_update_name": "dan"
}
```

---
