## Cypher Advanced Filtering

Tests advanced filtering.

Schema:

```schema
type Movie {
    _id: ID
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

### IN

**GraphQL input**

```graphql
{
    movies(where: { _id_IN: ["123"] }) {
        _id
    }
}
```

**Expected Cypher output**

```cypher
MATCH (this:Movie)
WHERE this._id IN $params.this__id_IN
RETURN this { ._id } as this
```

**Expected Cypher params**

```cypher-params
{
    "params": {
        "this__id_IN": ["123"]
    }
}
```

---

### REGEX

**GraphQL input**

```graphql
{
    movies(where: { id_REGEX: "(?i)123.*" }) {
        id
    }
}
```

**Expected Cypher output**

```cypher
MATCH (this:Movie)
WHERE this.id =~ $params.this_id_REGEX
RETURN this { .id } as this
```

**Expected Cypher params**

```cypher-params
{
    "params": {
        "this_id_REGEX": "(?i)123.*"
    }
}
```

---

### NOT

**GraphQL input**

```graphql
{
    movies(where: { id_NOT: "123" }) {
        id
    }
}
```

**Expected Cypher output**

```cypher
MATCH (this:Movie)
WHERE (NOT this.id = $params.this_id_NOT)
RETURN this { .id } as this
```

**Expected Cypher params**

```cypher-params
{
    "params": {
        "this_id_NOT": "123"
    }
}
```

---

### NOT_IN

**GraphQL input**

```graphql
{
    movies(where: { id_NOT_IN: ["123"] }) {
        id
    }
}
```

**Expected Cypher output**

```cypher
MATCH (this:Movie)
WHERE (NOT this.id IN $params.this_id_NOT_IN)
RETURN this { .id } as this
```

**Expected Cypher params**

```cypher-params
{
    "params": {
        "this_id_NOT_IN": ["123"]
    }
}
```

---

### CONTAINS

**GraphQL input**

```graphql
{
    movies(where: { id_CONTAINS: "123" }) {
        id
    }
}
```

**Expected Cypher output**

```cypher
MATCH (this:Movie)
WHERE this.id CONTAINS $params.this_id_CONTAINS
RETURN this { .id } as this
```

**Expected Cypher params**

```cypher-params
{
    "params": {
        "this_id_CONTAINS": "123"
    }
}
```

---

### NOT_CONTAINS

**GraphQL input**

```graphql
{
    movies(where: { id_NOT_CONTAINS: "123" }) {
        id
    }
}
```

**Expected Cypher output**

```cypher
MATCH (this:Movie)
WHERE (NOT this.id CONTAINS $params.this_id_NOT_CONTAINS)
RETURN this { .id } as this
```

**Expected Cypher params**

```cypher-params
{
    "params": {
        "this_id_NOT_CONTAINS": "123"
    }
}
```

---

### STARTS_WITH

**GraphQL input**

```graphql
{
    movies(where: { id_STARTS_WITH: "123" }) {
        id
    }
}
```

**Expected Cypher output**

```cypher
MATCH (this:Movie)
WHERE this.id STARTS WITH $params.this_id_STARTS_WITH
RETURN this { .id } as this
```

**Expected Cypher params**

```cypher-params
{
    "params": {
        "this_id_STARTS_WITH": "123"
    }
}
```

---

### NOT_STARTS_WITH

**GraphQL input**

```graphql
{
    movies(where: { id_NOT_STARTS_WITH: "123" }) {
        id
    }
}
```

**Expected Cypher output**

```cypher
MATCH (this:Movie)
WHERE (NOT this.id STARTS WITH $params.this_id_NOT_STARTS_WITH)
RETURN this { .id } as this
```

**Expected Cypher params**

```cypher-params
{
    "params": {
        "this_id_NOT_STARTS_WITH": "123"
    }
}
```

---

### ENDS_WITH

**GraphQL input**

```graphql
{
    movies(where: { id_ENDS_WITH: "123" }) {
        id
    }
}
```

**Expected Cypher output**

```cypher
MATCH (this:Movie)
WHERE this.id ENDS WITH $params.this_id_ENDS_WITH
RETURN this { .id } as this
```

**Expected Cypher params**

```cypher-params
{
    "params": {
        "this_id_ENDS_WITH": "123"
    }
}
```

---

### NOT_ENDS_WITH

**GraphQL input**

```graphql
{
    movies(where: { id_NOT_ENDS_WITH: "123" }) {
        id
    }
}
```

**Expected Cypher output**

```cypher
MATCH (this:Movie)
WHERE (NOT this.id ENDS WITH $params.this_id_NOT_ENDS_WITH)
RETURN this { .id } as this
```

**Expected Cypher params**

```cypher-params
{
    "params": {
        "this_id_NOT_ENDS_WITH": "123"
    }
}
```

---

### LT

**GraphQL input**

```graphql
{
    movies(where: { actorCount_LT: 123 }) {
        actorCount
    }
}
```

**Expected Cypher output**

```cypher
MATCH (this:Movie)
WHERE this.actorCount < $params.this_actorCount_LT
RETURN this { .actorCount } as this
```

**Expected Cypher params**

```cypher-params
{
    "params": {
        "this_actorCount_LT": {
            "high": 0,
            "low": 123
        }
    }
}
```

---

### LTE

**GraphQL input**

```graphql
{
    movies(where: { actorCount_LTE: 123 }) {
        actorCount
    }
}
```

**Expected Cypher output**

```cypher
MATCH (this:Movie)
WHERE this.actorCount <= $params.this_actorCount_LTE
RETURN this { .actorCount } as this
```

**Expected Cypher params**

```cypher-params
{
    "params": {
        "this_actorCount_LTE": {
            "high": 0,
            "low": 123
        }
    }
}
```

---

### GT

**GraphQL input**

```graphql
{
    movies(where: { actorCount_GT: 123 }) {
        actorCount
    }
}
```

**Expected Cypher output**

```cypher
MATCH (this:Movie)
WHERE this.actorCount > $params.this_actorCount_GT
RETURN this { .actorCount } as this
```

**Expected Cypher params**

```cypher-params
{
    "params": {
        "this_actorCount_GT": {
            "high": 0,
            "low": 123
        }
    }
}
```

---

### GTE

**GraphQL input**

```graphql
{
    movies(where: { actorCount_GTE: 123 }) {
        actorCount
    }
}
```

**Expected Cypher output**

```cypher
MATCH (this:Movie)
WHERE this.actorCount >= $params.this_actorCount_GTE
RETURN this { .actorCount } as this
```

**Expected Cypher params**

```cypher-params
{
    "params": {
        "this_actorCount_GTE": {
            "high": 0,
            "low": 123
        }
    }
}
```

---

### Relationship equality

**GraphQL input**

```graphql
{
    movies(where: { genres: { name: "some genre" } }) {
        actorCount
    }
}
```

**Expected Cypher output**

```cypher
MATCH (this:Movie)
WHERE EXISTS((this)-[:IN_GENRE]->(:Genre)) AND ALL(this_genres IN [(this)-[:IN_GENRE]->(this_genres:Genre) | this_genres] WHERE this_genres.name = $params.this_genres_name)
RETURN this { .actorCount } as this
```

**Expected Cypher params**

```cypher-params
{
    "params": {
        "this_genres_name": "some genre"
    }
}
```

---

### Relationship NOT

**GraphQL input**

```graphql
{
    movies(where: { genres_NOT: { name: "some genre" } }) {
        actorCount
    }
}
```

**Expected Cypher output**

```cypher
MATCH (this:Movie)
WHERE EXISTS((this)-[:IN_GENRE]->(:Genre)) AND NONE(this_genres_NOT IN [(this)-[:IN_GENRE]->(this_genres_NOT:Genre) | this_genres_NOT] WHERE this_genres_NOT.name = $params.this_genres_NOT_name)
RETURN this { .actorCount } as this
```

**Expected Cypher params**

```cypher-params
{
    "params": {
        "this_genres_NOT_name": "some genre"
    }
}
```

---

### Relationship IN

**GraphQL input**

```graphql
{
    movies(
        where: {
            genres_IN: [{ name: "first genre" }, { name: "second genre" }]
        }
    ) {
        actorCount
    }
}
```

**Expected Cypher output**

```cypher
MATCH (this:Movie)
WHERE EXISTS((this)-[:IN_GENRE]->(:Genre)) AND ALL(this_genres_IN IN [(this)-[:IN_GENRE]->(this_genres_IN:Genre) | this_genres_IN] WHERE this_genres_IN.name = $params.this_genres_IN0_name OR this_genres_IN.name = $params.this_genres_IN1_name)
RETURN this { .actorCount } as this
```

**Expected Cypher params**

```cypher-params
{
    "params": {
        "this_genres_IN0_name": "first genre",
        "this_genres_IN1_name": "second genre"
    }
}
```

---

## Relationship NOT_IN

**GraphQL input**

```graphql
{
    movies(where: { genres_NOT_IN: [{ name: "some genre" }] }) {
        actorCount
    }
}
```

**Expected Cypher output**

```cypher
MATCH (this:Movie)
WHERE EXISTS((this)-[:IN_GENRE]->(:Genre)) AND ALL(this_genres_NOT_IN IN [(this)-[:IN_GENRE]->(this_genres_NOT_IN:Genre) | this_genres_NOT_IN] WHERE NOT(this_genres_NOT_IN.name = $params.this_genres_NOT_IN0_name))
RETURN this { .actorCount } as this
```

**Expected Cypher params**

```cypher-params
{
    "params": {
        "this_genres_NOT_IN0_name": "some genre"
    }
}
```

---
