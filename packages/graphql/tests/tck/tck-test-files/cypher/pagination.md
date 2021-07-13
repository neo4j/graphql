# Cypher pagination tests

Tests for queries including reserved arguments `offset` and `limit`.

Schema:

```schema
type Movie {
    id: ID
    title: String
}
```

---

## Skipping

### GraphQL Input

```graphql
{
    movies(options: { offset: 1 }) {
        title
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Movie)
RETURN this { .title } as this
SKIP $this_offset
```

### Expected Cypher Params

```json
{
    "this_offset": {
        "high": 0,
        "low": 1
    }
}
```

---

## Limit

### GraphQL Input

```graphql
{
    movies(options: { limit: 1 }) {
        title
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Movie)
RETURN this { .title } as this
LIMIT $this_limit
```

### Expected Cypher Params

```json
{
    "this_limit": {
        "high": 0,
        "low": 1
    }
}
```

---

## Skip + Limit

### GraphQL Input

```graphql
{
    movies(options: { limit: 1, offset: 2 }) {
        title
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Movie)
RETURN this { .title } as this
SKIP $this_offset
LIMIT $this_limit
```

### Expected Cypher Params

```json
{
    "this_limit": {
        "high": 0,
        "low": 1
    },
    "this_offset": {
        "high": 0,
        "low": 2
    }
}
```

---

## Skip + Limit as variables

### GraphQL Input

```graphql
query($offset: Int, $limit: Int) {
    movies(options: { limit: $limit, offset: $offset }) {
        title
    }
}
```

### GraphQL Params Input

```json
{
    "offset": 0,
    "limit": 0
}
```

### Expected Cypher Output

```cypher
MATCH (this:Movie)
RETURN this { .title } as this
SKIP $this_offset
LIMIT $this_limit
```

### Expected Cypher Params

```json
{
    "this_offset": {
        "high": 0,
        "low": 0
    },
    "this_limit": {
        "high": 0,
        "low": 0
    }
}
```

---

## Skip + Limit with other variables

### GraphQL Input

```graphql
query($offset: Int, $limit: Int, $title: String) {
    movies(
        options: { limit: $limit, offset: $offset }
        where: { title: $title }
    ) {
        title
    }
}
```

### GraphQL Params Input

```json
{
    "limit": 1,
    "offset": 2,
    "title": "some title"
}
```

### Expected Cypher Output

```cypher
MATCH (this:Movie)
WHERE this.title = $this_title
RETURN this { .title } as this
SKIP $this_offset
LIMIT $this_limit
```

### Expected Cypher Params

```json
{
    "this_limit": {
        "high": 0,
        "low": 1
    },
    "this_offset": {
        "high": 0,
        "low": 2
    },
    "this_title": "some title"
}
```
