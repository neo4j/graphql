## Cypher autogenerate directive

Tests autogenerate operations.

Schema:

```schema
type Movie {
    id: ID! @autogenerate
    name: String!
}
```

---

### Simple Create

**GraphQL input**

```graphql
mutation {
    createMovies(input: [{ name: "dan" }]) {
        movies {
            id
            name
        }
    }
}
```

**Expected Cypher output**

```cypher
CALL {
  CREATE (this0:Movie)
  SET this0.id = randomUUID()
  SET this0.name = $this0_name
  RETURN this0
}

RETURN this0 { .id, .name } AS this0
```

**Expected Cypher params**

```cypher-params
{
    "this0_name": "dan"
}
```

---

### Simple Update

**GraphQL input**

```graphql
mutation {
    updateMovies(update: { name: "dan" }) {
        movies {
            id
            name
        }
    }
}
```

**Expected Cypher output**

```cypher
MATCH (this:Movie)
SET this.name = $this_update_name
RETURN this { .id, .name } AS this
```

**Expected Cypher params**

```cypher-params
{
    "this_update_name": "dan"
}
```

---
