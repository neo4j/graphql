## Cypher -> Connections -> Filtering -> Relationship -> Numerical

Schema:

```schema
type Movie {
  title: String!
  actors: [Actor!]! @relationship(type: "ACTED_IN", properties: "ActedIn", direction: IN)
}

type Actor {
  name: String!
  movies: [Movie!]! @relationship(type: "ACTED_IN", properties: "ActedIn", direction: OUT)
}

interface ActedIn {
  screenTime: Int!
}
```

---

### LT

**GraphQL input**

```graphql
query {
    movies {
        title
        actorsConnection(where: { relationship: { screenTime_LT: 60 } }) {
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

**Expected Cypher output**

```cypher
MATCH (this:Movie)
CALL {
    WITH this
    MATCH (this)<-[this_acted_in:ACTED_IN]-(this_actor:Actor)
    WHERE this_acted_in.screenTime < $this_actorsConnection.args.where.relationship.screenTime_LT
    WITH collect({ screenTime: this_acted_in.screenTime, node: { name: this_actor.name } }) AS edges
    RETURN { edges: edges } AS actorsConnection
}
RETURN this { .title, actorsConnection } as this
```

**Expected Cypher params**

```cypher-params
{
    "this_actorsConnection": {
        "args": {
            "where": {
                "relationship": {
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

### LTE

**GraphQL input**

```graphql
query {
    movies {
        title
        actorsConnection(where: { relationship: { screenTime_LTE: 60 } }) {
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

**Expected Cypher output**

```cypher
MATCH (this:Movie)
CALL {
    WITH this
    MATCH (this)<-[this_acted_in:ACTED_IN]-(this_actor:Actor)
    WHERE this_acted_in.screenTime <= $this_actorsConnection.args.where.relationship.screenTime_LTE
    WITH collect({ screenTime: this_acted_in.screenTime, node: { name: this_actor.name } }) AS edges
    RETURN { edges: edges } AS actorsConnection
}
RETURN this { .title, actorsConnection } as this
```

**Expected Cypher params**

```cypher-params
{
    "this_actorsConnection": {
        "args": {
            "where": {
                "relationship": {
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

### GT

**GraphQL input**

```graphql
query {
    movies {
        title
        actorsConnection(where: { relationship: { screenTime_GT: 60 } }) {
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

**Expected Cypher output**

```cypher
MATCH (this:Movie)
CALL {
    WITH this
    MATCH (this)<-[this_acted_in:ACTED_IN]-(this_actor:Actor)
    WHERE this_acted_in.screenTime > $this_actorsConnection.args.where.relationship.screenTime_GT
    WITH collect({ screenTime: this_acted_in.screenTime, node: { name: this_actor.name } }) AS edges
    RETURN { edges: edges } AS actorsConnection
}
RETURN this { .title, actorsConnection } as this
```

**Expected Cypher params**

```cypher-params
{
    "this_actorsConnection": {
        "args": {
            "where": {
                "relationship": {
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

### GTE

**GraphQL input**

```graphql
query {
    movies {
        title
        actorsConnection(where: { relationship: { screenTime_GTE: 60 } }) {
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

**Expected Cypher output**

```cypher
MATCH (this:Movie)
CALL {
    WITH this
    MATCH (this)<-[this_acted_in:ACTED_IN]-(this_actor:Actor)
    WHERE this_acted_in.screenTime >= $this_actorsConnection.args.where.relationship.screenTime_GTE
    WITH collect({ screenTime: this_acted_in.screenTime, node: { name: this_actor.name } }) AS edges
    RETURN { edges: edges } AS actorsConnection
}
RETURN this { .title, actorsConnection } as this
```

**Expected Cypher params**

```cypher-params
{
    "this_actorsConnection": {
        "args": {
            "where": {
                "relationship": {
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
