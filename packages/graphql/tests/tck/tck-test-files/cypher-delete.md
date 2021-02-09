## Cypher Delete

Tests delete operations.

Schema:

```schema
type Actor {
    name: String
    movies: [Movie] @relationship(type: "ACTED_IN", direction: "OUT")
}

type Movie {
    id: ID
    title: String
    actors: [Actor]! @relationship(type: "ACTED_IN", direction: "IN")
}
```

---

### Simple Delete

**GraphQL input**

```graphql
mutation {
    deleteMovies(where: { id: "123" }) {
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

### Single Nested Delete

**GraphQL input**

```graphql
mutation {
    deleteMovies(
        where: { id: 123 }
        delete: { actors: [{ where: { name: "Actor to delete" } }] }
    ) {
        nodesDeleted
    }
}
```

**Expected Cypher output**

```cypher
MATCH (this:Movie)
WHERE this.id = $this_id
WITH this
OPTIONAL MATCH (this)<-[:ACTED_IN]-(this_actors0:Actor)
WHERE this_actors0.name = $this_actors0_name
FOREACH(_ IN CASE this_actors0 WHEN NULL THEN [] ELSE [1] END |
    DETACH DELETE this_actors0
)
DETACH DELETE this
```

**Expected Cypher params**

```cypher-params
{
    "this_id": "123",
    "this_actors0_name": "Actor to delete"
}
```

---
