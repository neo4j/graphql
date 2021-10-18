# Cypher DateTime

Tests DateTime operations. ⚠ The string in params is actually an object but the test suite turns it into a string when calling `JSON.stringify`.

Schema:

```graphql
type Movie {
    id: ID
    datetime: DateTime
}
```

---

## Simple Read

### GraphQL Input

```graphql
query {
    movies(where: { datetime: "1970-01-01T00:00:00.000Z" }) {
        datetime
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Movie)
WHERE this.datetime = $this_datetime
RETURN this { datetime: apoc.date.convertFormat(toString(this.datetime), "iso_zoned_date_time", "iso_offset_date_time") } as this
```

### Expected Cypher Params

```json
{
    "this_datetime": {
        "day": 1,
        "hour": 0,
        "minute": 0,
        "month": 1,
        "nanosecond": 0,
        "second": 0,
        "timeZoneId": null,
        "timeZoneOffsetSeconds": 0,
        "year": 1970
    }
}
```

---

## Simple Create

### GraphQL Input

```graphql
mutation {
    createMovies(input: [{ datetime: "1970-01-01T00:00:00.000Z" }]) {
        movies {
            datetime
        }
    }
}
```

### Expected Cypher Output

```cypher
CALL {
    CREATE (this0:Movie)
    SET this0.datetime = $this0_datetime
    RETURN this0, [ metaVal IN [{type: 'Created', name: 'Movie', id: id(this0), properties: this0}] WHERE metaVal IS NOT NULL AND metaVal.id IS NOT NULL ] as this0_mutateMeta
}
WITH this0, this0_mutateMeta as mutateMeta
RETURN mutateMeta, this0 { datetime: apoc.date.convertFormat(toString(this0.datetime), "iso_zoned_date_time", "iso_offset_date_time") } AS this0
```

### Expected Cypher Params

```json
{
    "this0_datetime": {
        "day": 1,
        "hour": 0,
        "minute": 0,
        "month": 1,
        "nanosecond": 0,
        "second": 0,
        "timeZoneId": null,
        "timeZoneOffsetSeconds": 0,
        "year": 1970
    }
}
```

---

## Simple Update

### GraphQL Input

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

### Expected Cypher Output

```cypher
MATCH (this:Movie)
SET this.datetime = $this_update_datetime
RETURN [ metaVal IN [{type: 'Updated', name: 'Movie', id: id(this), properties: $this_update}] WHERE metaVal IS NOT NULL AND metaVal.id IS NOT NULL ] as mutateMeta, this { .id, datetime: apoc.date.convertFormat(toString(this.datetime), "iso_zoned_date_time", "iso_offset_date_time") } AS this
```

### Expected Cypher Params

```json
{
    "this_update_datetime": {
        "day": 1,
        "hour": 0,
        "minute": 0,
        "month": 1,
        "nanosecond": 0,
        "second": 0,
        "timeZoneId": null,
        "timeZoneOffsetSeconds": 0,
        "year": 1970
    },
    "this_update": {
        "datetime": {
            "day": 1,
            "hour": 0,
            "minute": 0,
            "month": 1,
            "nanosecond": 0,
            "second": 0,
            "timeZoneId": null,
            "timeZoneOffsetSeconds": 0,
            "year": 1970
        }
    }
}
```

---
