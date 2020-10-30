## Cypher Delete

Tests delete operations.

Schema:

```schema
type Movie {
    id: ID
}
```

---

### Simple Delete

**GraphQL input**

```graphql
mutation {
  deleteMovies(where: {id: "123"}) {
    nodesDeleted
  }
}
```

**Expected Cypher output**

```cypher
MATCH (this:Movie)
WHERE this.id = $this_id
DETACH DELETE this
```

**Expected Cypher params**

```cypher-params
{
    "this_id": "123"
}
```

---