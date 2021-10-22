# Interface Relationships - Create connect

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

## Create connect to an interface relationship

### GraphQL Input

```graphql
mutation {
    createActors(
        input: [
            {
                name: "Actor Name"
                actedIn: { connect: { edge: { screenTime: 90 }, where: { node: { title_STARTS_WITH: "The " } } } }
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
    SET this0.name = $this0_name
    WITH this0
    CALL {
        WITH this0
        OPTIONAL MATCH (this0_actedIn_connect0_node:Movie)
        WHERE this0_actedIn_connect0_node.title STARTS WITH $this0_actedIn_connect0_node_title_STARTS_WITH
        FOREACH(_ IN CASE this0 WHEN NULL THEN [] ELSE [1] END |
            FOREACH(_ IN CASE this0_actedIn_connect0_node WHEN NULL THEN [] ELSE [1] END |
                MERGE (this0)-[this0_actedIn_connect0_relationship:ACTED_IN]->(this0_actedIn_connect0_node)
                SET this0_actedIn_connect0_relationship.screenTime = $this0_actedIn_connect0_relationship_screenTime
            )
        )
        RETURN count(*)
    UNION
        WITH this0
        OPTIONAL MATCH (this0_actedIn_connect0_node:Series)
        WHERE this0_actedIn_connect0_node.title STARTS WITH $this0_actedIn_connect0_node_title_STARTS_WITH
        FOREACH(_ IN CASE this0 WHEN NULL THEN [] ELSE [1] END |
            FOREACH(_ IN CASE this0_actedIn_connect0_node WHEN NULL THEN [] ELSE [1] END |
                MERGE (this0)-[this0_actedIn_connect0_relationship:ACTED_IN]->(this0_actedIn_connect0_node)
                SET this0_actedIn_connect0_relationship.screenTime = $this0_actedIn_connect0_relationship_screenTime
            )
        )
        RETURN count(*)
    }
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
    "this0_actedIn_connect0_node_title_STARTS_WITH": "The ",
    "this0_actedIn_connect0_relationship_screenTime": {
        "high": 0,
        "low": 90
    },
    "this0_name": "Actor Name"
}
```

---
