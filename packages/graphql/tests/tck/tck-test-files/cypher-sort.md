## Cypher sort tests

Tests for queries including reserved arguments `sort`.

Schema:

```schema
type Movie {
    id: ID
    title: String
}
```

---

### Simple Sort

**GraphQL input**

```graphql
{
    movies(options: { sort: [id_DESC] }) {
        title
    }
}
```

**Expected Cypher output**

```cypher
MATCH (this:Movie)
WITH this
ORDER BY this.id DESC
RETURN this { .title } as this
```

**Expected Cypher params**

```cypher-params
{
    "params": {

    }
}
```

---

### Multi Sort

**GraphQL input**

```graphql
{
    movies(options: { sort: [id_DESC, title_ASC] }) {
        title
    }
}
```

**Expected Cypher output**

```cypher
MATCH (this:Movie)
WITH this
ORDER BY this.id DESC, this.title ASC
RETURN this { .title } as this
```

**Expected Cypher params**

```cypher-params
{
    "params": {

    }
}
```

---

### Sort with skip limit & with other variables

**GraphQL input**

```graphql
query($title: String, $skip: Int, $limit: Int, $sort: [MovieSort]) {
    movies(
        options: { sort: $sort, skip: $skip, limit: $limit }
        where: { title: $title }
    ) {
        title
    }
}
```

**GraphQL params input**

```graphql-params
{
    "limit": 2,
    "skip": 1,
    "title": "some title",
    "sort": ["id_DESC", "title_ASC"]
}
```

**Expected Cypher output**

```cypher
MATCH (this:Movie)
WHERE this.title = $params.this_title
WITH this
ORDER BY this.id DESC, this.title ASC
RETURN this { .title } as this
SKIP $params.this_skip
LIMIT $params.this_limit
```

**Expected Cypher params**

```cypher-params
{
    "params": {
        "this_limit": {
            "high": 0,
            "low": 2
        },
        "this_skip": {
            "high": 0,
            "low": 1
        },
        "this_title": "some title"
    }
}
```
