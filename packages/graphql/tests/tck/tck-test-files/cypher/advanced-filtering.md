# Cypher Advanced Filtering

Tests advanced filtering.

Schema:

```graphql
type Movie {
    _id: ID
    id: ID
    title: String
    actorCount: Int
    budget: BigInt
    genres: [Genre] @relationship(type: "IN_GENRE", direction: OUT)
}

type Genre {
    name: String
    movies: [Movie] @relationship(type: "IN_GENRE", direction: IN)
}
```

```env
NEO4J_GRAPHQL_ENABLE_REGEX=1
```

---

## IN

### GraphQL Input

```graphql
{
    movies(where: { _id_IN: ["123"] }) {
        _id
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Movie)
WHERE this._id IN $this_id_IN
RETURN this { ._id } as this
```

### Expected Cypher Params

```json
{
    "this__id_IN": ["123"]
}
``

---

## REGEX

### GraphQL Input

```graphql
{
    movies(where: { id_MATCHES: "(?i)123.*" }) {
        id
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Movie)
WHERE this.id =~ $this_id_MATCHES
RETURN this { .id } as this
```

### Expected Cypher Params

```json
{
    "this_id_MATCHES": "(?i)123.*"
}
```

---

## NOT

### GraphQL Input

```graphql
{
    movies(where: { id_NOT: "123" }) {
        id
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Movie)
WHERE (NOT this.id = $this_id_NOT)
RETURN this { .id } as this
```

### Expected Cypher Params

```json
{
    "this_id_NOT": "123"
}
```

---

## NOT_IN

### GraphQL Input

```graphql
{
    movies(where: { id_NOT_IN: ["123"] }) {
        id
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Movie)
WHERE (NOT this.id IN $this_id_NOT_IN)
RETURN this { .id } as this
```

### Expected Cypher Params

```json
{
    "this_id_NOT_IN": ["123"]
}
```

---

## CONTAINS

### GraphQL Input

```graphql
{
    movies(where: { id_CONTAINS: "123" }) {
        id
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Movie)
WHERE this.id CONTAINS $this_id_CONTAINS
RETURN this { .id } as this
```

### Expected Cypher Params

```json
{
    "this_id_CONTAINS": "123"
}
```

---

## NOT_CONTAINS

### GraphQL Input

```graphql
{
    movies(where: { id_NOT_CONTAINS: "123" }) {
        id
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Movie)
WHERE (NOT this.id CONTAINS $this_id_NOT_CONTAINS)
RETURN this { .id } as this
```

### Expected Cypher Params

```json
{
    "this_id_NOT_CONTAINS": "123"
}
```

---

## STARTS_WITH

### GraphQL Input

```graphql
{
    movies(where: { id_STARTS_WITH: "123" }) {
        id
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Movie)
WHERE this.id STARTS WITH $this_id_STARTS_WITH
RETURN this { .id } as this
```

### Expected Cypher Params

```json
{
    "this_id_STARTS_WITH": "123"
}
```

---

## NOT_STARTS_WITH

### GraphQL Input

```graphql
{
    movies(where: { id_NOT_STARTS_WITH: "123" }) {
        id
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Movie)
WHERE (NOT this.id STARTS WITH $this_id_NOT_STARTS_WITH)
RETURN this { .id } as this
```

### Expected Cypher Params

```json
{
    "this_id_NOT_STARTS_WITH": "123"
}
```

---

## ENDS_WITH

### GraphQL Input

```graphql
{
    movies(where: { id_ENDS_WITH: "123" }) {
        id
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Movie)
WHERE this.id ENDS WITH $this_id_ENDS_WITH
RETURN this { .id } as this
```

### Expected Cypher Params

```json
{
    "this_id_ENDS_WITH": "123"
}
```

---

## NOT_ENDS_WITH

### GraphQL Input

```graphql
{
    movies(where: { id_NOT_ENDS_WITH: "123" }) {
        id
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Movie)
WHERE (NOT this.id ENDS WITH $this_id_NOT_ENDS_WITH)
RETURN this { .id } as this
```

### Expected Cypher Params

```json
{
    "this_id_NOT_ENDS_WITH": "123"
}
```

---

## LT

### GraphQL Input

```graphql
{
    movies(where: { actorCount_LT: 123 }) {
        actorCount
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Movie)
WHERE this.actorCount < $this_actorCount_LT
RETURN this { .actorCount } as this
```

### Expected Cypher Params

```json
{
    "this_actorCount_LT": {
        "high": 0,
        "low": 123
    }
}
```

---

## LT BigInt

### GraphQL Input

```graphql
{
    movies(where: { budget_LT: 9223372036854775807 }) {
        budget
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Movie)
WHERE this.budget < $this_budget_LT
RETURN this { .budget } as this
```

### Expected Cypher Params

```json
{
    "this_budget_LT": {
        "low": -1,
        "high": 2147483647
    }
}
```

---

## LTE

### GraphQL Input

```graphql
{
    movies(where: { actorCount_LTE: 123 }) {
        actorCount
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Movie)
WHERE this.actorCount <= $this_actorCount_LTE
RETURN this { .actorCount } as this
```

### Expected Cypher Params

```json
{
    "this_actorCount_LTE": {
        "high": 0,
        "low": 123
    }
}
```

---

## LTE BigInt

### GraphQL Input

```graphql
{
    movies(where: { budget_LTE: 9223372036854775807 }) {
        budget
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Movie)
WHERE this.budget <= $this_budget_LTE
RETURN this { .budget } as this
```

### Expected Cypher Params

```json
{
    "this_budget_LTE": {
        "low": -1,
        "high": 2147483647
    }
}
```

---

## GT

### GraphQL Input

```graphql
{
    movies(where: { actorCount_GT: 123 }) {
        actorCount
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Movie)
WHERE this.actorCount > $this_actorCount_GT
RETURN this { .actorCount } as this
```

### Expected Cypher Params

```json
{
    "this_actorCount_GT": {
        "high": 0,
        "low": 123
    }
}
```

---

## GT BigInt

### GraphQL Input

```graphql
{
    movies(where: { budget_GT: 9223372036854775000 }) {
        budget
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Movie)
WHERE this.budget > $this_budget_GT
RETURN this { .budget } as this
```

### Expected Cypher Params

```json
{
    "this_budget_GT": {
        "low": -808,
        "high": 2147483647
    }
}
```

---

## GTE

### GraphQL Input

```graphql
{
    movies(where: { actorCount_GTE: 123 }) {
        actorCount
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Movie)
WHERE this.actorCount >= $this_actorCount_GTE
RETURN this { .actorCount } as this
```

### Expected Cypher Params

```json
{
    "this_actorCount_GTE": {
        "high": 0,
        "low": 123
    }
}
```

---

## GTE BigInt

### GraphQL Input

```graphql
{
    movies(where: { budget_GTE: 9223372036854775000 }) {
        budget
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Movie)
WHERE this.budget >= $this_budget_GTE
RETURN this { .budget } as this
```

### Expected Cypher Params

```json
{
    "this_budget_GTE": {
        "low": -808,
        "high": 2147483647
    }
}
```

---

## Relationship equality

### GraphQL Input

```graphql
{
    movies(where: { genres: { name: "some genre" } }) {
        actorCount
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Movie)
WHERE EXISTS((this)-[:IN_GENRE]->(:Genre)) AND ANY(this_genres IN [(this)-[:IN_GENRE]->(this_genres:Genre) | this_genres] WHERE this_genres.name = $this_genres_name)
RETURN this { .actorCount } as this
```

### Expected Cypher Params

```json
{
    "this_genres_name": "some genre"
}
```

---

## Relationship NOT

### GraphQL Input

```graphql
{
    movies(where: { genres_NOT: { name: "some genre" } }) {
        actorCount
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Movie)
WHERE EXISTS((this)-[:IN_GENRE]->(:Genre)) AND NONE(this_genres_NOT IN [(this)-[:IN_GENRE]->(this_genres_NOT:Genre) | this_genres_NOT] WHERE this_genres_NOT.name = $this_genres_NOT_name)
RETURN this { .actorCount } as this
```

### Expected Cypher Params

```json
{
    "this_genres_NOT_name": "some genre"
}
```

---

## Node and relationship properties equality

### GraphQL Input

```graphql
{
    movies(where: { genresConnection: { node: { name: "some genre" } } }) {
        actorCount
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Movie)
WHERE EXISTS((this)-[:IN_GENRE]->(:Genre))
AND ANY(this_genresConnection_map IN [(this)-[this_genresConnection_MovieGenresRelationship:IN_GENRE]->(this_genresConnection:Genre) | { node: this_genresConnection, relationship: this_genresConnection_MovieGenresRelationship } ]
WHERE this_genresConnection_map.node.name = $this_movies.where.genresConnection.node.name)
RETURN this { .actorCount } as this
```

### Expected Cypher Params

```json
{
    "this_movies": {
        "where": {
            "genresConnection": {
                "node": {
                    "name": "some genre"
                }
            }
        }
    }
}
```

---

## Node and relationship properties NOT

### GraphQL Input

```graphql
{
    movies(where: { genresConnection_NOT: { node: { name: "some genre" } } }) {
        actorCount
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Movie)
WHERE EXISTS((this)-[:IN_GENRE]->(:Genre))
AND NONE(this_genresConnection_NOT_map IN [(this)-[this_genresConnection_NOT_MovieGenresRelationship:IN_GENRE]->(this_genresConnection_NOT:Genre) | { node: this_genresConnection_NOT, relationship: this_genresConnection_NOT_MovieGenresRelationship } ]
WHERE this_genresConnection_NOT_map.node.name = $this_movies.where.genresConnection_NOT.node.name)
RETURN this { .actorCount } as this
```

### Expected Cypher Params

```json
{
    "this_movies": {
        "where": {
            "genresConnection_NOT": {
                "node": {
                    "name": "some genre"
                }
            }
        }
    }
}
```

---
