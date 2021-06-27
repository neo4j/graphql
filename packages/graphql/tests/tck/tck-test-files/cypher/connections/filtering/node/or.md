## Cypher -> Connections -> Filtering -> Node -> OR

Schema:

```schema
type Movie {
  title: String!
  actors: [Actor!]! @relationship(type: "ACTED_IN", properties: "ActedIn", direction: IN)
}

type Actor {
  firstName: String!
  lastName: String!
  movies: [Movie!]! @relationship(type: "ACTED_IN", properties: "ActedIn", direction: OUT)
}

interface ActedIn {
  screenTime: Int!
}
```

---

### OR

**GraphQL input**

```graphql
query {
    movies {
        title
        actorsConnection(
            where: {
                node: { OR: [{ firstName: "Tom" }, { lastName: "Hanks" }] }
            }
        ) {
            edges {
                screenTime
                node {
                    firstName
                    lastName
                }
            }
        }
    }
}
```

**Expected Cypher output**

```cypher
MATCH (this:Movie)
CALL {
    WITH this
    MATCH (this)<-[this_acted_in:ACTED_IN]-(this_actor:Actor)
    WHERE ((this_actor.firstName = $this_actorsConnection.args.where.node.OR[0].firstName) OR (this_actor.lastName = $this_actorsConnection.args.where.node.OR[1].lastName))
    WITH collect({ screenTime: this_acted_in.screenTime, node: { firstName: this_actor.firstName, lastName: this_actor.lastName } }) AS edges
    RETURN { edges: edges, totalCount: size(edges) } AS actorsConnection
}
RETURN this { .title, actorsConnection } as this
```

**Expected Cypher params**

```cypher-params
{
    "this_actorsConnection": {
        "args": {
            "where": {
                "node": {
                    "OR": [
                        {
                            "firstName": "Tom"
                        },
                        {
                            "lastName": "Hanks"
                        }
                    ]
                }
            }
        }
    }
}
```

---
