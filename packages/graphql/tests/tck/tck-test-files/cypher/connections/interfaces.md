# Cypher -> Connections -> Interfaces

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

## Projecting interface node and relationship properties with no arguments

### GraphQL Input

```graphql
query {
    actors {
        name
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
RETURN this { .name, actedInConnection } as this
```

### Expected Cypher Params

```json
{}
```

---

## Projecting interface node and relationship properties with common where argument

### GraphQL Input

```graphql
query {
    actors {
        name
        actedInConnection(where: { node: { title_STARTS_WITH: "The " } }) {
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
        WHERE this_Movie.title STARTS WITH $this_actedInConnection.args.where.node.title_STARTS_WITH
        WITH { screenTime: this_acted_in_relationship.screenTime, node: { __resolveType: "Movie", runtime: this_Movie.runtime, title: this_Movie.title } } AS edge
        RETURN edge
    UNION
        WITH this
        MATCH (this)-[this_acted_in_relationship:ACTED_IN]->(this_Series:Series)
        WHERE this_Series.title STARTS WITH $this_actedInConnection.args.where.node.title_STARTS_WITH
        WITH { screenTime: this_acted_in_relationship.screenTime, node: { __resolveType: "Series", episodes: this_Series.episodes, title: this_Series.title } } AS edge
        RETURN edge
    }
    WITH collect(edge) as edges, count(edge) as totalCount
    RETURN { edges: edges, totalCount: size(edges) } AS actedInConnection
}
RETURN this { .name, actedInConnection } as this
```

### Expected Cypher Params

```json
{
    "this_actedInConnection": {
        "args": {
            "where": {
                "node": {
                    "title_STARTS_WITH": "The "
                }
            }
        }
    }
}
```

---

## Projecting interface node and relationship properties with where argument

### GraphQL Input

```graphql
query {
    actors {
        name
        actedInConnection(where: { node: { _onType: { Movie: { runtime_GT: 90 }, Series: { episodes_GT: 50 } } } }) {
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
        WHERE this_Movie.runtime > $this_actedInConnection.args.where.node._onType.Movie.runtime_GT
        WITH { screenTime: this_acted_in_relationship.screenTime, node: { __resolveType: "Movie", runtime: this_Movie.runtime, title: this_Movie.title } } AS edge
        RETURN edge
    UNION
        WITH this
        MATCH (this)-[this_acted_in_relationship:ACTED_IN]->(this_Series:Series)
        WHERE this_Series.episodes > $this_actedInConnection.args.where.node._onType.Series.episodes_GT
        WITH { screenTime: this_acted_in_relationship.screenTime, node: { __resolveType: "Series", episodes: this_Series.episodes, title: this_Series.title } } AS edge
        RETURN edge
    }
    WITH collect(edge) as edges, count(edge) as totalCount
    RETURN { edges: edges, totalCount: size(edges) } AS actedInConnection
}
RETURN this { .name, actedInConnection } as this
```

### Expected Cypher Params

```json
{
    "this_actedInConnection": {
        "args": {
            "where": {
                "node": {
                    "_onType": {
                        "Movie": {
                            "runtime_GT": {
                                "low": 60,
                                "high": 0
                            }
                        },
                        "Series": {
                            "episodes_GT": {
                                "low": 50,
                                "high": 0
                            }
                        }
                    }
                }
            }
        }
    }
}
```

---

## Projecting interface node and relationship properties with where relationship argument

### GraphQL Input

```graphql
query {
    actors {
        name
        actedInConnection(where: { edge: { screenTime_GT: 60 } }) {
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
        WHERE this_acted_in_relationship.screenTime > $this_actedInConnection.args.where.edge.screenTime_GT
        WITH { screenTime: this_acted_in_relationship.screenTime, node: { __resolveType: "Movie", runtime: this_Movie.runtime, title: this_Movie.title } } AS edge
        RETURN edge
    UNION
        WITH this
        MATCH (this)-[this_acted_in_relationship:ACTED_IN]->(this_Series:Series)
        WHERE this_acted_in_relationship.screenTime > $this_actedInConnection.args.where.edge.screenTime_GT
        WITH { screenTime: this_acted_in_relationship.screenTime, node: { __resolveType: "Series", episodes: this_Series.episodes, title: this_Series.title } } AS edge
        RETURN edge
    }
    WITH collect(edge) as edges, count(edge) as totalCount
    RETURN { edges: edges, totalCount: size(edges) } AS actedInConnection
}
RETURN this { .name, actedInConnection } as this
```

### Expected Cypher Params

```json
{
    "this_actedInConnection": {
        "args": {
            "where": {
                "edge": {
                    "screenTime_GT": {
                        "low": 60,
                        "high": 0
                    }
                }
            }
        }
    }
}
```

---
