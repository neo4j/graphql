# Cypher Time

Tests Time operations. ⚠ The string in params is actually an object but the test suite turns it into a string when calling `JSON.stringify`.

Schema:

```graphql
type Movie {
    id: ID
    time: Time
}
```

---

## Simple Read

### GraphQL Input

```graphql
query {
    movies(where: { time: "12:00:00" }) {
        time
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Movie)
WHERE this.time = $this_time
RETURN this { .time } as this
```

### Expected Cypher Params

```json
{
    "this_time": {
        "hour": 12,
        "minute": 0,
        "second": 0,
        "nanosecond": 0,
        "timeZoneOffsetSeconds": 0
    }
}
```

---

## GTE Read

### GraphQL Input

```graphql
query {
    movies(where: { time_GTE: "13:45:33.250" }) {
        time
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Movie)
WHERE this.time >= $this_time_GTE
RETURN this { .time } as this
```

### Expected Cypher Params

```json
{
    "this_time_GTE": {
        "hour": 13,
        "minute": 45,
        "second": 33,
        "nanosecond": 250000000,
        "timeZoneOffsetSeconds": 0
    }
}
```

---

## Simple Create

### GraphQL Input

```graphql
mutation {
    createMovies(input: [{ time: "22:00:15.555-01:00" }]) {
        movies {
            time
        }
    }
}
```

### Expected Cypher Output

```cypher
CALL {
    CREATE (this0:Movie)
    SET this0.time = $this0_time
    RETURN this0, [ metaVal IN [{type: 'Created', name: 'Movie', id: id(this0), properties: this0}] WHERE metaVal IS NOT NULL AND metaVal.id IS NOT NULL ] as this0_mutateMeta
}

WITH this0, this0_mutateMeta as mutateMeta
RETURN mutateMeta, this0 { .time } AS this0
```

### Expected Cypher Params

```json
{
    "this0_time": {
        "hour": 22,
        "minute": 0,
        "second": 15,
        "nanosecond": 555000000,
        "timeZoneOffsetSeconds": -3600
    }
}
```

---

## Simple Update

### GraphQL Input

```graphql
mutation {
    updateMovies(update: { time: "09:24:40.845512+06:30" }) {
        movies {
            id
            time
        }
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Movie)
SET this.time = $this_update_time
RETURN [ metaVal IN [{type: 'Updated', name: 'Movie', id: id(this), properties: $this_update}] WHERE metaVal IS NOT NULL AND metaVal.id IS NOT NULL ] as mutateMeta, this { .id, .time } AS this
```

### Expected Cypher Params

```json
{
    "this_update_time": {
        "hour": 9,
        "minute": 24,
        "second": 40,
        "nanosecond": 845512000,
        "timeZoneOffsetSeconds": 23400
    },
    "this_update": {
        "time": {
            "hour": 9,
            "minute": 24,
            "second": 40,
            "nanosecond": 845512000,
            "timeZoneOffsetSeconds": 23400
        }
    }
}
```

---
