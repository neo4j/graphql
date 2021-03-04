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
WHERE this.id = $params.this_id
DETACH DELETE this
```

**Expected Cypher params**

```cypher-params
{
    "params": {
        "this_id": "123"
    }
}
```

---

### Single Nested Delete

**GraphQL input**

```graphql
mutation {
    deleteMovies(
        where: { id: 123 }
        delete: { actors: { where: { name: "Actor to delete" } } }
    ) {
        nodesDeleted
    }
}
```

**Expected Cypher output**

```cypher
MATCH (this:Movie)
WHERE this.id = $params.this_id
WITH this
OPTIONAL MATCH (this)<-[:ACTED_IN]-(this_actors0:Actor)
WHERE this_actors0.name = $params.this_actors0_name
FOREACH(_ IN CASE this_actors0 WHEN NULL THEN [] ELSE [1] END |
    DETACH DELETE this_actors0
)
DETACH DELETE this
```

**Expected Cypher params**

```cypher-params
{
    "params": {
        "this_id": "123",
        "this_actors0_name": "Actor to delete"
    }
}
```

---

### Single Nested Delete deleting multiple

**GraphQL input**

```graphql
mutation {
    deleteMovies(
        where: { id: 123 }
        delete: {
            actors: [
                { where: { name: "Actor to delete" } }
                { where: { name: "Another actor to delete" } }
            ]
        }
    ) {
        nodesDeleted
    }
}
```

**Expected Cypher output**

```cypher
MATCH (this:Movie)
WHERE this.id = $params.this_id
WITH this
OPTIONAL MATCH (this)<-[:ACTED_IN]-(this_actors0:Actor)
WHERE this_actors0.name = $params.this_actors0_name
FOREACH(_ IN CASE this_actors0 WHEN NULL THEN [] ELSE [1] END |
    DETACH DELETE this_actors0
)
WITH this
OPTIONAL MATCH (this)<-[:ACTED_IN]-(this_actors1:Actor)
WHERE this_actors1.name = $params.this_actors1_name
FOREACH(_ IN CASE this_actors1 WHEN NULL THEN [] ELSE [1] END |
    DETACH DELETE this_actors1
)
DETACH DELETE this
```

**Expected Cypher params**

```cypher-params
{
    "params": {
        "this_id": "123",
        "this_actors0_name": "Actor to delete",
        "this_actors1_name": "Another actor to delete"
    }
}
```

---

### Double Nested Delete

**GraphQL input**

```graphql
mutation {
    deleteMovies(
        where: { id: 123 }
        delete: {
            actors: {
                where: { name: "Actor to delete" }
                delete: { movies: { where: { id: 321 } } }
            }
        }
    ) {
        nodesDeleted
    }
}
```

**Expected Cypher output**

```cypher
MATCH (this:Movie)
WHERE this.id = $params.this_id
WITH this
OPTIONAL MATCH (this)<-[:ACTED_IN]-(this_actors0:Actor)
WHERE this_actors0.name = $params.this_actors0_name
WITH this, this_actors0
OPTIONAL MATCH (this_actors0)-[:ACTED_IN]->(this_actors0_movies0:Movie)
WHERE this_actors0_movies0.id = $params.this_actors0_movies0_id
FOREACH(_ IN CASE this_actors0_movies0 WHEN NULL THEN [] ELSE [1] END |
    DETACH DELETE this_actors0_movies0
)
FOREACH(_ IN CASE this_actors0 WHEN NULL THEN [] ELSE [1] END |
    DETACH DELETE this_actors0
)
DETACH DELETE this
```

**Expected Cypher params**

```cypher-params
{
    "params": {
        "this_id": "123",
        "this_actors0_name": "Actor to delete",
        "this_actors0_movies0_id": "321"
    }
}
```

---

### Triple Nested Delete

**GraphQL input**

```graphql
mutation {
    deleteMovies(
        where: { id: 123 }
        delete: {
            actors: {
                where: { name: "Actor to delete" }
                delete: {
                    movies: {
                        where: { id: 321 }
                        delete: {
                            actors: {
                                where: { name: "Another actor to delete" }
                            }
                        }
                    }
                }
            }
        }
    ) {
        nodesDeleted
    }
}
```

**Expected Cypher output**

```cypher
MATCH (this:Movie)
WHERE this.id = $params.this_id
WITH this
OPTIONAL MATCH (this)<-[:ACTED_IN]-(this_actors0:Actor)
WHERE this_actors0.name = $params.this_actors0_name
WITH this, this_actors0
OPTIONAL MATCH (this_actors0)-[:ACTED_IN]->(this_actors0_movies0:Movie)
WHERE this_actors0_movies0.id = $params.this_actors0_movies0_id
WITH this, this_actors0, this_actors0_movies0
OPTIONAL MATCH (this_actors0_movies0)<-[:ACTED_IN]-(this_actors0_movies0_actors0:Actor)
WHERE this_actors0_movies0_actors0.name = $params.this_actors0_movies0_actors0_name
FOREACH(_ IN CASE this_actors0_movies0_actors0 WHEN NULL THEN [] ELSE [1] END |
    DETACH DELETE this_actors0_movies0_actors0
)
FOREACH(_ IN CASE this_actors0_movies0 WHEN NULL THEN [] ELSE [1] END |
    DETACH DELETE this_actors0_movies0
)
FOREACH(_ IN CASE this_actors0 WHEN NULL THEN [] ELSE [1] END |
    DETACH DELETE this_actors0
)
DETACH DELETE this
```

**Expected Cypher params**

```cypher-params
{
    "params": {
        "this_id": "123",
        "this_actors0_name": "Actor to delete",
        "this_actors0_movies0_id": "321",
        "this_actors0_movies0_actors0_name": "Another actor to delete"
    }
}
```

---
