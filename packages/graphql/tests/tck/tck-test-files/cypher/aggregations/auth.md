# Cypher Aggregations with Auth

Tests for queries using aggregations and auth

Schema:

```graphql
type User {
    id: ID @auth(rules: [{ allow: { id: "$jwt.sub" } }])
    name: String! @auth(rules: [{ allow: { id: "$jwt.sub" } }])
    imdbRatingInt: Int! @auth(rules: [{ allow: { id: "$jwt.sub" } }])
    imdbRatingFloat: Float! @auth(rules: [{ allow: { id: "$jwt.sub" } }])
    imdbRatingBigInt: BigInt! @auth(rules: [{ allow: { id: "$jwt.sub" } }])
    createdAt: DateTime @auth(rules: [{ allow: { id: "$jwt.sub" } }])
}

extend type User
    @auth(rules: [{ allow: { id: "$jwt.sub" }, where: { id: "$jwt.sub" } }])
```

---

## Simple Count

### GraphQL Input

```graphql
{
    usersAggregate {
        count
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:User)
WHERE this.id IS NOT NULL AND this.id = $this_auth_where0_id
CALL apoc.util.validate(NOT(this.id IS NOT NULL AND this.id = $this_auth_allow0_id), "@neo4j/graphql/FORBIDDEN", [0])
RETURN { count: count(this) }
```

### Expected Cypher Params

```json
{
    "this_auth_allow0_id": "super_admin",
    "this_auth_where0_id": "super_admin"
}
```

### JWT Object

```json
{
    "sub": "super_admin"
}
```

---

## Count with WHERE

### GraphQL Input

```graphql
{
    usersAggregate(where: { name: "some-name" }) {
        count
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:User)
WHERE this.name = $this_name AND this.id IS NOT NULL AND this.id = $this_auth_where0_id
CALL apoc.util.validate(NOT(this.id IS NOT NULL AND this.id = $this_auth_allow0_id), "@neo4j/graphql/FORBIDDEN", [0])
RETURN { count: count(this) }
```

### Expected Cypher Params

```json
{
    "this_name": "some-name",
    "this_auth_allow0_id": "super_admin",
    "this_auth_where0_id": "super_admin"
}
```

### JWT Object

```json
{
    "sub": "super_admin"
}
```

---

## Field Int with auth

### GraphQL Input

```graphql
{
    usersAggregate {
        imdbRatingInt {
            min
            max
        }
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:User)
WHERE this.id IS NOT NULL AND this.id = $this_auth_where0_id
CALL apoc.util.validate(NOT(this.id IS NOT NULL AND this.id = $this_auth_allow0_id), "@neo4j/graphql/FORBIDDEN", [0])
CALL apoc.util.validate(NOT(this.id IS NOT NULL AND this.id = $imdbRatingInt_auth_allow0_id), "@neo4j/graphql/FORBIDDEN", [0])
RETURN { imdbRatingInt: { min: min(this.imdbRatingInt), max: max(this.imdbRatingInt) } }
```

### Expected Cypher Params

```json
{
    "imdbRatingInt_auth_allow0_id": "super_admin",
    "this_auth_allow0_id": "super_admin",
    "this_auth_where0_id": "super_admin"
}
```

### JWT Object

```json
{
    "sub": "super_admin"
}
```

---

## Field Float with auth

### GraphQL Input

```graphql
{
    usersAggregate {
        imdbRatingFloat {
            min
            max
        }
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:User)
WHERE this.id IS NOT NULL AND this.id = $this_auth_where0_id
CALL apoc.util.validate(NOT(this.id IS NOT NULL AND this.id = $this_auth_allow0_id), "@neo4j/graphql/FORBIDDEN", [0])
CALL apoc.util.validate(NOT(this.id IS NOT NULL AND this.id = $imdbRatingFloat_auth_allow0_id), "@neo4j/graphql/FORBIDDEN", [0])
RETURN { imdbRatingFloat: { min: min(this.imdbRatingFloat), max: max(this.imdbRatingFloat) } }
```

### Expected Cypher Params

```json
{
    "imdbRatingFloat_auth_allow0_id": "super_admin",
    "this_auth_allow0_id": "super_admin",
    "this_auth_where0_id": "super_admin"
}
```

### JWT Object

```json
{
    "sub": "super_admin"
}
```

---

## Field BigInt with auth

### GraphQL Input

```graphql
{
    usersAggregate {
        imdbRatingBigInt {
            min
            max
        }
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:User)
WHERE this.id IS NOT NULL AND this.id = $this_auth_where0_id
CALL apoc.util.validate(NOT(this.id IS NOT NULL AND this.id = $this_auth_allow0_id), "@neo4j/graphql/FORBIDDEN", [0])
CALL apoc.util.validate(NOT(this.id IS NOT NULL AND this.id = $imdbRatingBigInt_auth_allow0_id), "@neo4j/graphql/FORBIDDEN", [0]) RETURN { imdbRatingBigInt: { min: min(this.imdbRatingBigInt), max: max(this.imdbRatingBigInt) } }
```

### Expected Cypher Params

```json
{
    "imdbRatingBigInt_auth_allow0_id": "super_admin",
    "this_auth_allow0_id": "super_admin",
    "this_auth_where0_id": "super_admin"
}
```

### JWT Object

```json
{
    "sub": "super_admin"
}
```

---

## Field ID with auth

### GraphQL Input

```graphql
{
    usersAggregate {
        id {
            shortest
            longest
        }
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:User)
WHERE this.id IS NOT NULL AND this.id = $this_auth_where0_id
CALL apoc.util.validate(NOT(this.id IS NOT NULL AND this.id = $this_auth_allow0_id), "@neo4j/graphql/FORBIDDEN", [0])
CALL apoc.util.validate(NOT(this.id IS NOT NULL AND this.id = $id_auth_allow0_id), "@neo4j/graphql/FORBIDDEN", [0])
RETURN { id: { shortest: min(this.id), longest: max(this.id) } }
```

### Expected Cypher Params

```json
{
    "id_auth_allow0_id": "super_admin",
    "this_auth_allow0_id": "super_admin",
    "this_auth_where0_id": "super_admin"
}
```

### JWT Object

```json
{
    "sub": "super_admin"
}
```

---

## Field String with auth

### GraphQL Input

```graphql
{
    usersAggregate {
        name {
            shortest
            longest
        }
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:User)
WHERE this.id IS NOT NULL AND this.id = $this_auth_where0_id
CALL apoc.util.validate(NOT(this.id IS NOT NULL AND this.id = $this_auth_allow0_id), "@neo4j/graphql/FORBIDDEN", [0])
CALL apoc.util.validate(NOT(this.id IS NOT NULL AND this.id = $name_auth_allow0_id), "@neo4j/graphql/FORBIDDEN", [0])
RETURN { name: { shortest: min(this.name), longest: max(this.name) } }
```

### Expected Cypher Params

```json
{
    "name_auth_allow0_id": "super_admin",
    "this_auth_allow0_id": "super_admin",
    "this_auth_where0_id": "super_admin"
}
```

### JWT Object

```json
{
    "sub": "super_admin"
}
```

---

## Field DateTime with auth

### GraphQL Input

```graphql
{
    usersAggregate {
        createdAt {
            min
            max
        }
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:User)
WHERE this.id IS NOT NULL AND this.id = $this_auth_where0_id
CALL apoc.util.validate(NOT(this.id IS NOT NULL AND this.id = $this_auth_allow0_id), "@neo4j/graphql/FORBIDDEN", [0])
CALL apoc.util.validate(NOT(this.id IS NOT NULL AND this.id = $createdAt_auth_allow0_id), "@neo4j/graphql/FORBIDDEN", [0])
RETURN { createdAt: { min: apoc.date.convertFormat(toString(min(this.createdAt)), "iso_zoned_date_time", "iso_offset_date_time"), max: apoc.date.convertFormat(toString(max(this.createdAt)), "iso_zoned_date_time", "iso_offset_date_time") } }
```

### Expected Cypher Params

```json
{
    "createdAt_auth_allow0_id": "super_admin",
    "this_auth_allow0_id": "super_admin",
    "this_auth_where0_id": "super_admin"
}
```

### JWT Object

```json
{
    "sub": "super_admin"
}
```

---
