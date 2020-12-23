## Cypher Auth Bind

Tests auth bind operations.

Schema:

```schema
type User {
    id: ID!
    email: String!
    password: String!
}

type Blog @auth(rules: [
    {
        operations: ["create", "update"],
        bind: {
            creator: {
                id: "sub"
            }
        }
    },
]) {
    id: ID!
    name: String!
    creator: User @relationship(type: "HAS_BLOG", direction: "IN")
    authors: [User] @relationship(type: "CAN_POST", direction: "IN")
    posts: [Post] @relationship(type: "HAS_POST", direction: "OUT")
}

type Post {
    id: ID!
    title: String!
    content: String!
    blog: Blog @relationship(type: "HAS_POST", direction: "IN")
    comments: [Comment] @relationship(type: "HAS_COMMENT", direction: "OUT")
    author: User @relationship(type: "WROTE", direction: "IN")
}

type Comment {
    id: ID!
    author: User @relationship(type: "COMMENTED", direction: "IN")
    content: String!
    post: Post @relationship(type: "HAS_COMMENT", direction: "IN")
}
```

---

### Create

Bind the creator of the blog to the sub property in the jwt.

**GraphQL input**

```graphql
mutation {
    createBlogs(
        input: [
            {
                id: "123"
                name: "some blog"
                creator: { connect: { where: { id: "invalid_user_id" } } }
            }
        ]
    ) {
        id
    }
}
```

**Expected Cypher output**

```cypher
CALL {
    CREATE (this0:Blog)
    SET this0.id = $this0_id
    SET this0.name = $this0_name

    WITH this0
    OPTIONAL MATCH (this0_creator_connect0:User)
    WHERE this0_creator_connect0.id = $this0_creator_connect0_id
    FOREACH(_ IN CASE this0_creator_connect0 WHEN NULL THEN [] ELSE [1] END |
        MERGE (this0)<-[:HAS_BLOG]-(this0_creator_connect0)
    )

    WITH this0
    CALL apoc.util.validate(NOT(EXISTS((this0)<-[:HAS_BLOG]-(:User)) AND ALL(creator IN [(this0)<-[:HAS_BLOG]-(creator:User) | creator] WHERE creator.id = $this0_bind0_creator_id)), "Forbidden", [0])

    RETURN this0
}

RETURN this0 { .id } AS this0
```

**Expected Cypher params**

```cypher-params
{
    "this0_id": "123",
    "this0_name": "some blog",
    "this0_creator_connect0_id": "invalid_user_id",
    "this0_bind0_creator_id": "user_id"
}
```

**JWT Object**

```jwt
{
    "sub": "user_id"
}
```

---

### Update

Bind the creator of the blog to the sub property in the jwt.

**GraphQL input**

```graphql
mutation {
    updateBlogs(
        where: { id: "123" }
        update: { creator: { connect: { where: { id: "user_id" } } } }
    ) {
        id
    }
}
```

**Expected Cypher output**

```cypher
MATCH (this:Blog)
WHERE this.id = $this_id

WITH this
OPTIONAL MATCH (this_creator0_connect0:User)
WHERE this_creator0_connect0.id = $this_creator0_connect0_id
FOREACH(_ IN CASE this_creator0_connect0 WHEN NULL THEN [] ELSE [1] END |
    MERGE (this)<-[:HAS_BLOG]-(this_creator0_connect0)
)

WITH this
CALL apoc.util.validate(NOT(EXISTS((this)<-[:HAS_BLOG]-(:User)) AND ALL(creator IN [(this)<-[:HAS_BLOG]-(creator:User) | creator] WHERE creator.id = $this_bind0_creator_id)), "Forbidden", [0])

RETURN this { .id } AS this
```

**Expected Cypher params**

```cypher-params
{
    "this_id": "123",
    "this_creator0_connect0_id": "user_id",
    "this_bind0_creator_id": "user_id"
}
```

**JWT Object**

```jwt
{
    "sub": "user_id"
}
```

---
