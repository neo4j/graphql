## Cypher Create

Tests create operations.

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

### Simple Create

**GraphQL input**

```graphql
mutation {
  createMovies(input: [{ id: 1 }]) {
    id
  }
}
```

**Expected Cypher output**

```cypher
CREATE (this0:Movie)
SET this0.id = $this0_id
RETURN this0 { .id } as this0
```

**Expected Cypher params**

```cypher-params
{
    "this0_id": "1"
}
```

---