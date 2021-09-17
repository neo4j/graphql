# Interface Relationships - Delete

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

## Delete an interface relationship

### GraphQL Input

```graphql
mutation {
    updateActors(
        delete: { actedIn: { where: { node: { title_STARTS_WITH: "The " } } } }
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
    OPTIONAL MATCH (this)-[this_delete_actedIn0_relationship:ACTED_IN]->(this_delete_actedIn0:Movie)
    WHERE this_delete_actedIn0.title STARTS WITH $updateActors.args.delete.actedIn[0].where.node.title_STARTS_WITH
    FOREACH(_ IN CASE this_delete_actedIn0 WHEN NULL THEN [] ELSE [1] END |
        DETACH DELETE this_delete_actedIn0
    )
    RETURN count(*)
UNION
    WITH this
    OPTIONAL MATCH (this)-[this_delete_actedIn0_relationship:ACTED_IN]->(this_delete_actedIn0:Series)
    WHERE this_delete_actedIn0.title STARTS WITH $updateActors.args.delete.actedIn[0].where.node.title_STARTS_WITH
    FOREACH(_ IN CASE this_delete_actedIn0 WHEN NULL THEN [] ELSE [1] END |
        DETACH DELETE this_delete_actedIn0
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
