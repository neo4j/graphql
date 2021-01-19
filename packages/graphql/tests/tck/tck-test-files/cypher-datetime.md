## Cypher DateTime

Tests DateTime operations. ⚠ The string in params is actually an object but the test suite turns it into a string when calling `JSON.stringify`.

Schema:

```schema
type Movie {
    id: ID
    datetime: DateTime
}
```

---

### Simple Read

**GraphQL input**

```graphql
query {
    Movies(where: { datetime: "1970-01-01T00:00:00.000Z" }) {
        datetime
    }
}
```

**Expected Cypher output**

```cypher
MATCH (this:Movie)
WHERE this.datetime = $this_datetime
RETURN this { .datetime } as this
```

**Expected Cypher params**

```cypher-params
{
    "this_datetime": "1970-01-01T00:00:00.000Z"
}
```

---

### Simple Create

**GraphQL input**

```graphql
mutation {
    createMovies(input: [{ datetime: "1970-01-01T00:00:00.000Z" }]) {
        movies {
            datetime
        }
    }
}
```

**Expected Cypher output**

```cypher
CALL {
    CREATE (this0:Movie)
    SET this0.datetime = $this0_datetime
    RETURN this0
}
RETURN this0 { .datetime } AS this0
```

**Expected Cypher params**

```cypher-params
{
    "this0_datetime": "1970-01-01T00:00:00.000Z"
}
```

---

### Simple Update

**GraphQL input**

```graphql
mutation {
    updateMovies(update: { datetime: "1970-01-01T00:00:00.000Z" }) {
        movies {
            id
            datetime
        }
    }
}
```

**Expected Cypher output**

```cypher
MATCH (this:Movie)
SET this.datetime = $this_update_datetime
RETURN this { .id, .datetime } AS this
```

**Expected Cypher params**

```cypher-params
{
    "this_update_datetime": "1970-01-01T00:00:00.000Z"
}
```

---
