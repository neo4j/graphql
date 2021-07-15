# Cypher -> Connections -> Filtering -> Relationship -> Arrays

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
    quotes: [String!]
}
```

---

## IN

### GraphQL Input

```graphql
query {
    movies {
        title
        actorsConnection(where: { relationship: { screenTime_IN: [60, 70] } }) {
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
    WHERE this_acted_in.screenTime IN $this_actorsConnection.args.where.relationship.screenTime_IN
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
                    "screenTime_IN": [
                        {
                            "high": 0,
                            "low": 60
                        },
                        {
                            "high": 0,
                            "low": 70
                        }
                    ]
                }
            }
        }
    }
}
```

---

## NOT_IN

### GraphQL Input

```graphql
query {
    movies {
        title
        actorsConnection(
            where: { relationship: { screenTime_NOT_IN: [60, 70] } }
        ) {
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
    WHERE (NOT this_acted_in.screenTime IN $this_actorsConnection.args.where.relationship.screenTime_NOT_IN)
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
                    "screenTime_NOT_IN": [
                        {
                            "high": 0,
                            "low": 60
                        },
                        {
                            "high": 0,
                            "low": 70
                        }
                    ]
                }
            }
        }
    }
}
```

---

## INCLUDES

### GraphQL Input

```graphql
query {
    movies {
        title
        actorsConnection(
            where: {
                relationship: {
                    quotes_INCLUDES: "Life is like a box of chocolates"
                }
            }
        ) {
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
    WHERE $this_actorsConnection.args.where.relationship.quotes_INCLUDES IN this_acted_in.quotes
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
                    "quotes_INCLUDES": "Life is like a box of chocolates"
                }
            }
        }
    }
}
```

---

## NOT_INCLUDES

### GraphQL Input

```graphql
query {
    movies {
        title
        actorsConnection(
            where: {
                relationship: {
                    quotes_NOT_INCLUDES: "Life is like a box of chocolates"
                }
            }
        ) {
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
    WHERE (NOT $this_actorsConnection.args.where.relationship.quotes_NOT_INCLUDES IN this_acted_in.quotes)
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
                    "quotes_NOT_INCLUDES": "Life is like a box of chocolates"
                }
            }
        }
    }
}
```

---
