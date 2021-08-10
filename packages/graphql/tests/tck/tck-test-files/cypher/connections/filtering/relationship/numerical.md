# Cypher -> Connections -> Filtering -> Relationship -> Numerical

Schema:

```graphql
type Movie {
    title: String!
    actors: [Actor!]!
        @relationship(type: "ACTED_IN", properties: "ActedIn", direction: IN)
}

type Actor {
    name: String!
    movies: [Movie!]!
        @relationship(type: "ACTED_IN", properties: "ActedIn", direction: OUT)
}

interface ActedIn {
    screenTime: Int!
}
```

---

## LT

### GraphQL Input

```graphql
query {
    movies {
        title
        actorsConnection(where: { edge: { screenTime_LT: 60 } }) {
            edges {
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
    WHERE this_acted_in.screenTime < $this_actorsConnection.args.where.edge.screenTime_LT
    WITH collect({ screenTime: this_acted_in.screenTime, node: { name: this_actor.name } }) AS edges
    RETURN { edges: edges, totalCount: size(edges) } AS actorsConnection
}
RETURN this { .title, actorsConnection } as this
```

### Expected Cypher Params

```json
{
    "this_actorsConnection": {
        "args": {
            "where": {
                "edge": {
                    "screenTime_LT": {
                        "high": 0,
                        "low": 60
                    }
                }
            }
        }
    }
}
```

---

## LTE

### GraphQL Input

```graphql
query {
    movies {
        title
        actorsConnection(where: { edge: { screenTime_LTE: 60 } }) {
            edges {
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
    WHERE this_acted_in.screenTime <= $this_actorsConnection.args.where.edge.screenTime_LTE
    WITH collect({ screenTime: this_acted_in.screenTime, node: { name: this_actor.name } }) AS edges
    RETURN { edges: edges, totalCount: size(edges) } AS actorsConnection
}
RETURN this { .title, actorsConnection } as this
```

### Expected Cypher Params

```json
{
    "this_actorsConnection": {
        "args": {
            "where": {
                "edge": {
                    "screenTime_LTE": {
                        "high": 0,
                        "low": 60
                    }
                }
            }
        }
    }
}
```

---

## GT

### GraphQL Input

```graphql
query {
    movies {
        title
        actorsConnection(where: { edge: { screenTime_GT: 60 } }) {
            edges {
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
    WHERE this_acted_in.screenTime > $this_actorsConnection.args.where.edge.screenTime_GT
    WITH collect({ screenTime: this_acted_in.screenTime, node: { name: this_actor.name } }) AS edges
    RETURN { edges: edges, totalCount: size(edges) } AS actorsConnection
}
RETURN this { .title, actorsConnection } as this
```

### Expected Cypher Params

```json
{
    "this_actorsConnection": {
        "args": {
            "where": {
                "edge": {
                    "screenTime_GT": {
                        "high": 0,
                        "low": 60
                    }
                }
            }
        }
    }
}
```

---

## GTE

### GraphQL Input

```graphql
query {
    movies {
        title
        actorsConnection(where: { edge: { screenTime_GTE: 60 } }) {
            edges {
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
    WHERE this_acted_in.screenTime >= $this_actorsConnection.args.where.edge.screenTime_GTE
    WITH collect({ screenTime: this_acted_in.screenTime, node: { name: this_actor.name } }) AS edges
    RETURN { edges: edges, totalCount: size(edges) } AS actorsConnection
}
RETURN this { .title, actorsConnection } as this
```

### Expected Cypher Params

```json
{
    "this_actorsConnection": {
        "args": {
            "where": {
                "edge": {
                    "screenTime_GTE": {
                        "high": 0,
                        "low": 60
                    }
                }
            }
        }
    }
}
```

---
