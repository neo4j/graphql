# Interface Relationships - Update create

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

## Update create an interface relationship

### GraphQL Input

```graphql
mutation {
    updateActors(
        create: { actedIn: { edge: { screenTime: 90 }, node: { Movie: { title: "Example Film", runtime: 90 } } } }
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
MATCH (this:Actor)
CREATE (this_create_actedIn0_node_Movie:Movie)
SET this_create_actedIn0_node_Movie.title = $this_create_actedIn0_node_Movie_title
SET this_create_actedIn0_node_Movie.runtime = $this_create_actedIn0_node_Movie_runtime
MERGE (this)-[this_create_actedIn0_relationship:ACTED_IN]->(this_create_actedIn0_node_Movie)
SET this_create_actedIn0_relationship.screenTime = $this_create_actedIn0_relationship_screenTime
WITH this
CALL {
    WITH this
    MATCH (this)-[:ACTED_IN]->(this_Movie:Movie)
    RETURN { __resolveType: "Movie", title: this_Movie.title, runtime: this_Movie.runtime } AS actedIn
UNION
    WITH this
    MATCH (this)-[:ACTED_IN]->(this_Series:Series)
    RETURN { __resolveType: "Series", title: this_Series.title, episodes: this_Series.episodes } AS actedIn
}
RETURN this { .name, actedIn: collect(actedIn) } AS this
```

### Expected Cypher Params

```json
{
    "this_create_actedIn0_node_Movie_runtime": {
        "high": 0,
        "low": 90
    },
    "this_create_actedIn0_node_Movie_title": "Example Film",
    "this_create_actedIn0_relationship_screenTime": {
        "high": 0,
        "low": 90
    }
}
```

---
