# Cypher Fragment

Tests for queries using fragments

Schema:

```graphql
interface Entity {
    username: String!
}

type User implements Entity {
    id: ID! @id
    username: String!
    owns: [OwnableType!]! @relationship(type: "OWNS", direction: OUT)
}

union OwnableType = Tile | Character

interface Ownable {
    id: ID!
    owner: User
}

type Tile implements Ownable {
    id: ID! @id
    owner: User @relationship(type: "OWNS", direction: IN)
}

type Character implements Ownable {
    id: ID! @id
    owner: User @relationship(type: "OWNS", direction: IN)
}
```

---

## Fragment On Type

### GraphQL Input

```graphql
query {
    users {
        id
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
RETURN this { .id, .username } as this
```

### Expected Cypher Params

```json
{}
```

---

## Fragment On Union

### GraphQL Input

```graphql
query users {
    users {
        id
        owns {
            __typename
            ... on Ownable {
                id
            }
        }
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:User)
RETURN this { .id, owns: [this_owns IN [(this)-[:OWNS]->(this_owns) WHERE ("Tile" IN labels(this_owns)) OR ("Character" IN labels(this_owns)) | head( [ this_owns IN [this_owns] WHERE ("Tile" IN labels(this_owns)) | this_owns { __resolveType: "Tile", .id } ] + [ this_owns IN [this_owns] WHERE ("Character" IN labels(this_owns)) | this_owns { __resolveType: "Character", .id } ] ) ] WHERE this_owns IS NOT NULL] } as this
```

### Expected Cypher Params

```json
{}
```

---

## Fragment On Interface

### GraphQL Input

```graphql
query {
    users {
        id
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
RETURN this { .id, .username } as this
```

### Expected Cypher Params

```json
{}
```

---
