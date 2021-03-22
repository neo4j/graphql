## Cypher sort tests

Tests for queries including reserved arguments `sort`.

Schema:

```schema
type Movie {
    id: ID
    title: String
    genres: [Genre] @relationship(type: "HAS_GENRE", direction: OUT)
}

type Genre {
    id: ID
    name: String
}
```

---

### Simple Sort

**GraphQL input**

```graphql
{
    movies(options: { sort: [{ id: DESC }] }) {
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
{}
```

---

### Multi Sort

**GraphQL input**

```graphql
{
    movies(options: { sort: [{ id: DESC }, { title: ASC }] }) {
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
{}
```

---

### Sort with skip limit & with other variables

**GraphQL input**

```graphql
query($title: String, $skip: Int, $limit: Int) {
    movies(
        options: {
            sort: [{ id: DESC }, { title: ASC }]
            skip: $skip
            limit: $limit
        }
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
    "title": "some title"
}
```

**Expected Cypher output**

```cypher
MATCH (this:Movie)
WHERE this.title = $this_title
WITH this
ORDER BY this.id DESC, this.title ASC
RETURN this { .title } as this
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

---

### Nested Sort DESC

**GraphQL input**

```graphql
{
    movies {
        genres(options: { sort: [{ name: DESC }] }) {
            name
        }
    }
}
```

**Expected Cypher output**

```cypher
MATCH (this:Movie)
RETURN this {
    genres: apoc.coll.sortMulti([ (this)-[:HAS_GENRE]->(this_genres:Genre) | this_genres { .name } ], ['name'])
} as this
```

**Expected Cypher params**

```cypher-params
{}
```

---

### Nested Sort ASC

**GraphQL input**

```graphql
{
    movies {
        genres(options: { sort: [{ name: ASC }] }) {
            name
        }
    }
}
```

**Expected Cypher output**

```cypher
MATCH (this:Movie)
RETURN this {
    genres: apoc.coll.sortMulti([ (this)-[:HAS_GENRE]->(this_genres:Genre) | this_genres { .name } ], ['^name'])
} as this
```

**Expected Cypher params**

```cypher-params
{}
```

---
