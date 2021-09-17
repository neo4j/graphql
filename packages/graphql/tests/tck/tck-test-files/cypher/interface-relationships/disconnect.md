# Interface Relationships - Disconnect

Tests Cypher output for interface relationship fields

Schema:

```graphql
interface Production {
    title: String!
}

type Movie implements Production {
    title: String!
    runtime: Int!
}

type Series implements Production {
    title: String!
    episodes: Int!
}

interface ActedIn @relationshipProperties {
    screenTime: Int!
}

type Actor {
    name: String!
    actedIn: [Production!]!
        @relationship(type: "ACTED_IN", direction: OUT, properties: "ActedIn")
}
```

---

## Disconnect from an interface relationship

### GraphQL Input

```graphql
mutation {
    updateActors(
        disconnect: {
            actedIn: { where: { node: { title_STARTS_WITH: "The " } } }
        }
    ) {
        actors {
            name
        }
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Actor)
WITH this
CALL {
    WITH this
    OPTIONAL MATCH (this)-[this_disconnect_actedIn0_rel:ACTED_IN]->(this_disconnect_actedIn0:Movie)
    WHERE this_disconnect_actedIn0.title STARTS WITH $updateActors.args.disconnect.actedIn[0].where.node.title_STARTS_WITH
    FOREACH(_ IN CASE this_disconnect_actedIn0 WHEN NULL THEN [] ELSE [1] END |
        DELETE this_disconnect_actedIn0_rel
    )
    RETURN count(*)
UNION
    WITH this
    OPTIONAL MATCH (this)-[this_disconnect_actedIn0_rel:ACTED_IN]->(this_disconnect_actedIn0:Series)
    WHERE this_disconnect_actedIn0.title STARTS WITH $updateActors.args.disconnect.actedIn[0].where.node.title_STARTS_WITH
    FOREACH(_ IN CASE this_disconnect_actedIn0 WHEN NULL THEN [] ELSE [1] END |
        DELETE this_disconnect_actedIn0_rel
    )
    RETURN count(*)
}
RETURN this { .name } AS this

```

### Expected Cypher Params

```json
{
    "updateActors": {
        "args": {
            "disconnect": {
                "actedIn": [
                    {
                        "where": {
                            "node": {
                                "title_STARTS_WITH": "The "
                            }
                        }
                    }
                ]
            }
        }
    }
}
```

---
