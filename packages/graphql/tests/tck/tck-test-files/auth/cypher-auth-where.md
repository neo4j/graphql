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
                operations: ["read", "update", "delete", "connect"]
                where: { id: "$jwt.sub" }
            }
        ]
    )

extend type User {
    password: String!
        @auth(
            rules: [
                {
                    operations: ["read"]
                    where: { id: "$jwt.sub" }
                }
            ]
        )
}

extend type Post {
    secretKey: String!
        @auth(
            rules: [
                {
                    operations: ["read"]
                    where: { creator: { id: "$jwt.sub" } }
                }
            ]
        )
}

extend type Post
    @auth(
        rules: [
            {
                operations: ["read", "update", "delete", "connect"]
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

### Read Node & Protected Field

**GraphQL input**

```graphql
{
    users {
        id
        password
    }
}
```

**Expected Cypher output**

```cypher
MATCH (this:User)
WHERE this.id = $this_password_auth_where0_id AND this.id = $this_auth_where0_id
RETURN this { .id, .password } as this
```

**Expected Cypher params**

```cypher-params
{
    "this_auth_where0_id": "id-01",
    "this_password_auth_where0_id": "id-01"
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

### Read Node & Protected Field + User Defined Where

**GraphQL input**

```graphql
{
    users(where: { name: "Bob" }) {
        id
        password
    }
}
```

**Expected Cypher output**

```cypher
MATCH (this:User)
WHERE this.name = $this_name AND this.id = $this_password_auth_where0_id AND this.id = $this_auth_where0_id
RETURN this { .id, .password } as this
```

**Expected Cypher params**

```cypher-params
{
    "this_name": "Bob",
    "this_auth_where0_id": "id-01",
    "this_password_auth_where0_id": "id-01"
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

### Read Union Relationship Property

**GraphQL input**

```graphql
{
    users {
        id
        posts(where: { content: "cool" }) {
            content
            secretKey
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
    posts: [ (this)-[:HAS_POST]->(this_posts:Post) WHERE this_posts.content = $this_posts_content AND EXISTS((this_posts)<-[:HAS_POST]-(:User)) AND ALL(this_posts_auth_where0_creator IN [(this_posts)<-[:HAS_POST]-(this_posts_auth_where0_creator:User) | this_posts_auth_where0_creator] WHERE this_posts_auth_where0_creator.id = $this_posts_auth_where0_creator_id) AND EXISTS((this_posts)<-[:HAS_POST]-(:User)) AND ALL(this_posts_secretKey_auth_where0_creator IN [(this_posts)<-[:HAS_POST]-(this_posts_secretKey_auth_where0_creator:User) | this_posts_secretKey_auth_where0_creator] WHERE this_posts_secretKey_auth_where0_creator.id = $this_posts_secretKey_auth_where0_creator_id) | this_posts { .content, .secretKey } ]
} as this
```

**Expected Cypher params**

```cypher-params
{
    "this_posts_content": "cool",
    "this_auth_where0_id": "id-01",
    "this_posts_auth_where0_creator_id": "id-01",
    "this_posts_secretKey_auth_where0_creator_id": "id-01"
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

### Update Node

**GraphQL input**

```graphql
mutation {
    updateUsers(update: { name: "Bob" }) {
        users {
            id
        }
    }
}
```

**Expected Cypher output**

```cypher
MATCH (this:User)
WHERE this.id = $this_auth_where0_id
SET this.name = $this_update_name
RETURN this { .id } AS this
```

**Expected Cypher params**

```cypher-params
{
    "this_update_name": "Bob",
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

### Update Node + User Defined Where

**GraphQL input**

```graphql
mutation {
    updateUsers(where: { name: "bob" }, update: { name: "Bob" }) {
        users {
            id
        }
    }
}
```

**Expected Cypher output**

```cypher
MATCH (this:User)
WHERE this.name = $this_name AND this.id = $this_auth_where0_id
SET this.name = $this_update_name
RETURN this { .id } AS this
```

**Expected Cypher params**

```cypher-params
{
    "this_update_name": "Bob",
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

### Update Nested Node

**GraphQL input**

```graphql
mutation {
    updateUsers(update: { posts: { update: { id: "new-id" } } }) {
        users {
            id
            posts {
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

WITH this
OPTIONAL MATCH (this)-[:HAS_POST]->(this_posts0:Post)
WHERE EXISTS((this_posts0)<-[:HAS_POST]-(:User)) AND ALL(this_posts0_auth_where0_creator IN [(this_posts0)<-[:HAS_POST]-(this_posts0_auth_where0_creator:User) | this_posts0_auth_where0_creator] WHERE this_posts0_auth_where0_creator.id = $this_posts0_auth_where0_creator_id)

CALL apoc.do.when(this_posts0 IS NOT NULL, " SET this_posts0.id = $this_update_posts0_id RETURN count(*) ", "", {this:this, this_posts0:this_posts0, auth:$auth,this_update_posts0_id:$this_update_posts0_id}) YIELD value as _

RETURN this {
    .id,
    posts: [ (this)-[:HAS_POST]->(this_posts:Post) WHERE EXISTS((this_posts)<-[:HAS_POST]-(:User)) AND ALL(this_posts_auth_where0_creator IN [(this_posts)<-[:HAS_POST]-(this_posts_auth_where0_creator:User) | this_posts_auth_where0_creator] WHERE this_posts_auth_where0_creator.id = $this_posts_auth_where0_creator_id) | this_posts { .id } ]
} AS this
```

**Expected Cypher params**

```cypher-params
{
    "this_posts_auth_where0_creator_id": "id-01",
    "this_posts0_auth_where0_creator_id": "id-01",
    "this_update_posts0_id": "new-id",
    "this_auth_where0_id": "id-01",
    "auth": {
      "isAuthenticated": true,
      "jwt": {
        "roles": [
          "admin"
        ],
        "sub": "id-01"
      },
      "roles": [
        "admin"
      ]
    }
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

### Delete Node

**GraphQL input**

```graphql
mutation {
    deleteUsers {
        nodesDeleted
    }
}
```

**Expected Cypher output**

```cypher
MATCH (this:User)
WHERE this.id = $this_auth_where0_id
DETACH DELETE this
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

### Delete Node + User Defined Where

**GraphQL input**

```graphql
mutation {
    deleteUsers(where: { name: "Bob" }) {
        nodesDeleted
    }
}
```

**Expected Cypher output**

```cypher
MATCH (this:User)
WHERE this.name = $this_name AND this.id = $this_auth_where0_id
DETACH DELETE this
```

**Expected Cypher params**

```cypher-params
{
    "this_auth_where0_id": "id-01",
    "this_name": "Bob"
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

### Delete Nested Node

**GraphQL input**

```graphql
mutation {
    deleteUsers(delete: { posts: { where: {} } }) {
        nodesDeleted
    }
}
```

**Expected Cypher output**

```cypher
MATCH (this:User)
WHERE this.id = $this_auth_where0_id

WITH this
OPTIONAL MATCH (this)-[:HAS_POST]->(this_posts0:Post)
WHERE EXISTS((this_posts0)<-[:HAS_POST]-(:User)) AND ALL(this_posts0_auth_where0_creator IN [(this_posts0)<-[:HAS_POST]-(this_posts0_auth_where0_creator:User) | this_posts0_auth_where0_creator] WHERE this_posts0_auth_where0_creator.id = $this_posts0_auth_where0_creator_id)

FOREACH(_ IN CASE this_posts0 WHEN NULL THEN [] ELSE [1] END | DETACH DELETE this_posts0 )

DETACH DELETE this
```

**Expected Cypher params**

```cypher-params
{
    "this_auth_where0_id": "id-01",
    "this_posts0_auth_where0_creator_id": "id-01"
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

### Connect Node (from create)

**GraphQL input**

```graphql
mutation {
    createUsers(
        input: [
            {
                id: "123"
                name: "Bob"
                password: "password"
                posts: { connect: { where: {} } }
            }
        ]
    ) {
        users {
            id
        }
    }
}
```

**Expected Cypher output**

```cypher
CALL {
    CREATE (this0:User)
    SET this0.id = $this0_id
    SET this0.name = $this0_name
    SET this0.password = $this0_password
    WITH this0
    OPTIONAL MATCH (this0_posts_connect0:Post)
    WHERE EXISTS((this0_posts_connect0)<-[:HAS_POST]-(:User)) AND ALL(this0_posts_connect0_auth_where0_creator IN [(this0_posts_connect0)<-[:HAS_POST]-(this0_posts_connect0_auth_where0_creator:User) | this0_posts_connect0_auth_where0_creator] WHERE this0_posts_connect0_auth_where0_creator.id = $this0_posts_connect0_auth_where0_creator_id)
    FOREACH(_ IN CASE this0_posts_connect0 WHEN NULL THEN [] ELSE [1] END | MERGE (this0)-[:HAS_POST]->(this0_posts_connect0) )
    RETURN this0
}
RETURN this0 { .id } AS this0
```

**Expected Cypher params**

```cypher-params
{
    "this0_id": "123",
    "this0_name": "Bob",
    "this0_password": "password",
    "this0_posts_connect0_auth_where0_creator_id": "id-01"
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

### Connect Node + User Defined Where (from create)

**GraphQL input**

```graphql
mutation {
    createUsers(
        input: [
            {
                id: "123"
                name: "Bob"
                password: "password"
                posts: { connect: { where: { id: "post-id" } } }
            }
        ]
    ) {
        users {
            id
        }
    }
}
```

**Expected Cypher output**

```cypher
CALL {
    CREATE (this0:User)
    SET this0.id = $this0_id
    SET this0.name = $this0_name
    SET this0.password = $this0_password
    WITH this0
    OPTIONAL MATCH (this0_posts_connect0:Post)
    WHERE this0_posts_connect0.id = $this0_posts_connect0_id AND EXISTS((this0_posts_connect0)<-[:HAS_POST]-(:User)) AND ALL(this0_posts_connect0_auth_where0_creator IN [(this0_posts_connect0)<-[:HAS_POST]-(this0_posts_connect0_auth_where0_creator:User) | this0_posts_connect0_auth_where0_creator] WHERE this0_posts_connect0_auth_where0_creator.id = $this0_posts_connect0_auth_where0_creator_id)
    FOREACH(_ IN CASE this0_posts_connect0 WHEN NULL THEN [] ELSE [1] END | MERGE (this0)-[:HAS_POST]->(this0_posts_connect0) )
    RETURN this0
}
RETURN this0 { .id } AS this0
```

**Expected Cypher params**

```cypher-params
{
    "this0_id": "123",
    "this0_name": "Bob",
    "this0_password": "password",
    "this0_posts_connect0_auth_where0_creator_id": "id-01",
    "this0_posts_connect0_id": "post-id"
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

### Connect Node (from update update)

**GraphQL input**

```graphql
mutation {
    updateUsers(update: { posts: { connect: { where: {} } } }) {
        users {
            id
        }
    }
}
```

**Expected Cypher output**

```cypher
MATCH (this:User)
WHERE this.id = $this_auth_where0_id
WITH this
WHERE this.id = $this_auth_where0_id
WITH this
OPTIONAL MATCH (this_posts0_connect0:Post)
WHERE EXISTS((this_posts0_connect0)<-[:HAS_POST]-(:User)) AND ALL(this_posts0_connect0_auth_where0_creator IN [(this_posts0_connect0)<-[:HAS_POST]-(this_posts0_connect0_auth_where0_creator:User) | this_posts0_connect0_auth_where0_creator] WHERE this_posts0_connect0_auth_where0_creator.id = $this_posts0_connect0_auth_where0_creator_id)

FOREACH(_ IN CASE this_posts0_connect0 WHEN NULL THEN [] ELSE [1] END | MERGE (this)-[:HAS_POST]->(this_posts0_connect0) )

RETURN this { .id } AS this
```

**Expected Cypher params**

```cypher-params
{
    "this_auth_where0_id": "id-01",
    "this_posts0_connect0_auth_where0_creator_id": "id-01"
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

### Connect Node + User Defined Where (from update update)

**GraphQL input**

```graphql
mutation {
    updateUsers(update: { posts: { connect: { where: { id: "new-id" } } } }) {
        users {
            id
        }
    }
}
```

**Expected Cypher output**

```cypher
MATCH (this:User)
WHERE this.id = $this_auth_where0_id
WITH this
WHERE this.id = $this_auth_where0_id
WITH this
OPTIONAL MATCH (this_posts0_connect0:Post)
WHERE this_posts0_connect0.id = $this_posts0_connect0_id AND EXISTS((this_posts0_connect0)<-[:HAS_POST]-(:User)) AND ALL(this_posts0_connect0_auth_where0_creator IN [(this_posts0_connect0)<-[:HAS_POST]-(this_posts0_connect0_auth_where0_creator:User) | this_posts0_connect0_auth_where0_creator] WHERE this_posts0_connect0_auth_where0_creator.id = $this_posts0_connect0_auth_where0_creator_id)

FOREACH(_ IN CASE this_posts0_connect0 WHEN NULL THEN [] ELSE [1] END | MERGE (this)-[:HAS_POST]->(this_posts0_connect0) )

RETURN this { .id } AS this
```

**Expected Cypher params**

```cypher-params
{
    "this_auth_where0_id": "id-01",
    "this_posts0_connect0_auth_where0_creator_id": "id-01",
    "this_posts0_connect0_id": "new-id"
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

### Connect Node (from update connect)

**GraphQL input**

```graphql
mutation {
    updateUsers(connect: { posts: { where: {} } }) {
        users {
            id
        }
    }
}
```

**Expected Cypher output**

```cypher
MATCH (this:User)
WHERE this.id = $this_auth_where0_id

WITH this
WHERE this.id = $this_auth_where0_id

WITH this
OPTIONAL MATCH (this_connect_posts0:Post)
WHERE EXISTS((this_connect_posts0)<-[:HAS_POST]-(:User)) AND ALL(this_connect_posts0_auth_where0_creator IN [(this_connect_posts0)<-[:HAS_POST]-(this_connect_posts0_auth_where0_creator:User) | this_connect_posts0_auth_where0_creator] WHERE this_connect_posts0_auth_where0_creator.id = $this_connect_posts0_auth_where0_creator_id)

FOREACH(_ IN CASE this_connect_posts0 WHEN NULL THEN [] ELSE [1] END | MERGE (this)-[:HAS_POST]->(this_connect_posts0) )

RETURN this { .id } AS this
```

**Expected Cypher params**

```cypher-params
{
    "this_auth_where0_id": "id-01",
    "this_connect_posts0_auth_where0_creator_id": "id-01"
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

### Connect Node + User Defined Where (from update connect)

**GraphQL input**

```graphql
mutation {
    updateUsers(connect: { posts: { where: { id: "some-id" } } }) {
        users {
            id
        }
    }
}
```

**Expected Cypher output**

```cypher
MATCH (this:User)
WHERE this.id = $this_auth_where0_id

WITH this
WHERE this.id = $this_auth_where0_id

WITH this
OPTIONAL MATCH (this_connect_posts0:Post)
WHERE this_connect_posts0.id = $this_connect_posts0_id AND EXISTS((this_connect_posts0)<-[:HAS_POST]-(:User)) AND ALL(this_connect_posts0_auth_where0_creator IN [(this_connect_posts0)<-[:HAS_POST]-(this_connect_posts0_auth_where0_creator:User) | this_connect_posts0_auth_where0_creator] WHERE this_connect_posts0_auth_where0_creator.id = $this_connect_posts0_auth_where0_creator_id)

FOREACH(_ IN CASE this_connect_posts0 WHEN NULL THEN [] ELSE [1] END | MERGE (this)-[:HAS_POST]->(this_connect_posts0) )

RETURN this { .id } AS this
```

**Expected Cypher params**

```cypher-params
{
    "this_auth_where0_id": "id-01",
    "this_connect_posts0_auth_where0_creator_id": "id-01",
    "this_connect_posts0_id": "some-id"
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
