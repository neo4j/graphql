## Cypher pagination tests

Tests for queries including reserved arguments `skip` and `limit`.

Schema:

```schema
type Movie {
    id: ID
    title: String
}

type Query {
    Movie(title: String, skip: Int, limit: Int): Movie
}
```

---

### Skipping

**GraphQL input**

```graphql
{
    Movie(skip: 1) {
        id
        title
    }
}
```

**Expected Cypher output**

```cypher
MATCH (`movie`:`Movie`)
RETURN `movie` { .id, .title } AS `movie`
SKIP $skip
```

**Expected Cypher params**

```cypher-params
{
    "skip": 1
}
```

---

### Limit

**GraphQL input**

```graphql
{
    Movie(limit: 1) {
        id
        title
    }
}
```

**Expected Cypher output**

```cypher
MATCH (`movie`:`Movie`)
RETURN `movie` { .id, .title } AS `movie`
LIMIT $limit
```

**Expected Cypher params**

```cypher-params
{
    "limit": 1
}
```

---

### Skip + Limit

**GraphQL input**

```graphql
{
    Movie(limit: 2, skip: 1) {
        id
        title
    }
}
```

**Expected Cypher output**

```cypher
MATCH (`movie`:`Movie`)
RETURN `movie` { .id, .title } AS `movie`
SKIP $skip
LIMIT $limit
```

**Expected Cypher params**

```cypher-params
{
    "limit": 2,
    "skip": 1
}
```

---

### Skip + Limit as variables

**GraphQL input**

```graphql
query($skip: Int, $limit: Int) {
    Movie(skip: $skip, limit: $limit) {
        id
        title
    }
}
```

**GraphQL params input**

```graphql-params
{
    "limit": 2,
    "skip": 1
}
```

**Expected Cypher output**

```cypher
MATCH (`movie`:`Movie`)
RETURN `movie` { .id, .title } AS `movie`
SKIP $skip
LIMIT $limit
```

**Expected Cypher params**

```cypher-params
{
    "limit": 2,
    "skip": 1
}
```

---

### Skip + Limit with other variables

**GraphQL input**

```graphql
query($title: String, $skip: Int, $limit: Int) {
    Movie(title: $title, skip: $skip, limit: $limit) {
        id
        title
    }
}
```

**GraphQL params input**

```graphql-params
{
    "limit": 2,
    "skip": 1,
    "title": "some title"
}
```

**Expected Cypher output**

```cypher
MATCH (`movie`:`Movie` { `title`:$title })
RETURN `movie` { .id, .title } AS `movie`
SKIP $skip
LIMIT $limit
```

**Expected Cypher params**

```cypher-params
{
    "limit": 2,
    "skip": 1,
    "title": "some title"
}
```
