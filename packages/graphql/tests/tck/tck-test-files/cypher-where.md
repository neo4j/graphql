## Cypher WHERE

Tests for queries using options.query

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
}
```

---

### Simple

**GraphQL input**

```graphql
{
    FindMany_Movie(query: {title: "some title"}) {
        title
    }
}
```

**Expected Cypher output**

```cypher
MATCH (this:Movie)
WHERE this.title = $this_title
RETURN this { .title } as this
```

**Expected Cypher params**

```cypher-params
{
    "this_title": "some title"
}
```

---

### Simple AND

**GraphQL input**

```graphql
{
    FindMany_Movie(query: {_AND: [{title: "some title"}]}) {
        title
    }
}
```

**Expected Cypher output**

```cypher
MATCH (this:Movie) 
WHERE (this.title = $this__AND_title) 
RETURN this { .title } as this
```

**Expected Cypher params**

```cypher-params
{
    "this__AND_title": "some title"
}
```

---

### Nested AND

**GraphQL input**

```graphql
{
    FindMany_Movie(query: {_AND: [{_AND:[{title: "some title"}]}]}) {
        title
    }
}
```

**Expected Cypher output**

```cypher
MATCH (this:Movie) 
WHERE ((this.title = $this__AND__AND_title)) 
RETURN this { .title } as this
```

**Expected Cypher params**

```cypher-params
{
    "this__AND__AND_title": "some title"
}
```

---

### Super Nested AND

**GraphQL input**

```graphql
{
    FindMany_Movie(query: {_AND: [{_AND:[{_AND: [{title: "some title"}]}]}]}) {
        title
    }
}
```

**Expected Cypher output**

```cypher
MATCH (this:Movie) 
WHERE (((this.title = $this__AND__AND__AND_title)))
RETURN this { .title } as this
```

**Expected Cypher params**

```cypher-params
{
    "this__AND__AND__AND_title": "some title"
}
```

---

### Simple OR

**GraphQL input**

```graphql
{
    FindMany_Movie(query: {_OR: [{title: "some title"}]}) {
        title
    }
}
```

**Expected Cypher output**

```cypher
MATCH (this:Movie) 
WHERE (this.title = $this__OR_title) 
RETURN this { .title } as this
```

**Expected Cypher params**

```cypher-params
{
    "this__OR_title": "some title"
}
```

---

### Nested OR

**GraphQL input**

```graphql
{
    FindMany_Movie(query: {_OR: [{_OR:[{title: "some title"}]}]}) {
        title
    }
}
```

**Expected Cypher output**

```cypher
MATCH (this:Movie) 
WHERE ((this.title = $this__OR__OR_title)) 
RETURN this { .title } as this
```

**Expected Cypher params**

```cypher-params
{
    "this__OR__OR_title": "some title"
}
```

---

### Super Nested OR

**GraphQL input**

```graphql
{
    FindMany_Movie(query: {_OR: [{_OR:[{_OR: [{title: "some title"}]}]}]}) {
        title
    }
}
```

**Expected Cypher output**

```cypher
MATCH (this:Movie) 
WHERE (((this.title = $this__OR__OR__OR_title)))
RETURN this { .title } as this
```

**Expected Cypher params**

```cypher-params
{
    "this__OR__OR__OR_title": "some title"
}
```

---

### Simple IN

**GraphQL input**

```graphql
{
    FindMany_Movie(query: {title_IN: ["some title"]}) {
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