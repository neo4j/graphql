# Cypher -> Connections -> Filtering -> Node -> Numerical

Schema:

```graphql
type Movie {
    title: String!
    actors: [Actor!]!
        @relationship(type: "ACTED_IN", properties: "ActedIn", direction: IN)
}

type Actor {
    name: String!
    age: Int!
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
        actorsConnection(where: { node: { age_LT: 60 } }) {
            edges {
                screenTime
                node {
                    name
                    age
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
    MATCH (this)<-[this_acted_in_relationship:ACTED_IN]-(this_actor:Actor)
    WHERE this_actor.age < $this_actorsConnection.args.where.node.age_LT
    WITH collect({ screenTime: this_acted_in_relationship.screenTime, node: { name: this_actor.name, age: this_actor.age } }) AS edges
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
                "node": {
                    "age_LT": {
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
        actorsConnection(where: { node: { age_LTE: 60 } }) {
            edges {
                screenTime
                node {
                    name
                    age
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
    MATCH (this)<-[this_acted_in_relationship:ACTED_IN]-(this_actor:Actor)
    WHERE this_actor.age <= $this_actorsConnection.args.where.node.age_LTE
    WITH collect({ screenTime: this_acted_in_relationship.screenTime, node: { name: this_actor.name, age: this_actor.age } }) AS edges
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
                "node": {
                    "age_LTE": {
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
        actorsConnection(where: { node: { age_GT: 60 } }) {
            edges {
                screenTime
                node {
                    name
                    age
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
    MATCH (this)<-[this_acted_in_relationship:ACTED_IN]-(this_actor:Actor)
    WHERE this_actor.age > $this_actorsConnection.args.where.node.age_GT
    WITH collect({ screenTime: this_acted_in_relationship.screenTime, node: { name: this_actor.name, age: this_actor.age } }) AS edges
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
                "node": {
                    "age_GT": {
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
        actorsConnection(where: { node: { age_GTE: 60 } }) {
            edges {
                screenTime
                node {
                    name
                    age
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
    MATCH (this)<-[this_acted_in_relationship:ACTED_IN]-(this_actor:Actor)
    WHERE this_actor.age >= $this_actorsConnection.args.where.node.age_GTE
    WITH collect({ screenTime: this_acted_in_relationship.screenTime, node: { name: this_actor.name, age: this_actor.age } }) AS edges
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
                "node": {
                    "age_GTE": {
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
