# Interface Relationships - Update disconnect

Tests Cypher output for interface relationship fields

Schema:

```graphql
interface Production {
    title: String!
    actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN, properties: "ActedIn")
}

type Movie implements Production {
    title: String!
    runtime: Int!
    actors: [Actor!]!
}

type Series implements Production {
    title: String!
    episodes: Int!
    actors: [Actor!]!
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

## Update disconnect from an interface relationship

### GraphQL Input

```graphql
mutation {
    updateActors(disconnect: { actedIn: { where: { node: { title_STARTS_WITH: "The " } } } }) {
        actors {
            name
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
    OPTIONAL MATCH (this)-[this_disconnect_actedIn0_rel:ACTED_IN]->(this_disconnect_actedIn0:Movie)
    WHERE this_disconnect_actedIn0.title STARTS WITH $updateActors.args.disconnect.actedIn[0].where.node.title_STARTS_WITH
    FOREACH(_ IN CASE this_disconnect_actedIn0 WHEN NULL THEN [] ELSE [1] END |
        DELETE this_disconnect_actedIn0_rel
    )
    RETURN count(*)
UNION
    WITH this
    OPTIONAL MATCH (this)-[this_disconnect_actedIn0_rel:ACTED_IN]->(this_disconnect_actedIn0:Series)
    WHERE this_disconnect_actedIn0.title STARTS WITH $updateActors.args.disconnect.actedIn[0].where.node.title_STARTS_WITH
    FOREACH(_ IN CASE this_disconnect_actedIn0 WHEN NULL THEN [] ELSE [1] END |
        DELETE this_disconnect_actedIn0_rel
    )
    RETURN count(*)
}
RETURN this { .name } AS this

```

### Expected Cypher Params

```json
{
    "updateActors": {
        "args": {
            "disconnect": {
                "actedIn": [
                    {
                        "where": {
                            "node": {
                                "title_STARTS_WITH": "The "
                            }
                        }
                    }
                ]
            }
        }
    }
}
```

---

## Update disconnect from an interface relationship with nested disconnect

### GraphQL Input

```graphql
mutation {
    updateActors(
        disconnect: {
            actedIn: {
                where: { node: { title_STARTS_WITH: "The " } }
                disconnect: { actors: { where: { node: { name: "Actor" } } } }
            }
        }
    ) {
        actors {
            name
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
    OPTIONAL MATCH (this)-[this_disconnect_actedIn0_rel:ACTED_IN]->(this_disconnect_actedIn0:Movie)
    WHERE this_disconnect_actedIn0.title STARTS WITH $updateActors.args.disconnect.actedIn[0].where.node.title_STARTS_WITH
    FOREACH(_ IN CASE this_disconnect_actedIn0 WHEN NULL THEN [] ELSE [1] END |
        DELETE this_disconnect_actedIn0_rel
    )
    WITH this, this_disconnect_actedIn0
    CALL {
        WITH this, this_disconnect_actedIn0
        OPTIONAL MATCH (this_disconnect_actedIn0)<-[this_disconnect_actedIn0_actors0_rel:ACTED_IN]-(this_disconnect_actedIn0_actors0:Actor)
        WHERE this_disconnect_actedIn0_actors0.name = $updateActors.args.disconnect.actedIn[0].disconnect.actors[0].where.node.name
        FOREACH(_ IN CASE this_disconnect_actedIn0_actors0 WHEN NULL THEN [] ELSE [1] END |
            DELETE this_disconnect_actedIn0_actors0_rel
        )
        RETURN count(*)
    }
    RETURN count(*)
UNION
    WITH this
    OPTIONAL MATCH (this)-[this_disconnect_actedIn0_rel:ACTED_IN]->(this_disconnect_actedIn0:Series)
    WHERE this_disconnect_actedIn0.title STARTS WITH $updateActors.args.disconnect.actedIn[0].where.node.title_STARTS_WITH
    FOREACH(_ IN CASE this_disconnect_actedIn0 WHEN NULL THEN [] ELSE [1] END |
        DELETE this_disconnect_actedIn0_rel
    )
    WITH this, this_disconnect_actedIn0
    CALL {
        WITH this, this_disconnect_actedIn0
        OPTIONAL MATCH (this_disconnect_actedIn0)<-[this_disconnect_actedIn0_actors0_rel:ACTED_IN]-(this_disconnect_actedIn0_actors0:Actor)
        WHERE this_disconnect_actedIn0_actors0.name = $updateActors.args.disconnect.actedIn[0].disconnect.actors[0].where.node.name
        FOREACH(_ IN CASE this_disconnect_actedIn0_actors0 WHEN NULL THEN [] ELSE [1] END |
            DELETE this_disconnect_actedIn0_actors0_rel
        )
        RETURN count(*)
    }
    RETURN count(*)
}
RETURN this { .name } AS this

```

### Expected Cypher Params

```json
{
    "updateActors": {
        "args": {
            "disconnect": {
                "actedIn": [
                    {
                        "where": {
                            "node": {
                                "title_STARTS_WITH": "The "
                            }
                        },
                        "disconnect": {
                            "actors": [
                                {
                                    "where": {
                                        "node": {
                                            "name": "Actor"
                                        }
                                    }
                                }
                            ]
                        }
                    }
                ]
            }
        }
    }
}
```

---

## Update disconnect from an interface relationship with nested disconnect using \_on to disconnect from only one implementation

### GraphQL Input

```graphql
mutation {
    updateActors(
        disconnect: {
            actedIn: {
                where: { node: { title_STARTS_WITH: "The " } }
                disconnect: { _on: { Movie: { actors: { where: { node: { name: "Actor" } } } } } }
            }
        }
    ) {
        actors {
            name
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
    OPTIONAL MATCH (this)-[this_disconnect_actedIn0_rel:ACTED_IN]->(this_disconnect_actedIn0:Movie)
    WHERE this_disconnect_actedIn0.title STARTS WITH $updateActors.args.disconnect.actedIn[0].where.node.title_STARTS_WITH
    FOREACH(_ IN CASE this_disconnect_actedIn0 WHEN NULL THEN [] ELSE [1] END |
        DELETE this_disconnect_actedIn0_rel
    )
    WITH this, this_disconnect_actedIn0
    CALL {
        WITH this, this_disconnect_actedIn0
        OPTIONAL MATCH (this_disconnect_actedIn0)<-[this_disconnect_actedIn0_actors0_rel:ACTED_IN]-(this_disconnect_actedIn0_actors0:Actor)
        WHERE this_disconnect_actedIn0_actors0.name = $updateActors.args.disconnect.actedIn[0].disconnect._on.Movie[0].actors[0].where.node.name
        FOREACH(_ IN CASE this_disconnect_actedIn0_actors0 WHEN NULL THEN [] ELSE [1] END |
            DELETE this_disconnect_actedIn0_actors0_rel
        )
        RETURN count(*)
    }
    RETURN count(*)
UNION
    WITH this
    OPTIONAL MATCH (this)-[this_disconnect_actedIn0_rel:ACTED_IN]->(this_disconnect_actedIn0:Series)
    WHERE this_disconnect_actedIn0.title STARTS WITH $updateActors.args.disconnect.actedIn[0].where.node.title_STARTS_WITH
    FOREACH(_ IN CASE this_disconnect_actedIn0 WHEN NULL THEN [] ELSE [1] END |
        DELETE this_disconnect_actedIn0_rel
    )
    RETURN count(*)
}
RETURN this { .name } AS this

```

### Expected Cypher Params

```json
{
    "updateActors": {
        "args": {
            "disconnect": {
                "actedIn": [
                    {
                        "where": {
                            "node": {
                                "title_STARTS_WITH": "The "
                            }
                        },
                        "disconnect": {
                            "_on": {
                                "Movie": [
                                    {
                                        "actors": [
                                            {
                                                "where": {
                                                    "node": {
                                                        "name": "Actor"
                                                    }
                                                }
                                            }
                                        ]
                                    }
                                ]
                            }
                        }
                    }
                ]
            }
        }
    }
}
```

---

## Update disconnect from an interface relationship with nested disconnect using \_on to override disconnection

### GraphQL Input

```graphql
mutation {
    updateActors(
        disconnect: {
            actedIn: {
                where: { node: { title_STARTS_WITH: "The " } }
                disconnect: {
                    actors: { where: { node: { name: "Actor" } } }
                    _on: { Movie: { actors: { where: { node: { name: "Different Actor" } } } } }
                }
            }
        }
    ) {
        actors {
            name
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
    OPTIONAL MATCH (this)-[this_disconnect_actedIn0_rel:ACTED_IN]->(this_disconnect_actedIn0:Movie)
    WHERE this_disconnect_actedIn0.title STARTS WITH $updateActors.args.disconnect.actedIn[0].where.node.title_STARTS_WITH
    FOREACH(_ IN CASE this_disconnect_actedIn0 WHEN NULL THEN [] ELSE [1] END |
        DELETE this_disconnect_actedIn0_rel
    )
    WITH this, this_disconnect_actedIn0
    CALL {
        WITH this, this_disconnect_actedIn0
        OPTIONAL MATCH (this_disconnect_actedIn0)<-[this_disconnect_actedIn0_actors0_rel:ACTED_IN]-(this_disconnect_actedIn0_actors0:Actor)
        WHERE this_disconnect_actedIn0_actors0.name = $updateActors.args.disconnect.actedIn[0].disconnect._on.Movie[0].actors[0].where.node.name
        FOREACH(_ IN CASE this_disconnect_actedIn0_actors0 WHEN NULL THEN [] ELSE [1] END |
            DELETE this_disconnect_actedIn0_actors0_rel
        )
        RETURN count(*)
    }
    RETURN count(*)
UNION
    WITH this
    OPTIONAL MATCH (this)-[this_disconnect_actedIn0_rel:ACTED_IN]->(this_disconnect_actedIn0:Series)
    WHERE this_disconnect_actedIn0.title STARTS WITH $updateActors.args.disconnect.actedIn[0].where.node.title_STARTS_WITH
    FOREACH(_ IN CASE this_disconnect_actedIn0 WHEN NULL THEN [] ELSE [1] END |
        DELETE this_disconnect_actedIn0_rel
    )
    WITH this, this_disconnect_actedIn0
    CALL {
        WITH this, this_disconnect_actedIn0
        OPTIONAL MATCH (this_disconnect_actedIn0)<-[this_disconnect_actedIn0_actors0_rel:ACTED_IN]-(this_disconnect_actedIn0_actors0:Actor)
        WHERE this_disconnect_actedIn0_actors0.name = $updateActors.args.disconnect.actedIn[0].disconnect.actors[0].where.node.name
        FOREACH(_ IN CASE this_disconnect_actedIn0_actors0 WHEN NULL THEN [] ELSE [1] END |
            DELETE this_disconnect_actedIn0_actors0_rel
        )
        RETURN count(*)
    }
    RETURN count(*)
}
RETURN this { .name } AS this

```

### Expected Cypher Params

```json
{
    "updateActors": {
        "args": {
            "disconnect": {
                "actedIn": [
                    {
                        "where": {
                            "node": {
                                "title_STARTS_WITH": "The "
                            }
                        },
                        "disconnect": {
                            "_on": {
                                "Movie": [
                                    {
                                        "actors": [
                                            {
                                                "where": {
                                                    "node": {
                                                        "name": "Different Actor"
                                                    }
                                                }
                                            }
                                        ]
                                    }
                                ]
                            },
                            "actors": [
                                {
                                    "where": {
                                        "node": {
                                            "name": "Actor"
                                        }
                                    }
                                }
                            ]
                        }
                    }
                ]
            }
        }
    }
}
```
