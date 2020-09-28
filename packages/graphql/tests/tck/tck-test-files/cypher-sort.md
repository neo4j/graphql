## Cypher sort tests

Tests for queries including reserved arguments `sort`.

Schema:

```schema
type Movie {
    id: ID
    title: String
}

enum Movie_SORT {
    id_DESC
    id_ASC
    title_DESC
    title_ASC
}

type Query {
    Movie(title: String, skip: Int, limit: Int, sort: [Movie_SORT]): Movie
}
```

---

### Simple Sort

**GraphQL input**

```graphql
{
    Movie(sort: [id_DESC]) {
        id
        title
    }
}
```

**Expected Cypher output**

```cypher
MATCH (`movie`:`Movie`)
RETURN `movie` { .id, .title } AS `movie`
ORDER BY `movie`.id DESC
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
    Movie(sort: [id_DESC, title_ASC]) {
        id
        title
    }
}
```

**Expected Cypher output**

```cypher
MATCH (`movie`:`Movie`)
RETURN `movie` { .id, .title } AS `movie`
ORDER BY `movie`.id DESC, `movie`.title ASC
```

**Expected Cypher params**

```cypher-params
{}
```

---

### Sort with skip limit & with other variables

**GraphQL input**

```graphql
query($title: String, $skip: Int, $limit: Int, $sort: [Movie_SORT]) {
    Movie(title: $title, skip: $skip, limit: $limit, sort: $sort) {
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
    "title": "some title",
    "sort": ["id_DESC", "title_ASC"]
}
```

**Expected Cypher output**

```cypher
MATCH (`movie`:`Movie` { `title`:$title })
RETURN `movie` { .id, .title } AS `movie`
ORDER BY `movie`.id DESC, `movie`.title ASC
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
