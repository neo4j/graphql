# Cypher Duration

Tests Duration operations. ⚠ The string in params is actually an object but the test suite turns it into a string when calling `JSON.stringify`.

Schema:

```graphql
type Movie {
    id: ID
    duration: Duration
}
```

---

## Simple Read

### GraphQL Input

```graphql
query {
    movies(where: { duration: "P1Y" }) {
        duration
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Movie)
WHERE this.duration = $this_duration
RETURN this { .duration } as this
```

### Expected Cypher Params

```json
{
    "this_duration": {
        "months": 12,
        "days": 0,
        "seconds": {
            "high": 0,
            "low": 0
        },
        "nanoseconds": {
            "high": 0,
            "low": 0
        }
    }
}
```

---

## GTE Read

### GraphQL Input

```graphql
query {
    movies(where: { duration_GTE: "P3Y4M" }) {
        duration
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Movie)
WHERE datetime() + this.duration >= datetime() + $this_duration_GTE
RETURN this { .duration } as this
```

### Expected Cypher Params

```json
{
    "this_duration_GTE": {
        "months": 40,
        "days": 0,
        "seconds": {
            "low": 0,
            "high": 0
        },
        "nanoseconds": {
            "low": 0,
            "high": 0
        }
    }
}
```

---

## Simple Create

### GraphQL Input

```graphql
mutation {
    createMovies(input: [{ duration: "P2Y" }]) {
        movies {
            duration
        }
    }
}
```

### Expected Cypher Output

```cypher
CALL {
    CREATE (this0:Movie)
    SET this0.duration = $this0_duration
    RETURN this0
}
RETURN this0 { .duration } AS this0
```

### Expected Cypher Params

```json
{
    "this0_duration": {
        "months": 24,
        "days": 0,
        "seconds": {
            "high": 0,
            "low": 0
        },
        "nanoseconds": {
            "high": 0,
            "low": 0
        }
    }
}
```

---

## Simple Update

### GraphQL Input

```graphql
mutation {
    updateMovies(update: { duration: "P4D" }) {
        movies {
            id
            duration
        }
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Movie)
SET this.duration = $this_update_duration
RETURN this { .id, .duration } AS this
```

### Expected Cypher Params

```json
{
    "this_update_duration": {
        "months": 0,
        "days": 4,
        "seconds": {
            "high": 0,
            "low": 0
        },
        "nanoseconds": {
            "high": 0,
            "low": 0
        }
    }
}
```

---
