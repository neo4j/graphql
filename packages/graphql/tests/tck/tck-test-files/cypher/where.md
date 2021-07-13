# Cypher WHERE

Tests for queries using options.where

Schema:

```schema
type Actor {
    name: String
    movies: [Movie] @relationship(type: "ACTED_IN", direction: OUT)
}

type Movie {
    id: ID
    title: String
    actors: [Actor] @relationship(type: "ACTED_IN", direction: IN)
    isFavorite: Boolean
}
```

---

## Simple

### GraphQL Input

```graphql
query($title: String, $isFavorite: Boolean) {
    movies(where: { title: $title, isFavorite: $isFavorite }) {
        title
    }
}
```

### GraphQL Params Input

```json
{ "title": "some title", "isFavorite": true }
```

### Expected Cypher Output

```cypher
MATCH (this:Movie)
WHERE this.title = $this_title
AND this.isFavorite = $this_isFavorite
RETURN this { .title } as this
```

### Expected Cypher Params

```json
{
    "this_title": "some title",
    "this_isFavorite": true
}
```

---

## Simple AND

### GraphQL Input

```graphql
{
    movies(where: { AND: [{ title: "some title" }] }) {
        title
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Movie)
WHERE (this.title = $this_AND_title)
RETURN this { .title } as this
```

### Expected Cypher Params

```json
{
    "this_AND_title": "some title"
}
```

---

## Nested AND

### GraphQL Input

```graphql
{
    movies(where: { AND: [{ AND: [{ title: "some title" }] }] }) {
        title
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Movie)
WHERE ((this.title = $this_AND_AND_title))
RETURN this { .title } as this
```

### Expected Cypher Params

```json
{
    "this_AND_AND_title": "some title"
}
```

---

## Super Nested AND

### GraphQL Input

```graphql
{
    movies(where: { AND: [{ AND: [{ AND: [{ title: "some title" }] }] }] }) {
        title
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Movie)
WHERE (((this.title = $this_AND_AND_AND_title)))
RETURN this { .title } as this
```

### Expected Cypher Params

```json
{
    "this_AND_AND_AND_title": "some title"
}
```

---

## Simple OR

### GraphQL Input

```graphql
{
    movies(where: { OR: [{ title: "some title" }] }) {
        title
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Movie)
WHERE (this.title = $this_OR_title)
RETURN this { .title } as this
```

### Expected Cypher Params

```json
{
    "this_OR_title": "some title"
}
```

---

## Nested OR

### GraphQL Input

```graphql
{
    movies(where: { OR: [{ OR: [{ title: "some title" }] }] }) {
        title
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Movie)
WHERE ((this.title = $this_OR_OR_title))
RETURN this { .title } as this
```

### Expected Cypher Params

```json
{
    "this_OR_OR_title": "some title"
}
```

---

## Super Nested OR

### GraphQL Input

```graphql
{
    movies(where: { OR: [{ OR: [{ OR: [{ title: "some title" }] }] }] }) {
        title
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Movie)
WHERE (((this.title = $this_OR_OR_OR_title)))
RETURN this { .title } as this
```

### Expected Cypher Params

```json
{
    "this_OR_OR_OR_title": "some title"
}
```

---

## Simple IN

### GraphQL Input

```graphql
{
    movies(where: { title_IN: ["some title"] }) {
        title
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Movie)
WHERE this.title IN $this_title_IN
RETURN this { .title } as this
```

### Expected Cypher Params

```json
{
    "this_title_IN": ["some title"]
}
```

---
