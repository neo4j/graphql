# Interface Relationships - Update connect

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
    actedIn: [Production!]! @relationship(type: "ACTED_IN", direction: OUT, properties: "ActedIn")
}
```

---

## Update connect to an interface relationship

### GraphQL Input

```graphql
mutation {
    updateActors(connect: { actedIn: { edge: { screenTime: 90 }, where: { node: { title_STARTS_WITH: "The " } } } }) {
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
    OPTIONAL MATCH (this_connect_actedIn0_node:Movie)
    WHERE this_connect_actedIn0_node.title STARTS WITH $this_connect_actedIn0_node_title_STARTS_WITH
    FOREACH(_ IN CASE this_connect_actedIn0_node WHEN NULL THEN [] ELSE [1] END |
        MERGE (this)-[this_connect_actedIn0_relationship:ACTED_IN]->(this_connect_actedIn0_node)
        SET this_connect_actedIn0_relationship.screenTime = $this_connect_actedIn0_relationship_screenTime
    )
    RETURN count(*)
UNION
    WITH this
    OPTIONAL MATCH (this_connect_actedIn0_node:Series)
    WHERE this_connect_actedIn0_node.title STARTS WITH $this_connect_actedIn0_node_title_STARTS_WITH
    FOREACH(_ IN CASE this_connect_actedIn0_node WHEN NULL THEN [] ELSE [1] END |
        MERGE (this)-[this_connect_actedIn0_relationship:ACTED_IN]->(this_connect_actedIn0_node)
        SET this_connect_actedIn0_relationship.screenTime = $this_connect_actedIn0_relationship_screenTime
    )
    RETURN count(*)
}
RETURN this { .name } AS this
```

### Expected Cypher Params

```json
{
    "this_connect_actedIn0_node_title_STARTS_WITH": "The ",
    "this_connect_actedIn0_relationship_screenTime": {
        "high": 0,
        "low": 90
    }
}
```

---
