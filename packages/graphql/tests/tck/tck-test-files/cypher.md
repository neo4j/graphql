## Simple Cypher tests

Simple queries with arguments and variables.

Schema:

```schema
type Movie {
    id: ID
    title: String
}
```

---

### Single selection, Movie by title

**GraphQL input**

```graphql
{
    FindOne_Movie(query: {title: "River Runs Through It, A"}) {
        title
    }
}
```

**Expected Cypher output**

```cypher
MATCH (this:Movie) 
WHERE this.title = $this_title
RETURN this { .title } as this
LIMIT 1
```

**Expected Cypher params**

```cypher-params
{ "this_title": "River Runs Through It, A" }
```

---

### Multi selection, Movie by title

**GraphQL input**

```graphql
{
    FindOne_Movie(query: {title: "River Runs Through It, A"}) {
        id
        title
    }
}
```

**Expected Cypher output**

```cypher
MATCH (this:Movie) 
WHERE this.title = $this_title
RETURN this { .id, .title } as this
LIMIT 1
```

**Expected Cypher params**

```cypher-params
{ "this_title": "River Runs Through It, A" }
```

---

### Multi selection, Movie by title via variable

**GraphQL input**

```graphql
query($title: String) {
    FindOne_Movie(query: {title: $title}) {
        id
        title
    }
}
```

**GraphQL params input**

```graphql-params
{ "title": "some title" }
```

**Expected Cypher output**

```cypher
MATCH (this:Movie) 
WHERE this.title = $this_title
RETURN this { .id, .title } as this
LIMIT 1
```

**Expected Cypher params**

```cypher-params
{ "this_title": "some title" }
```
