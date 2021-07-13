# Simple Cypher tests

Simple queries with arguments and variables.

Schema:

```schema
type Movie {
    id: ID
    title: String
}
```

---

## Single selection, Movie by title

### GraphQL Input

```graphql
{
    movies(where: { title: "River Runs Through It, A" }) {
        title
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Movie)
WHERE this.title = $this_title
RETURN this { .title } as this
```

### Expected Cypher Params

```cypher-params
{ "this_title": "River Runs Through It, A" }
```

---

## Multi selection, Movie by title

### GraphQL Input

```graphql
{
    movies(where: { title: "River Runs Through It, A" }) {
        id
        title
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Movie)
WHERE this.title = $this_title
RETURN this { .id, .title } as this
```

### Expected Cypher Params

```cypher-params
{ "this_title": "River Runs Through It, A" }
```

---

## Multi selection, Movie by title via variable

### GraphQL Input

```graphql
query($title: String) {
    movies(where: { title: $title }) {
        id
        title
    }
}
```

**GraphQL params input**

```graphql-params
{ "title": "some title" }
```

### Expected Cypher Output

```cypher
MATCH (this:Movie)
WHERE this.title = $this_title
RETURN this { .id, .title } as this
```

### Expected Cypher Params

```cypher-params
{ "this_title": "some title" }
```
