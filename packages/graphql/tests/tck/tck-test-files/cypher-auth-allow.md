## Cypher Auth Allow

Tests auth allow operations

Schema:

```schema
type Comment {
    id: ID
    content: String
    creator: User @relationship(type: "HAS_COMMENT", direction: "IN")
}

type Post {
    id: ID
    content: String
    creator: User @relationship(type: "HAS_POST", direction: "IN")
    comments: [Comment] @relationship(type: "HAS_COMMENT", direction: "OUT")

}

type User {
    id: ID
    name: String
    posts: [Post] @relationship(type: "HAS_POST", direction: "OUT")
}

extend type User @auth(rules: [{ operations: ["read"], allow: { id: "sub" } }])

extend type Post
    @auth(rules: [{ operations: ["read"], allow: { creator: { id: "sub" } } }])

extend type Comment
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
CALL apoc.util.validate(NOT(this.id = $this_auth_allow0_id), "Forbidden", [0])
RETURN this { .id } as this
```

**Expected Cypher params**

```cypher-params
{
    "this_auth_allow0_id": "id-01"
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
CALL apoc.util.validate(NOT(this.id = $this_auth_allow0_id), "Forbidden", [0])
RETURN this {
    .id,
    posts: [ (this)-[:HAS_POST]->(this_posts:Post) WHERE apoc.util.validatePredicate(NOT(EXISTS((this_posts)<-[:HAS_POST]-(:User)) AND ANY(creator IN [(this_posts)<-[:HAS_POST]-(creator:User) | creator] WHERE creator.id = $this_posts_auth_allow0_creator_id)), "Forbidden", [0]) | this_posts { .content } ]
} as this
```

**Expected Cypher params**

```cypher-params
{
    "this_auth_allow0_id": "id-01",
    "this_posts_auth_allow0_creator_id": "id-01"
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

### Read Two Relationships

**GraphQL input**

```graphql
{
    users(where: { id: "1" }) {
        id
        posts(where: { id: "1" }) {
            comments(where: { id: "1" }) {
                content
            }
        }
    }
}
```

**Expected Cypher output**

```cypher
MATCH (this:User)
WHERE this.id = $this_id
CALL apoc.util.validate(NOT(this.id = $this_auth_allow0_id), "Forbidden", [0])
RETURN this {
    .id,
    posts: [ (this)-[:HAS_POST]->(this_posts:Post) WHERE this_posts.id = $this_posts_id AND apoc.util.validatePredicate(NOT(EXISTS((this_posts)<-[:HAS_POST]-(:User)) AND ANY(creator IN [(this_posts)<-[:HAS_POST]-(creator:User) | creator] WHERE creator.id = $this_posts_auth_allow0_creator_id)), "Forbidden", [0]) | this_posts { comments: [ (this_posts)-[:HAS_COMMENT]->(this_posts_comments:Comment) WHERE this_posts_comments.id = $this_posts_comments_id AND apoc.util.validatePredicate(NOT(EXISTS((this_posts_comments)<-[:HAS_COMMENT]-(:User)) AND ANY(creator IN [(this_posts_comments)<-[:HAS_COMMENT]-(creator:User) | creator] WHERE creator.id = $this_posts_comments_auth_allow0_creator_id)), "Forbidden", [0]) | this_posts_comments {
        .content } ] } ]
} as this
```

**Expected Cypher params**

```cypher-params
{
    "this_id": "1",
    "this_posts_comments_auth_allow0_creator_id": "id-01",
    "this_posts_comments_id": "1",
    "this_posts_id": "1",
    "this_posts_auth_allow0_creator_id": "id-01",
    "this_auth_allow0_id": "id-01"
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
