## Cypher Auth Allow

Tests auth allow operations

Schema:

```schema
type Post {
    content: String
    creator: User @relationship(type: "HAS_POST", direction: "IN")
}

type User {
    id: ID
    name: String
    posts: [Post] @relationship(type: "HAS_POST", direction: "OUT")
}

extend type User @auth(rules: [{ operations: ["read"], allow: { id: "sub" } }])

extend type Post
    @auth(rules: [{ operations: ["read"], allow: { creator: { id: "sub" } } }])
```

---

### Read Node

**GraphQL input**

```graphql
{
    users {
        id
    }
}
```

**Expected Cypher output**

```cypher
MATCH (this:User)
CALL apoc.util.validate(NOT(this.id = $this_auth_allow_id), "Forbidden", [0])
RETURN this { .id } as this
```

**Expected Cypher params**

```cypher-params
{
    "this_auth_allow_id": "id-01"
}
```

**JWT Object**

```jwt
{
    "sub": "id-01",
    "roles": ["admin"]
}
```

---

### Read & Relationship

**GraphQL input**

```graphql
{
    users {
        id
        posts {
            content
        }
    }
}
```

**Expected Cypher output**

```cypher
MATCH (this:User)
CALL apoc.util.validate(NOT(this.id = $this_auth_allow_id), "Forbidden", [0])
RETURN this {
    .id,
    posts: [ (this)-[:HAS_POST]->(this_posts:Post) WHERE apoc.util.validatePredicate(NOT(EXISTS((this_posts)<-[:HAS_POST]-(:User)) AND ANY(creator IN [(this_posts)<-[:HAS_POST]-(creator:User) | creator] WHERE creator.id = $this_posts_auth_allow_creator_id)), "Forbidden", [0]) | this_posts { .content } ]
} as this
```

**Expected Cypher params**

```cypher-params
{
    "this_auth_allow_id": "id-01",
    "this_posts_auth_allow_creator_id": "id-01"
}
```

**JWT Object**

```jwt
{
    "sub": "id-01",
    "roles": ["admin"]
}
```

---
