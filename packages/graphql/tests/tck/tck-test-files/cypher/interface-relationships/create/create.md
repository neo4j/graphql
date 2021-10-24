# Interface Relationships - Create create

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

## Create create an interface relationship

### GraphQL Input

```graphql
mutation {
    createActors(
        input: [
            {
                name: "Actor Name"
                actedIn: {
                    create: { edge: { screenTime: 90 }, node: { Movie: { title: "Example Film", runtime: 90 } } }
                }
            }
        ]
    ) {
        actors {
            name
            actedIn {
                title
                ... on Movie {
                    runtime
                }
                ... on Series {
                    episodes
                }
            }
        }
    }
}
```

### Expected Cypher Output

```cypher
CALL {
    CREATE (this0:Actor)
    SET this0.name = $this0_name WITH this0
    CREATE (this0_actedInMovie0_node:Movie)
    SET this0_actedInMovie0_node.title = $this0_actedInMovie0_node_title
    SET this0_actedInMovie0_node.runtime = $this0_actedInMovie0_node_runtime
    MERGE (this0)-[this0_actedInMovie0_relationship:ACTED_IN]->(this0_actedInMovie0_node)
    SET this0_actedInMovie0_relationship.screenTime = $this0_actedInMovie0_relationship_screenTime
    RETURN this0
}
WITH this0
CALL {
    WITH this0
    MATCH (this0)-[:ACTED_IN]->(this0_Movie:Movie)
    RETURN { __resolveType: "Movie", title: this0_Movie.title, runtime: this0_Movie.runtime } AS actedIn
UNION
    WITH this0
    MATCH (this0)-[:ACTED_IN]->(this0_Series:Series)
    RETURN { __resolveType: "Series", title: this0_Series.title, episodes: this0_Series.episodes } AS actedIn
}
RETURN this0 { .name, actedIn: collect(actedIn) } AS this0
```

### Expected Cypher Params

```json
{
    "this0_actedInMovie0_node_runtime": {
        "high": 0,
        "low": 90
    },
    "this0_actedInMovie0_node_title": "Example Film",
    "this0_actedInMovie0_relationship_screenTime": {
        "high": 0,
        "low": 90
    },
    "this0_name": "Actor Name"
}
```

---
