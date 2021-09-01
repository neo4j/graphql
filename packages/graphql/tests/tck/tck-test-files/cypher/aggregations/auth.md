# Cypher Aggregations Count with Auth

Tests for queries using count

Schema:

```graphql
type User {
    id: ID
    name: String!
    imdbRatingInt: Int! @auth(rules: [{ allow: { id: "$jwt.sub" } }])
    imdbRatingFloat: Float! @auth(rules: [{ allow: { id: "$jwt.sub" } }])
    imdbRatingBigInt: BigInt! @auth(rules: [{ allow: { id: "$jwt.sub" } }])
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
WITH count(this) AS thisCount
WITH thisCount
RETURN { count: thisCount }
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
WITH count(this) AS thisCount
WITH thisCount
RETURN { count: thisCount }
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
WITH min(this.imdbRatingInt) AS minimdbRatingInt, max(this.imdbRatingInt) AS maximdbRatingInt
WITH minimdbRatingInt, maximdbRatingInt
RETURN { imdbRatingInt: { min: minimdbRatingInt,max: maximdbRatingInt } }
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
WITH min(this.imdbRatingFloat) AS minimdbRatingFloat, max(this.imdbRatingFloat) AS maximdbRatingFloat
WITH minimdbRatingFloat, maximdbRatingFloat
RETURN { imdbRatingFloat: { min: minimdbRatingFloat,max: maximdbRatingFloat } }
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
CALL apoc.util.validate(NOT(this.id IS NOT NULL AND this.id = $imdbRatingBigInt_auth_allow0_id), "@neo4j/graphql/FORBIDDEN", [0])
WITH min(this.imdbRatingBigInt) AS minimdbRatingBigInt, max(this.imdbRatingBigInt) AS maximdbRatingBigInt
WITH minimdbRatingBigInt, maximdbRatingBigInt
RETURN { imdbRatingBigInt: { min: minimdbRatingBigInt,max: maximdbRatingBigInt } }
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
