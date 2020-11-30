## Cypher Advanced Filtering

Tests advanced filtering.

Schema:

```schema
type Movie {
    id: ID
    title: String
    actorCount: Int
    genres: [Genre] @relationship(type: "IN_GENRE", direction: "OUT")
}

type Genre {
  name: String
  movies: [Movie] @relationship(type: "IN_GENRE", direction: "IN")
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

### Simple LT

**GraphQL input**

```graphql
{
    Movies(where: { actorCount_LT: 123 }){
        actorCount
    }
}
```

**Expected Cypher output**

```cypher
MATCH (this:Movie)
WHERE this.actorCount < $this_actorCount_LT
RETURN this { .actorCount } as this
```

**Expected Cypher params**

```cypher-params
{
    "this_actorCount_LT": {
        "high": 0,
        "low": 123
    }
}
```

---

### Simple LTE

**GraphQL input**

```graphql
{
    Movies(where: { actorCount_LTE: 123 }){
        actorCount
    }
}
```

**Expected Cypher output**

```cypher
MATCH (this:Movie)
WHERE this.actorCount <= $this_actorCount_LTE
RETURN this { .actorCount } as this
```

**Expected Cypher params**

```cypher-params
{
    "this_actorCount_LTE": {
        "high": 0,
        "low": 123
    }
}
```

---


### Simple GT

**GraphQL input**

```graphql
{
    Movies(where: { actorCount_GT: 123 }){
        actorCount
    }
}
```

**Expected Cypher output**

```cypher
MATCH (this:Movie)
WHERE this.actorCount > $this_actorCount_GT
RETURN this { .actorCount } as this
```

**Expected Cypher params**

```cypher-params
{
    "this_actorCount_GT": {
        "high": 0,
        "low": 123
    }
}
```

---

### Simple GTE

**GraphQL input**

```graphql
{
    Movies(where: { actorCount_GTE: 123 }){
        actorCount
    }
}
```

**Expected Cypher output**

```cypher
MATCH (this:Movie)
WHERE this.actorCount >= $this_actorCount_GTE
RETURN this { .actorCount } as this
```

**Expected Cypher params**

```cypher-params
{
    "this_actorCount_GTE": {
        "high": 0,
        "low": 123
    }
}
```

---

### Simple Relationship equality

**GraphQL input**

```graphql
{
    Movies(where: { genres: { name: "some genre" } }){
        actorCount
    }
}
```

**Expected Cypher output**

```cypher
MATCH (this:Movie) 
WHERE EXISTS((this)-[:IN_GENRE]->(:Genre)) AND ALL(this_genres IN [(this)-[:IN_GENRE]->(this_genres:Genre) | this_genres] WHERE this_genres.name = $this_genres_name) 
RETURN this { .actorCount } as this
```

**Expected Cypher params**

```cypher-params
{
    "this_genres_name": "some genre"
}
```

---

### Simple Relationship NOT

**GraphQL input**

```graphql
{
    Movies(where: { genres_NOT: { name: "some genre" } }){
        actorCount
    }
}
```

**Expected Cypher output**

```cypher
MATCH (this:Movie) 
WHERE EXISTS((this)-[:IN_GENRE]->(:Genre)) AND NONE(this_genres_NOT IN [(this)-[:IN_GENRE]->(this_genres_NOT:Genre) | this_genres_NOT] WHERE this_genres_NOT.name = $this_genres_NOT_name) 
RETURN this { .actorCount } as this
```

**Expected Cypher params**

```cypher-params
{
    "this_genres_NOT_name": "some genre"
}
```

---

### Simple Relationship IN

**GraphQL input**

```graphql
{
    Movies(where: { genres_IN: [{ name: "first genre" }, { name: "second genre" }] }){
        actorCount
    }
}
```

**Expected Cypher output**

```cypher
MATCH (this:Movie) 
WHERE EXISTS((this)-[:IN_GENRE]->(:Genre)) AND ALL(this_genres_IN IN [(this)-[:IN_GENRE]->(this_genres_IN:Genre) | this_genres_IN] WHERE this_genres_IN.name = $this_genres_IN0_name OR this_genres_IN.name = $this_genres_IN1_name)
RETURN this { .actorCount } as this
```

**Expected Cypher params**

```cypher-params
{
    "this_genres_IN0_name": "first genre",
    "this_genres_IN1_name": "second genre"
}
```

---