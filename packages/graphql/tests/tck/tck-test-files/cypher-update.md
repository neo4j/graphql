## Cypher Update

Tests Update operations.

Schema:

```schema
type Actor {
    name: String
    movies: [Movie] @relationship(type: "ACTED_IN", direction: "OUT")
}
    
type Movie {
    id: ID
    actors: [Actor]! @relationship(type: "ACTED_IN", direction: "IN")
}
```

---

### Simple Update

**GraphQL input**

```graphql
mutation {
  updateMovies(where: { id: "1" }, update: { id: "2" }) {
    id
  }
}
```

**Expected Cypher output**

```cypher
MATCH (this:Movie)
WHERE this.id = $this_id
SET this.id = $this_update_id

RETURN this { .id } AS this
```

**Expected Cypher params**

```cypher-params
{
    "this_id": "1",
    "this_update_id": "2"
}
```

---
