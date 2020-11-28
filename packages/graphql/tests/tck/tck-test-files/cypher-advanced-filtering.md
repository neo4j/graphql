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

### Simple CONTAINS

**GraphQL input**

```graphql
{
    Movies(where: { id_CONTAINS: "123" }){
        id
    }
}
```

**Expected Cypher output**

```cypher
MATCH (this:Movie)
WHERE this.id CONTAINS $this_id_CONTAINS
RETURN this { .id } as this
```

**Expected Cypher params**

```cypher-params
{
    "this_id_CONTAINS": "123"
}
```

---

### Simple NOT_CONTAINS

**GraphQL input**

```graphql
{
    Movies(where: { id_NOT_CONTAINS: "123" }){
        id
    }
}
```

**Expected Cypher output**

```cypher
MATCH (this:Movie)
WHERE (NOT this.id CONTAINS $this_id_NOT_CONTAINS)
RETURN this { .id } as this
```

**Expected Cypher params**

```cypher-params
{
    "this_id_NOT_CONTAINS": "123"
}
```

---

### Simple STARTS_WITH

**GraphQL input**

```graphql
{
    Movies(where: { id_STARTS_WITH: "123" }){
        id
    }
}
```

**Expected Cypher output**

```cypher
MATCH (this:Movie)
WHERE this.id STARTS WITH $this_id_STARTS_WITH
RETURN this { .id } as this
```

**Expected Cypher params**

```cypher-params
{
    "this_id_STARTS_WITH": "123"
}
```

---

### Simple NOT_STARTS_WITH

**GraphQL input**

```graphql
{
    Movies(where: { id_NOT_STARTS_WITH: "123" }){
        id
    }
}
```

**Expected Cypher output**

```cypher
MATCH (this:Movie)
WHERE (NOT this.id STARTS WITH $this_id_NOT_STARTS_WITH)
RETURN this { .id } as this
```

**Expected Cypher params**

```cypher-params
{
    "this_id_NOT_STARTS_WITH": "123"
}
```

---

### Simple ENDS_WITH

**GraphQL input**

```graphql
{
    Movies(where: { id_ENDS_WITH: "123" }){
        id
    }
}
```

**Expected Cypher output**

```cypher
MATCH (this:Movie)
WHERE this.id ENDS WITH $this_id_ENDS_WITH
RETURN this { .id } as this
```

**Expected Cypher params**

```cypher-params
{
    "this_id_ENDS_WITH": "123"
}
```

---

### Simple NOT_ENDS_WITH

**GraphQL input**

```graphql
{
    Movies(where: { id_NOT_ENDS_WITH: "123" }){
        id
    }
}
```

**Expected Cypher output**

```cypher
MATCH (this:Movie)
WHERE (NOT this.id ENDS WITH $this_id_NOT_ENDS_WITH)
RETURN this { .id } as this
```

**Expected Cypher params**

```cypher-params
{
    "this_id_NOT_ENDS_WITH": "123"
}
```

---