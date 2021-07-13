# Cypher -> Connections -> Filtering -> Composite

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

## Composite

### GraphQL Input

```graphql
query {
    movies(where: { title: "Forrest Gump" }) {
        title
        actorsConnection(
            where: {
                node: { AND: [{ firstName: "Tom" }, { lastName: "Hanks" }] }
                relationship: {
                    AND: [{ screenTime_GT: 30 }, { screenTime_LT: 90 }]
                }
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
WHERE this.title = $this_title
CALL {
    WITH this
    MATCH (this)<-[this_acted_in:ACTED_IN]-(this_actor:Actor)
    WHERE ((this_acted_in.screenTime > $this_actorsConnection.args.where.relationship.AND[0].screenTime_GT) AND (this_acted_in.screenTime < $this_actorsConnection.args.where.relationship.AND[1].screenTime_LT)) AND ((this_actor.firstName = $this_actorsConnection.args.where.node.AND[0].firstName) AND (this_actor.lastName = $this_actorsConnection.args.where.node.AND[1].lastName))
    WITH collect({ screenTime: this_acted_in.screenTime, node: { firstName: this_actor.firstName, lastName: this_actor.lastName } }) AS edges
    RETURN { edges: edges, totalCount: size(edges) } AS actorsConnection
}
RETURN this { .title, actorsConnection } as this
```

### Expected Cypher Params

```json
{
    "this_title": "Forrest Gump",
    "this_actorsConnection": {
        "args": {
            "where": {
                "node": {
                    "AND": [{ "firstName": "Tom" }, { "lastName": "Hanks" }]
                },
                "relationship": {
                    "AND": [
                        {
                            "screenTime_GT": {
                                "high": 0,
                                "low": 30
                            }
                        },
                        {
                            "screenTime_LT": {
                                "high": 0,
                                "low": 90
                            }
                        }
                    ]
                }
            }
        }
    }
}
```

---
