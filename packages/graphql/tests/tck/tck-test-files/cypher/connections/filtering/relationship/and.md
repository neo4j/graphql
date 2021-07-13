# Cypher -> Connections -> Filtering -> Relationship -> AND

Schema:

```schema
type Movie {
  title: String!
  actors: [Actor!]! @relationship(type: "ACTED_IN", properties: "ActedIn", direction: IN)
}

type Actor {
  name: String!
  movies: [Movie!]! @relationship(type: "ACTED_IN", properties: "ActedIn", direction: OUT)
}

interface ActedIn {
  role: String!
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
                relationship: {
                    AND: [{ role_ENDS_WITH: "Gump" }, { screenTime_LT: 60 }]
                }
            }
        ) {
            edges {
                role
                screenTime
                node {
                    name
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
    MATCH (this)<-[this_acted_in:ACTED_IN]-(this_actor:Actor)
    WHERE ((this_acted_in.role ENDS WITH $this_actorsConnection.args.where.relationship.AND[0].role_ENDS_WITH) AND (this_acted_in.screenTime < $this_actorsConnection.args.where.relationship.AND[1].screenTime_LT))
    WITH collect({ role: this_acted_in.role, screenTime: this_acted_in.screenTime, node: { name: this_actor.name } }) AS edges
    RETURN { edges: edges, totalCount: size(edges) } AS actorsConnection
}
RETURN this { .title, actorsConnection } as this
```

### Expected Cypher Params

```cypher-params
{
    "this_actorsConnection": {
        "args": {
            "where": {
                "relationship": {
                    "AND": [
                        {
                            "role_ENDS_WITH": "Gump"
                        },
                        {
                            "screenTime_LT": {
                                "high": 0,
                                "low": 60
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
