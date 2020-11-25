
## Cypher Auth Relationships

Tests auth operations on relationships.

Schema:

```schema
type User {
    id: String
    name: String
}

type Post @auth(
    rules: [
        {
            allow: {
                OR: [
                    { creator: { id: "sub" } },
                    { moderator: { id: "sub" } }
                ]
            },
            operations: ["read"]
        }
    ]
) {
    id: String
    title: String
    creator: User @relationship(type: "CREATOR", direction: "OUT")
    moderator: User @relationship(type: "MODERATOR", direction: "IN")
}
```

---

### Auth Read

**GraphQL input**

```graphql
{
  Posts(where: {id: "123"}) {
    id
    title
  }
}
```

**Expected Cypher output**

```cypher
MATCH (this:Post)
WHERE this.id = $this_id CALL apoc.util.validate(NOT((EXISTS((this)-[:CREATOR]->(:User)) AND ANY(creator IN [(this)-[:CREATOR]->(creator:User) | creator] WHERE creator.id = $this_auth0_OR0_creator_id) OR EXISTS((this)<-[:MODERATOR]-(:User)) AND ANY(moderator IN [(this)<-[:MODERATOR]-(moderator:User) | moderator] WHERE moderator.id = $this_auth0_OR1_moderator_id))), "Forbidden", [0])
RETURN this { .id, .title } as this
```

**Expected Cypher params**

```cypher-params
{
    "this_id": "123",
    "this_auth0_OR0_creator_id": "super_admin",
    "this_auth0_OR1_moderator_id": "super_admin"
}
```

**JWT Object**
```jwt
{
    "sub": "super_admin"
}
```

---