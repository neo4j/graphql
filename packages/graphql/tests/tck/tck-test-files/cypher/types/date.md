# Cypher Date

Tests Date operations. ⚠ The string in params is actually an object but the test suite turns it into a string when calling `JSON.stringify`.

Schema:

```schema
type Movie {
    id: ID
    date: Date
}
```

---

## Simple Read

### GraphQL Input

```graphql
query {
    movies(where: { date: "1970-01-01" }) {
        date
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Movie)
WHERE this.date = $this_date
RETURN this { .date } as this
```

### Expected Cypher Params

```cypher-params
{
    "this_date": {
        "day": 1,
        "month": 1,
        "year": 1970
    }
}
```

---

## GTE Read

### GraphQL Input

```graphql
query {
    movies(where: { date_GTE: "1980-04-08" }) {
        date
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Movie)
WHERE this.date >= $this_date_GTE
RETURN this { .date } as this
```

### Expected Cypher Params

```cypher-params
{
    "this_date_GTE": {
        "day": 8,
        "month": 4,
        "year": 1980
    }
}
```

---

## Simple Create

### GraphQL Input

```graphql
mutation {
    createMovies(input: [{ date: "1970-01-01" }]) {
        movies {
            date
        }
    }
}
```

### Expected Cypher Output

```cypher
CALL {
    CREATE (this0:Movie)
    SET this0.date = $this0_date
    RETURN this0
}
RETURN this0 { .date } AS this0
```

### Expected Cypher Params

```cypher-params
{
    "this0_date": {
        "day": 1,
        "month": 1,
        "year": 1970
    }
}
```

---

## Simple Update

### GraphQL Input

```graphql
mutation {
    updateMovies(update: { date: "1970-01-01" }) {
        movies {
            id
            date
        }
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Movie)
SET this.date = $this_update_date
RETURN this { .id, .date } AS this
```

### Expected Cypher Params

```cypher-params
{
    "this_update_date": {
        "day": 1,
        "month": 1,
        "year": 1970
    }
}
```

---
