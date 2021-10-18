# Cypher TimeStamps On Time Fields

Tests TimeStamps operations on Time fields. ⚠ The string in params is actually an object but the test suite turns it into a string when calling `JSON.stringify`.

Schema:

```graphql
type Movie {
    id: ID
    name: String
    createdAt: Time @timestamp(operations: [CREATE])
    updatedAt: Time @timestamp(operations: [UPDATE])
}
```

---

## Simple Create

### GraphQL Input

```graphql
mutation {
    createMovies(input: [{ id: "123" }]) {
        movies {
            id
        }
    }
}
```

### Expected Cypher Output

```cypher
CALL {
    CREATE (this0:Movie)
    SET this0.createdAt = time()
    SET this0.id = $this0_id
    RETURN this0, [ metaVal IN [{type: 'Created', name: 'Movie', id: id(this0), properties: this0}] WHERE metaVal IS NOT NULL AND metaVal.id IS NOT NULL ] as this0_mutateMeta
}
WITH this0, this0_mutateMeta as mutateMeta
RETURN mutateMeta, this0 { .id } AS this0
```

### Expected Cypher Params

```json
{
    "this0_id": "123"
}
```

---

## Simple Update

### GraphQL Input

```graphql
mutation {
    updateMovies(update: { id: "123", name: "dan" }) {
        movies {
            id
        }
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Movie)
SET this.updatedAt = time()
SET this.id = $this_update_id
SET this.name = $this_update_name
RETURN [ metaVal IN [{type: 'Updated', name: 'Movie', id: id(this), properties: $this_update}] WHERE metaVal IS NOT NULL AND metaVal.id IS NOT NULL ] as mutateMeta, this { .id } AS this
```

### Expected Cypher Params

```json
{
    "this_update_id": "123",
    "this_update_name": "dan",
    "this_update": {
        "id": "123",
        "name": "dan"
    }
}
```

---
