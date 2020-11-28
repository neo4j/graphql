## Cypher Advanced Filtering

Tests advanced filtering.

Schema:

```schema
type Movie {
    id: ID
    title: String
}
```

---

### Simple IN

**GraphQL input**

```graphql
{
    Movies(where: { id_IN: ["123"] }){
        id
    }
}
```

**Expected Cypher output**

```cypher
MATCH (this:Movie)
WHERE this.id IN $this_id_IN
RETURN this { .id } as this
```

**Expected Cypher params**

```cypher-params
{
    "this_id_IN": ["123"]
}
```

---


### Simple NOT

**GraphQL input**

```graphql
{
    Movies(where: { id_NOT: "123" }){
        id
    }
}
```

**Expected Cypher output**

```cypher
MATCH (this:Movie)
WHERE (NOT this.id = $this_id_NOT)
RETURN this { .id } as this
```

**Expected Cypher params**

```cypher-params
{
    "this_id_NOT": "123"
}
```

---

### Simple NOT_IN

**GraphQL input**

```graphql
{
    Movies(where: { id_NOT_IN: ["123"] }){
        id
    }
}
```

**Expected Cypher output**

```cypher
MATCH (this:Movie)
WHERE (NOT this.id IN $this_id_NOT_IN)
RETURN this { .id } as this
```

**Expected Cypher params**

```cypher-params
{
    "this_id_NOT_IN": ["123"]
}
```

---