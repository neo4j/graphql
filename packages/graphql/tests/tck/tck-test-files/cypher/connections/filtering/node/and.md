# Cypher -> Connections -> Filtering -> Node -> AND

Schema:

```graphql
type Movie {
    title: String!
    actors: [Actor!]!
        @relationship(type: "ACTED_IN", properties: "ActedIn", direction: IN)
}

type Actor {
    firstName: String!
    lastName: String!
    movies: [Movie!]!
        @relationship(type: "ACTED_IN", properties: "ActedIn", direction: OUT)
}

interface ActedIn {
    screenTime: Int!
}
```

---

## AND

### GraphQL Input

```graphql
query {
    movies {
        title
        actorsConnection(
            where: {
                node: { AND: [{ firstName: "Tom" }, { lastName: "Hanks" }] }
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

### Expected Cypher Output

```cypher
MATCH (this:Movie)
CALL {
    WITH this
    MATCH (this)<-[this_acted_in_relationship:ACTED_IN]-(this_actor:Actor)
    WHERE ((this_actor.firstName = $this_actorsConnection.args.where.node.AND[0].firstName) AND (this_actor.lastName = $this_actorsConnection.args.where.node.AND[1].lastName))
    WITH collect({ screenTime: this_acted_in_relationship.screenTime, node: { firstName: this_actor.firstName, lastName: this_actor.lastName } }) AS edges
    RETURN { edges: edges, totalCount: size(edges) } AS actorsConnection
}
RETURN this { .title, actorsConnection } as this
```

### Expected Cypher Params

```json
{
    "this_actorsConnection": {
        "args": {
            "where": {
                "node": {
                    "AND": [
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
