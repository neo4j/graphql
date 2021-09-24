# Auth projections for interface relationship fields

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

extend type Series @auth(rules: [{ allow: { episodes: "$jwt.sub" } }])

interface ActedIn @relationshipProperties {
    screenTime: Int!
}

type Actor {
    name: String!
    actedIn: [Production!]! @relationship(type: "ACTED_IN", direction: OUT, properties: "ActedIn")
}
```

---

## Simple Interface Relationship Query for protected type

### GraphQL Input

```graphql
query {
    actors {
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
```

### Expected Cypher Output

```cypher
MATCH (this:Actor)
WITH this
CALL {
  WITH this
  MATCH (this)-[:ACTED_IN]->(this_Movie:Movie)
  RETURN { __resolveType: "Movie", title: this_Movie.title, runtime: this_Movie.runtime } AS actedIn
UNION
  WITH this
  MATCH (this)-[:ACTED_IN]->(this_Series:Series)
  CALL apoc.util.validate(NOT(this_Series.episodes IS NOT NULL AND this_Series.episodes = $this_Series_auth_allow0_episodes), "@neo4j/graphql/FORBIDDEN", [0])
  RETURN { __resolveType: "Series", title: this_Series.title, episodes: this_Series.episodes } AS actedIn
}
RETURN this { actedIn: collect(actedIn) } as this
```

### Expected Cypher Params

```json
{
    "this_actedIn": {
        "this_Series_auth_allow0_episodes": "super_admin"
    }
}
```

### JWT Object

```json
{
    "sub": "super_admin"
}
```

---
