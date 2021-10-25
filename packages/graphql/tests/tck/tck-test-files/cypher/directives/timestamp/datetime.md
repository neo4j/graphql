# Cypher TimeStamps On DateTime Fields

Tests TimeStamps operations on DateTime fields. ⚠ The string in params is actually an object but the test suite turns it into a string when calling `JSON.stringify`.

Schema:

```graphql
interface MovieInterface {
    interfaceTimestamp: DateTime @timestamp(operations: [CREATE, UPDATE])
    overrideTimestamp: DateTime @timestamp(operations: [CREATE, UPDATE])
}

type Movie implements MovieInterface {
    id: ID
    name: String
    createdAt: DateTime @timestamp(operations: [CREATE])
    updatedAt: DateTime @timestamp(operations: [UPDATE])
    interfaceTimestamp: DateTime
    overrideTimestamp: DateTime @timestamp(operations: [CREATE])
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
    SET this0.createdAt = datetime()
    SET this0.interfaceTimestamp = datetime()
    SET this0.overrideTimestamp = datetime()
    SET this0.id = $this0_id
    RETURN this0
}
RETURN this0 { .id } AS this0
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
SET this.updatedAt = datetime()
SET this.interfaceTimestamp = datetime()
SET this.id = $this_update_id
SET this.name = $this_update_name
RETURN this { .id } AS this
```

### Expected Cypher Params

```json
{
    "this_update_id": "123",
    "this_update_name": "dan"
}
```

---
