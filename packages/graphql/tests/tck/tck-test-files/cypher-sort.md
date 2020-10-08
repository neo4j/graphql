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
    FindMany_Movie(options: {sort: [id_DESC]}) {
        title
    }
}
```

**Expected Cypher output**

```cypher
MATCH (this:Movie) 
RETURN this { .title } as this
ORDER BY this.id DESC
```

**Expected Cypher params**

```cypher-params
{}
```

---

### Multi Sort

**GraphQL input**

```graphql
{
    FindMany_Movie(options: {sort: [id_DESC, title_ASC]}) {
        title
    }
}
```

**Expected Cypher output**

```cypher
MATCH (this:Movie) 
RETURN this { .title } as this
ORDER BY this.id DESC, this.title ASC
```

**Expected Cypher params**

```cypher-params
{}
```

---

### Sort with skip limit & with other variables

**GraphQL input**

```graphql
query($title: String, $skip: Int, $limit: Int, $sort: [Movie_SORT]){
    FindMany_Movie(
        options: {sort: $sort, skip: $skip, limit: $limit},
        query: {title: $title}
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
WHERE this.title = $this_title
RETURN this { .title } as this
ORDER BY this.id DESC, this.title ASC
SKIP $this_skip
LIMIT $this_limit
```

**Expected Cypher params**

```cypher-params
{
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
```
