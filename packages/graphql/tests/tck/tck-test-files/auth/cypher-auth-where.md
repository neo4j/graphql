## Cypher Auth Where

Tests auth `where` operations

Schema:

```schema
union Search = Post

type User {
    id: ID
    name: String
    posts: [Post] @relationship(type: "HAS_POST", direction: "OUT")
    content: [Search] @relationship(type: "HAS_POST", direction: "OUT") # something to test unions
}

type Post {
    id: ID
    content: String
    creator: User @relationship(type: "HAS_POST", direction: "IN")
}

extend type User
    @auth(
        rules: [
            {
                operations: ["read"]
                where: { id: "$jwt.sub" }
            }
        ]
    )

extend type Post
    @auth(
        rules: [
            {
                operations: ["read"]
                where: { creator: { id: "$jwt.sub" } }
            }
        ]
    )
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
WHERE this.id = $this_auth_where0_id
RETURN this { .id } as this
```

**Expected Cypher params**

```cypher-params
{
    "this_auth_where0_id": "id-01"
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

### Read Node + User Defined Where

**GraphQL input**

```graphql
{
    users(where: { name: "bob" }) {
        id
    }
}
```

**Expected Cypher output**

```cypher
MATCH (this:User)
WHERE this.name = $this_name AND this.id = $this_auth_where0_id
RETURN this { .id } as this
```

**Expected Cypher params**

```cypher-params
{
    "this_auth_where0_id": "id-01",
    "this_name": "bob"
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

### Read Relationship

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
WHERE this.id = $this_auth_where0_id
RETURN this {
    .id,
    posts: [ (this)-[:HAS_POST]->(this_posts:Post) WHERE EXISTS((this_posts)<-[:HAS_POST]-(:User)) AND ALL(this_posts_auth_where0_creator IN [(this_posts)<-[:HAS_POST]-(this_posts_auth_where0_creator:User) | this_posts_auth_where0_creator] WHERE this_posts_auth_where0_creator.id = $this_posts_auth_where0_creator_id) | this_posts { .content } ]
} as this
```

**Expected Cypher params**

```cypher-params
{
    "this_auth_where0_id": "id-01",
    "this_posts_auth_where0_creator_id": "id-01"
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

### Read Union Relationship + User Defined Where

**GraphQL input**

```graphql
{
    users {
        id
        posts(where: { content: "cool" }) {
            content
        }
    }
}
```

**Expected Cypher output**

```cypher
MATCH (this:User)
WHERE this.id = $this_auth_where0_id
RETURN this {
    .id,
    posts: [ (this)-[:HAS_POST]->(this_posts:Post) WHERE this_posts.content = $this_posts_content AND EXISTS((this_posts)<-[:HAS_POST]-(:User)) AND ALL(this_posts_auth_where0_creator IN [(this_posts)<-[:HAS_POST]-(this_posts_auth_where0_creator:User) | this_posts_auth_where0_creator] WHERE this_posts_auth_where0_creator.id = $this_posts_auth_where0_creator_id) | this_posts { .content } ]
} as this
```

**Expected Cypher params**

```cypher-params
{
    "this_posts_content": "cool",
    "this_auth_where0_id": "id-01",
    "this_posts_auth_where0_creator_id": "id-01"
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

### Read Union

**GraphQL input**

```graphql
{
    users {
        id
        content {
            ... on Post {
                id
            }
        }
    }
}
```

**Expected Cypher output**

```cypher
MATCH (this:User)
WHERE this.id = $this_auth_where0_id
RETURN this {
    .id,
    content: [(this)-[:HAS_POST]->(this_content) WHERE "Post" IN labels(this_content) |
        head( [ this_content IN [this_content] WHERE "Post" IN labels (this_content) AND EXISTS((this_content)<-[:HAS_POST]-(:User)) AND ALL(this_content_Post_auth_where0_creator IN [(this_content)<-[:HAS_POST]-(this_content_Post_auth_where0_creator:User) | this_content_Post_auth_where0_creator] WHERE this_content_Post_auth_where0_creator.id = $this_content_Post_auth_where0_creator_id) | this_content {
            __resolveType: "Post",
            .id
        } ] ) ]
} as this
```

**Expected Cypher params**

```cypher-params
{
    "this_auth_where0_id": "id-01",
    "this_content_Post_auth_where0_creator_id": "id-01"
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
