
## Cypher Auth Projection

Tests auth operations on projecting values.

Schema:

```schema
type Group {
    id: ID
    name: String
    users: [User] @relationship(type: "OF_GROUP", direction: "IN")
}

type User {
    id: String
    name: String
    posts: [Post] @relationship(type: "HAS_POST", direction: "OUT")
}

type Post @auth(
    rules: [
        { 
            allow: {
                OR: [{ creator: { id: "sub" } }, { group: { users: { id: "sub" } } }]
            },
            operations: ["read"]
        }
    ]
) {
    id: String
    title: String
    creator: User @relationship(type: "HAS_POST", direction: "IN")
    group: Group @relationship(type: "OF_GROUP", direction: "OUT")
}
```

---

### Auth Read

Should use validatePredicate inside the projection to enforce that the reader is part of the group where the post belongs. 

**GraphQL input**

```graphql
{
  Users(where: {id: "123"}) {
      name
      posts {
          title
      }
  }
}
```

**Expected Cypher output**

```cypher
MATCH (this:User)
WHERE this.id = $this_id

RETURN this { 
    .name, 
    posts: [ (this)-[:HAS_POST]->(this_posts:Post) WHERE apoc.util.validatePredicate(NOT((EXISTS((this_posts)<-[:HAS_POST]-(:User)) AND ANY(creator IN [(this_posts)<-[:HAS_POST]-(creator:User) | creator] WHERE creator.id = $this_posts_auth0_OR0_creator_id) OR EXISTS((this_posts)-[:OF_GROUP]->(:Group)) AND ANY(group IN [(this_posts)-[:OF_GROUP]->(group:Group) | group] WHERE EXISTS((group)<-[:OF_GROUP]-(:User)) AND ANY(users IN [(group)<-[:OF_GROUP]-(users:User) | users] WHERE users.id = $this_posts_auth0_OR1_group_users_id)))), "Forbidden", [0]) | this_posts { .title } ] 
} as this
```

**Expected Cypher params**

```cypher-params
{
    "this_id": "123",
    "this_posts_auth0_OR0_creator_id": "super_admin",
    "this_posts_auth0_OR1_group_users_id": "super_admin"
}
```

**JWT Object**
```jwt
{
    "sub": "super_admin"
}
```

---