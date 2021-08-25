# Cypher LocalDateTime

Tests LocalDateTime operations. ⚠ The string in params is actually an object but the test suite turns it into a string when calling `JSON.stringify`.

Schema:

```graphql
type Movie {
    id: ID
    localDT: LocalDateTime
}
```

---

## Simple Read

### GraphQL Input

```graphql
query {
    movies(where: { localDT: "2003-09-14T12:00:00" }) {
        localDT
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Movie)
WHERE this.localDT = $this_localDT
RETURN this { .localDT } as this
```

### Expected Cypher Params

```json
{
    "this_localDT": {
        "year": 2003,
        "month": 9,
        "day": 14,
        "hour": 12,
        "minute": 0,
        "second": 0,
        "nanosecond": 0
    }
}
```

---

## GTE Read

### GraphQL Input

```graphql
query {
    movies(where: { localDT_GTE: "2010-08-23T13:45:33.250" }) {
        localDT
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Movie)
WHERE this.localDT >= $this_localDT_GTE
RETURN this { .localDT } as this
```

### Expected Cypher Params

```json
{
    "this_localDT_GTE": {
        "year": 2010,
        "month": 8,
        "day": 23,
        "hour": 13,
        "minute": 45,
        "second": 33,
        "nanosecond": 250000000
    }
}
```

---

## Simple Create

### GraphQL Input

```graphql
mutation {
    createMovies(input: [{ localDT: "1974-05-01T22:00:15.555" }]) {
        movies {
            localDT
        }
    }
}
```

### Expected Cypher Output

```cypher
CALL {
    CREATE (this0:Movie)
    SET this0.localDT = $this0_localDT
    RETURN this0
}
RETURN this0 { .localDT } AS this0
```

### Expected Cypher Params

```json
{
    "this0_localDT": {
        "year": 1974,
        "month": 5,
        "day": 1,
        "hour": 22,
        "minute": 0,
        "second": 15,
        "nanosecond": 555000000
    }
}
```

---

## Simple Update

### GraphQL Input

```graphql
mutation {
    updateMovies(update: { localDT: "1881-07-13T09:24:40.845512" }) {
        movies {
            id
            localDT
        }
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Movie)
SET this.localDT = $this_update_localDT
RETURN this { .id, .localDT } AS this
```

### Expected Cypher Params

```json
{
    "this_update_localDT": {
        "year": 1881,
        "month": 7,
        "day": 13,
        "hour": 9,
        "minute": 24,
        "second": 40,
        "nanosecond": 845512000
    }
}
```

---
