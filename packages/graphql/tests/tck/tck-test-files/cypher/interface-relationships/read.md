# Interface Relationships

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

## Simple Interface Relationship Query

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
  RETURN { __resolveType: "Series", title: this_Series.title, episodes: this_Series.episodes } AS actedIn
}
RETURN this { actedIn: collect(actedIn) } as this
```

### Expected Cypher Params

```json
{}
```

---

## Interface Relationship Query with where

### GraphQL Input

```graphql
query {
    actors {
        actedIn(where: { title_STARTS_WITH: "The " }) {
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
  WHERE this_Movie.title STARTS WITH $this_actedIn.args.where.title_STARTS_WITH
  RETURN { __resolveType: "Movie", title: this_Movie.title, runtime: this_Movie.runtime } AS actedIn
UNION
  WITH this
  MATCH (this)-[:ACTED_IN]->(this_Series:Series)
  WHERE this_Series.title STARTS WITH $this_actedIn.args.where.title_STARTS_WITH
  RETURN { __resolveType: "Series", title: this_Series.title, episodes: this_Series.episodes } AS actedIn
}
RETURN this { actedIn: collect(actedIn) } as this
```

### Expected Cypher Params

```json
{
    "this_actedIn": {
        "args": {
            "where": {
                "title_STARTS_WITH": "The "
            }
        }
    }
}
```

---

## Interface Relationship Query through connection

### GraphQL Input

```graphql
query {
    actors {
        actedInConnection {
            edges {
                screenTime
                node {
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
}
```

### Expected Cypher Output

```cypher
MATCH (this:Actor)
CALL {
  WITH this
  CALL {
    WITH this
    MATCH (this)-[this_acted_in_relationship:ACTED_IN]->(this_Movie:Movie)
    WITH { screenTime: this_acted_in_relationship.screenTime, node: { __resolveType: "Movie", runtime: this_Movie.runtime, title: this_Movie.title } } AS edge
    RETURN edge
  UNION
    WITH this
    MATCH (this)-[this_acted_in_relationship:ACTED_IN]->(this_Series:Series)
    WITH { screenTime: this_acted_in_relationship.screenTime, node: { __resolveType: "Series", episodes: this_Series.episodes, title: this_Series.title } } AS edge
    RETURN edge
  }
  WITH collect(edge) as edges, count(edge) as totalCount
  RETURN { edges: edges, totalCount: size(edges) } AS actedInConnection
}
RETURN this { actedInConnection } as this
```

### Expected Cypher Params

```json
{}
```

---

## Interface Relationship Query through connection with where

### GraphQL Input

```graphql
query {
    actors {
        actedInConnection(where: { node: { title_STARTS_WITH: "The " }, edge: { screenTime_GT: 60 } }) {
            edges {
                screenTime
                node {
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
}
```

### Expected Cypher Output

```cypher
MATCH (this:Actor)
CALL {
  WITH this
  CALL {
    WITH this
    MATCH (this)-[this_acted_in_relationship:ACTED_IN]->(this_Movie:Movie)
    WHERE this_acted_in_relationship.screenTime > $this_actedInConnection.args.where.edge.screenTime_GT AND this_Movie.title STARTS WITH $this_actedInConnection.args.where.node.title_STARTS_WITH
    WITH { screenTime: this_acted_in_relationship.screenTime, node: { __resolveType: "Movie", runtime: this_Movie.runtime, title: this_Movie.title } } AS edge
    RETURN edge
  UNION
    WITH this
    MATCH (this)-[this_acted_in_relationship:ACTED_IN]->(this_Series:Series)
    WHERE this_acted_in_relationship.screenTime > $this_actedInConnection.args.where.edge.screenTime_GT AND this_Series.title STARTS WITH $this_actedInConnection.args.where.node.title_STARTS_WITH
    WITH { screenTime: this_acted_in_relationship.screenTime, node: { __resolveType: "Series", episodes: this_Series.episodes, title: this_Series.title } } AS edge
    RETURN edge
  }
  WITH collect(edge) as edges, count(edge) as totalCount
  RETURN { edges: edges, totalCount: size(edges) } AS actedInConnection
}
RETURN this { actedInConnection } as this
```

### Expected Cypher Params

```json
{
    "this_actedInConnection": {
        "args": {
            "where": {
                "edge": {
                    "screenTime_GT": {
                        "high": 0,
                        "low": 60
                    }
                },
                "node": {
                    "title_STARTS_WITH": "The "
                }
            }
        }
    }
}
```
