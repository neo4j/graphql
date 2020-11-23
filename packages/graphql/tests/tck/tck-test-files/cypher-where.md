## Cypher WHERE

Tests for queries using options.where

Schema:

```schema
type Actor {
    name: String
    movies: [Movie] @relationship(type: "ACTED_IN", direction: "OUT")
}

type Movie {
    id: ID
    title: String
    actors: [Actor] @relationship(type: "ACTED_IN", direction: "IN")
    isFavorite: Boolean
}
```

---

### Simple

**GraphQL input**

```graphql
query($title: String, $isFavorite: Boolean) {
    Movies(where: { title: $title, isFavorite: $isFavorite }) {
        title
    }
}
```

```graphql-params
{ "title": "some title", "isFavorite": true }
```

**Expected Cypher output**

```cypher
MATCH (this:Movie)
WHERE this.title = $this_title
AND this.isFavorite = $this_isFavorite
RETURN this { .title } as this
```

**Expected Cypher params**

```cypher-params
{
    "this_title": "some title",
    "this_isFavorite": true
}
```

---

### Simple AND

**GraphQL input**

```graphql
{
    Movies(where: { AND: [{ title: "some title" }] }) {
        title
    }
}
```

**Expected Cypher output**

```cypher
MATCH (this:Movie)
WHERE (this.title = $this_AND_title)
RETURN this { .title } as this
```

**Expected Cypher params**

```cypher-params
{
    "this_AND_title": "some title"
}
```

---

### Nested AND

**GraphQL input**

```graphql
{
    Movies(where: { AND: [{ AND: [{ title: "some title" }] }] }) {
        title
    }
}
```

**Expected Cypher output**

```cypher
MATCH (this:Movie)
WHERE ((this.title = $this_AND_AND_title))
RETURN this { .title } as this
```

**Expected Cypher params**

```cypher-params
{
    "this_AND_AND_title": "some title"
}
```

---

### Super Nested AND

**GraphQL input**

```graphql
{
    Movies(where: { AND: [{ AND: [{ AND: [{ title: "some title" }] }] }] }) {
        title
    }
}
```

**Expected Cypher output**

```cypher
MATCH (this:Movie)
WHERE (((this.title = $this_AND_AND_AND_title)))
RETURN this { .title } as this
```

**Expected Cypher params**

```cypher-params
{
    "this_AND_AND_AND_title": "some title"
}
```

---

### Simple OR

**GraphQL input**

```graphql
{
    Movies(where: { OR: [{ title: "some title" }] }) {
        title
    }
}
```

**Expected Cypher output**

```cypher
MATCH (this:Movie)
WHERE (this.title = $this_OR_title)
RETURN this { .title } as this
```

**Expected Cypher params**

```cypher-params
{
    "this_OR_title": "some title"
}
```

---

### Nested OR

**GraphQL input**

```graphql
{
    Movies(where: { OR: [{ OR: [{ title: "some title" }] }] }) {
        title
    }
}
```

**Expected Cypher output**

```cypher
MATCH (this:Movie)
WHERE ((this.title = $this_OR_OR_title))
RETURN this { .title } as this
```

**Expected Cypher params**

```cypher-params
{
    "this_OR_OR_title": "some title"
}
```

---

### Super Nested OR

**GraphQL input**

```graphql
{
    Movies(where: { OR: [{ OR: [{ OR: [{ title: "some title" }] }] }] }) {
        title
    }
}
```

**Expected Cypher output**

```cypher
MATCH (this:Movie)
WHERE (((this.title = $this_OR_OR_OR_title)))
RETURN this { .title } as this
```

**Expected Cypher params**

```cypher-params
{
    "this_OR_OR_OR_title": "some title"
}
```

---

### Simple IN

**GraphQL input**

```graphql
{
    Movies(where: { title_IN: ["some title"] }) {
        title
    }
}
```

**Expected Cypher output**

```cypher
MATCH (this:Movie)
WHERE this.title IN $this_title_IN
RETURN this { .title } as this
```

**Expected Cypher params**

```cypher-params
{
    "this_title_IN": ["some title"]
}
```

---
