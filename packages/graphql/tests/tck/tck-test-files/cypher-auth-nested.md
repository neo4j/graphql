
## Cypher Auth nested

Example to demonstrate nested OR plus AND. This is something crazy to make sure things are are working recursively 

Schema:

```schema
type Post @auth(rules: [
    {
        allow: {
                OR: [
                    {
                        AND: [
                            {
                                OR: [
                                    { id: "auth0or0and0or0" }, # 1
                                    { title: "auth0or0and0or1" } # 2
                                ]
                            }
                        ]
                    },
                    {
                        AND: [
                            {
                                OR: [
                                    { id: "auth0or1and0or0" }, # 3
                                    { title: "auth0or1and0or1" } # 4
                                ]
                            }
                        ]
                    }
                ]
            },
            operations: ["read"]
    },
    {
        allow: {
                OR: [
                    {
                        AND: [
                            {
                                OR: [
                                    { id: "auth1or0and0or0" }, # 5
                                    { title: "auth1or0and0or1" } # 6
                                ]
                            }
                        ]
                    },
                    {
                        AND: [
                            {
                                OR: [
                                    { id: "auth1or1and0or0" }, # 7
                                    { title: "auth1or1and0or1" } # 8
                                ]
                            }
                        ]
                    }
                ]
            },
            operations: ["read"]
    }
]) {
    id: ID
    title: String
}
```

---

### Read

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
WHERE this.id = $this_id CALL apoc.util.validate(NOT((((this.id = $this_auth0_OR0_AND0_OR0_id OR this.title = $this_auth0_OR0_AND0_OR1_title)) OR ((this.id = $this_auth0_OR1_AND0_OR0_id OR this.title = $this_auth0_OR1_AND0_OR1_title))) AND (((this.id = $this_auth1_OR0_AND0_OR0_id OR this.title = $this_auth1_OR0_AND0_OR1_title)) OR ((this.id = $this_auth1_OR1_AND0_OR0_id OR this.title = $this_auth1_OR1_AND0_OR1_title)))), "Forbidden", [0])
RETURN this { .id, .title } as this
```

**Expected Cypher params**

```cypher-params
{
    "this_id": "123",
    "this_auth0_OR0_AND0_OR0_id": "1",
    "this_auth0_OR0_AND0_OR1_title": "2",
    "this_auth0_OR1_AND0_OR0_id": "3",
    "this_auth0_OR1_AND0_OR1_title": "4",
    "this_auth1_OR0_AND0_OR0_id": "5",
    "this_auth1_OR0_AND0_OR1_title": "6",
    "this_auth1_OR1_AND0_OR0_id": "7",
    "this_auth1_OR1_AND0_OR1_title": "8"
}
```

**JWT Object**
```jwt
{
    "auth0or0and0or0": "1",
    "auth0or0and0or1": "2",
    "auth0or1and0or0": "3",
    "auth0or1and0or1": "4",
    "auth1or0and0or0": "5",
    "auth1or0and0or1": "6",
    "auth1or1and0or0": "7",
    "auth1or1and0or1": "8"
}
```

---