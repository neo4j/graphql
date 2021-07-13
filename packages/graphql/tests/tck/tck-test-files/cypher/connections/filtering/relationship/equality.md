# Cypher -> Connections -> Filtering -> Relationship -> Equality

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

## Equality

### GraphQL Input

```graphql
query {
    movies {
        title
        actorsConnection(where: { relationship: { screenTime: 60 } }) {
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
    WHERE this_acted_in.screenTime = $this_actorsConnection.args.where.relationship.screenTime
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
                "relationship": {
                    "screenTime": {
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

## Inequality

### GraphQL Input

```graphql
query {
    movies {
        title
        actorsConnection(where: { relationship: { screenTime_NOT: 60 } }) {
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
    WHERE (NOT this_acted_in.screenTime = $this_actorsConnection.args.where.relationship.screenTime_NOT)
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
                "relationship": {
                    "screenTime_NOT": {
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
