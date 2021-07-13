# Cypher sort tests

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

## Simple Sort

### GraphQL Input

```graphql
{
    movies(options: { sort: [{ id: DESC }] }) {
        title
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Movie)
WITH this
ORDER BY this.id DESC
RETURN this { .title } as this
```

### Expected Cypher Params

```json
{}
```

---

## Multi Sort

### GraphQL Input

```graphql
{
    movies(options: { sort: [{ id: DESC }, { title: ASC }] }) {
        title
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Movie)
WITH this
ORDER BY this.id DESC, this.title ASC
RETURN this { .title } as this
```

### Expected Cypher Params

```json
{}
```

---

## Sort with offset limit & with other variables

### GraphQL Input

```graphql
query($title: String, $offset: Int, $limit: Int) {
    movies(
        options: {
            sort: [{ id: DESC }, { title: ASC }]
            offset: $offset
            limit: $limit
        }
        where: { title: $title }
    ) {
        title
    }
}
```

### GraphQL Params Input

```json
{
    "limit": 2,
    "offset": 1,
    "title": "some title"
}
```

### Expected Cypher Output

```cypher
MATCH (this:Movie)
WHERE this.title = $this_title
WITH this
ORDER BY this.id DESC, this.title ASC
RETURN this { .title } as this
SKIP $this_offset
LIMIT $this_limit
```

### Expected Cypher Params

```json
{
    "this_limit": {
        "high": 0,
        "low": 2
    },
    "this_offset": {
        "high": 0,
        "low": 1
    },
    "this_title": "some title"
}
```

---

## Nested Sort DESC

### GraphQL Input

```graphql
{
    movies {
        genres(options: { sort: [{ name: DESC }] }) {
            name
        }
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Movie)
RETURN this {
    genres: apoc.coll.sortMulti([ (this)-[:HAS_GENRE]->(this_genres:Genre) | this_genres { .name } ], ['name'])
} as this
```

### Expected Cypher Params

```json
{}
```

---

## Nested Sort ASC

### GraphQL Input

```graphql
{
    movies {
        genres(options: { sort: [{ name: ASC }] }) {
            name
        }
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Movie)
RETURN this {
    genres: apoc.coll.sortMulti([ (this)-[:HAS_GENRE]->(this_genres:Genre) | this_genres { .name } ], ['^name'])
} as this
```

### Expected Cypher Params

```json
{}
```

---
