# Cypher Fragment

Tests for queries using fragments

Schema:

```graphql
interface Entity {
    username: String!
}

type User implements Entity {
    email: String!
    username: String!
}
```

---

## Fragment On Type

### GraphQL Input

```graphql
query {
    users {
        email
        ...FragmentOnType
    }
}

fragment FragmentOnType on User {
    username
}
```

### Expected Cypher Output

```cypher
MATCH (this:User)
RETURN this { .email, .username } as this
```

### Expected Cypher Params

```json
{}
```

---

---

## Fragment On Interface

### GraphQL Input

```graphql
query {
    users {
        email
        ...FragmentOnInterface
    }
}

fragment FragmentOnInterface on Entity {
    username
}
```

### Expected Cypher Output

```cypher
MATCH (this:User)
RETURN this { .email, .username } as this
```

### Expected Cypher Params

```json
{}
```

---
