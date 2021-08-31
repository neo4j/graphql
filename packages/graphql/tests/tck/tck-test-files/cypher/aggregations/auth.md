# Cypher Aggregations Count with Auth

Tests for queries using count

Schema:

```graphql
type User {
    id: ID
    name: String!
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
