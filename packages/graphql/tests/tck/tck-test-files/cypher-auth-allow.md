## Cypher Auth Allow

Tests auth allow operations.

Schema:

```schema
type User {
  id: ID
  name: String
  posts: [Post] @relationship(type: "HAS_POST", direction: "OUT")
}

type Group {
  id: ID
  name: String
  users: [User] @relationship(type: "OF_GROUP", direction: "IN")
}

type Post @auth(
  rules: [
      {
          allow: {
              OR: [
                { group: { users: { id: "sub" } } },
                { creator: { id: "sub" } },
                { moderator: { id: "sub" } }
              ]
          },
          operations: ["read", "update", "delete"]
      }
  ]
) {
  id: String
  title: String
  group: Group @relationship(type: "OF_GROUP", direction: "OUT")
  creator: User @relationship(type: "HAS_POST", direction: "IN")
  moderator: User @relationship(type: "MODERATOR", direction: "IN")
}
```

---

### Auth Read

**GraphQL input**

```graphql
{
    posts(where: { id: "123" }) {
        id
        title
    }
}
```

**Expected Cypher output**

```cypher
MATCH (this:Post)
WHERE this.id = $this_id
CALL apoc.util.validate(NOT((EXISTS((this)-[:OF_GROUP]->(:Group)) AND ANY(group IN [(this)-[:OF_GROUP]->(group:Group) | group] WHERE EXISTS((group)<-[:OF_GROUP]-(:User)) AND ANY(users IN [(group)<-[:OF_GROUP]-(users:User) | users] WHERE users.id = $this_auth0_OR0_group_users_id)) OR EXISTS((this)<-[:HAS_POST]-(:User)) AND ANY(creator IN [(this)<-[:HAS_POST]-(creator:User) | creator] WHERE creator.id = $this_auth0_OR1_creator_id) OR EXISTS((this)<-[:MODERATOR]-(:User)) AND ANY(moderator IN [(this)<-[:MODERATOR]-(moderator:User) | moderator] WHERE moderator.id = $this_auth0_OR2_moderator_id))), "Forbidden", [0])

RETURN this { .id, .title } as this
```

**Expected Cypher params**

```cypher-params
{
    "this_id": "123",
    "this_auth0_OR0_group_users_id": "super_admin",
    "this_auth0_OR1_creator_id": "super_admin",
    "this_auth0_OR2_moderator_id": "super_admin"
}
```

**JWT Object**

```jwt
{
    "sub": "super_admin"
}
```

---

### Auth Update

**GraphQL input**

```graphql
mutation {
    updateUsers(
        update: {
            posts: {
                where: { id: "post id 1" }
                update: { title: "cool post" }
            }
        }
    ) {
        users {
            id
            posts {
                title
            }
        }
    }
}
```

**Expected Cypher output**

```cypher
MATCH (this:User)
WITH this
OPTIONAL MATCH (this)-[:HAS_POST]->(this_posts0:Post)
WHERE this_posts0.id = $this_posts0_id
CALL apoc.do.when(this_posts0 IS NOT NULL, "
        CALL apoc.util.validate(NOT((EXISTS((this_posts0)-[:OF_GROUP]->(:Group)) AND ANY(group IN [(this_posts0)-[:OF_GROUP]->(group:Group) | group] WHERE EXISTS((group)<-[:OF_GROUP]-(:User)) AND ANY(users IN [(group)<-[:OF_GROUP]-(users:User) | users] WHERE users.id = $this_posts0_auth0_OR0_group_users_id)) OR EXISTS((this_posts0)<-[:HAS_POST]-(:User)) AND ANY(creator IN [(this_posts0)<-[:HAS_POST]-(creator:User) | creator] WHERE creator.id = $this_posts0_auth0_OR1_creator_id) OR EXISTS((this_posts0)<-[:MODERATOR]-(:User)) AND ANY(moderator IN [(this_posts0)<-[:MODERATOR]-(moderator:User) | moderator] WHERE moderator.id = $this_posts0_auth0_OR2_moderator_id))), \"Forbidden\", [0])

        SET this_posts0.title = $this_update_posts0_title
        RETURN count(*)
    ",
    "",
    {this:this, this_posts0:this_posts0, this_posts0_auth0_OR0_group_users_id:$this_posts0_auth0_OR0_group_users_id,this_posts0_auth0_OR1_creator_id:$this_posts0_auth0_OR1_creator_id,this_posts0_auth0_OR2_moderator_id:$this_posts0_auth0_OR2_moderator_id,this_update_posts0_title:$this_update_posts0_title}) YIELD value as _

RETURN this {
    .id,
    posts: [ (this)-[:HAS_POST]->(this_posts:Post) WHERE apoc.util.validatePredicate(NOT((EXISTS((this_posts)-[:OF_GROUP]->(:Group)) AND ANY(group IN [(this_posts)-[:OF_GROUP]->(group:Group) | group] WHERE EXISTS((group)<-[:OF_GROUP]-(:User)) AND ANY(users IN [(group)<-[:OF_GROUP]-(users:User) | users] WHERE users.id = $this_posts_auth0_OR0_group_users_id)) OR EXISTS((this_posts)<-[:HAS_POST]-(:User)) AND ANY(creator IN [(this_posts)<-[:HAS_POST]-(creator:User) | creator] WHERE creator.id = $this_posts_auth0_OR1_creator_id) OR EXISTS((this_posts)<-[:MODERATOR]-(:User)) AND ANY(moderator IN [(this_posts)<-[:MODERATOR]-(moderator:User) | moderator] WHERE moderator.id = $this_posts_auth0_OR2_moderator_id))), "Forbidden", [0]) | this_posts { .title } ]
} AS this
```

**Expected Cypher params**

```cypher-params
{
    "this_posts0_auth0_OR0_group_users_id": "super_admin",
    "this_posts0_auth0_OR1_creator_id": "super_admin",
    "this_posts0_auth0_OR2_moderator_id": "super_admin",
    "this_posts0_id": "post id 1",
    "this_posts_auth0_OR0_group_users_id": "super_admin",
    "this_posts_auth0_OR1_creator_id": "super_admin",
    "this_posts_auth0_OR2_moderator_id": "super_admin",
    "this_update_posts0_title": "cool post"
}
```

**JWT Object**

```jwt
{
    "sub": "super_admin"
}
```

---

### Auth Delete

**GraphQL input**

```graphql
mutation {
    deletePosts(where: { id: "123" }) {
        nodesDeleted
    }
}
```

**Expected Cypher output**

```cypher
MATCH (this:Post)
WHERE this.id = $this_id
CALL apoc.util.validate(NOT((EXISTS((this)-[:OF_GROUP]->(:Group)) AND ANY(group IN [(this)-[:OF_GROUP]->(group:Group) | group] WHERE EXISTS((group)<-[:OF_GROUP]-(:User)) AND ANY(users IN [(group)<-[:OF_GROUP]-(users:User) | users] WHERE users.id = $this_auth0_OR0_group_users_id)) OR EXISTS((this)<-[:HAS_POST]-(:User)) AND ANY(creator IN [(this)<-[:HAS_POST]-(creator:User) | creator] WHERE creator.id = $this_auth0_OR1_creator_id) OR EXISTS((this)<-[:MODERATOR]-(:User)) AND ANY(moderator IN [(this)<-[:MODERATOR]-(moderator:User) | moderator] WHERE moderator.id = $this_auth0_OR2_moderator_id))), "Forbidden", [0])

DETACH DELETE this
```

**Expected Cypher params**

```cypher-params
{
    "this_id": "123",
    "this_auth0_OR0_group_users_id": "super_admin",
    "this_auth0_OR1_creator_id": "super_admin",
    "this_auth0_OR2_moderator_id": "super_admin"
}
```

**JWT Object**

```jwt
{
    "sub": "super_admin"
}
```

---
