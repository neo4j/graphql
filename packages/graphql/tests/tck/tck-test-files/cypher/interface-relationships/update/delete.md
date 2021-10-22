# Interface Relationships - Update delete

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

## Update delete an interface relationship

### GraphQL Input

```graphql
mutation {
    updateActors(delete: { actedIn: { where: { node: { title_STARTS_WITH: "The " } } } }) {
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
OPTIONAL MATCH (this)-[this_delete_actedIn_Movie0_relationship:ACTED_IN]->(this_delete_actedIn_Movie0:Movie)
WHERE this_delete_actedIn_Movie0.title STARTS WITH $updateActors.args.delete.actedIn[0].where.node.title_STARTS_WITH

WITH this, collect(DISTINCT this_delete_actedIn_Movie0) as this_delete_actedIn_Movie0_to_delete
FOREACH(x IN this_delete_actedIn_Movie0_to_delete | DETACH DELETE x)

WITH this
OPTIONAL MATCH (this)-[this_delete_actedIn_Series0_relationship:ACTED_IN]->(this_delete_actedIn_Series0:Series)
WHERE this_delete_actedIn_Series0.title STARTS WITH $updateActors.args.delete.actedIn[0].where.node.title_STARTS_WITH

WITH this, collect(DISTINCT this_delete_actedIn_Series0) as this_delete_actedIn_Series0_to_delete
FOREACH(x IN this_delete_actedIn_Series0_to_delete | DETACH DELETE x)

RETURN this { .name } AS this
```

### Expected Cypher Params

```json
{
    "updateActors": {
        "args": {
            "delete": {
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

## Update delete an interface relationship with nested delete

### GraphQL Input

```graphql
mutation {
    updateActors(
        delete: {
            actedIn: {
                where: { node: { title_STARTS_WITH: "The " } }
                delete: { actors: { where: { node: { name: "Actor" } } } }
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
OPTIONAL MATCH (this)-[this_delete_actedIn_Movie0_relationship:ACTED_IN]->(this_delete_actedIn_Movie0:Movie)
WHERE this_delete_actedIn_Movie0.title STARTS WITH $updateActors.args.delete.actedIn[0].where.node.title_STARTS_WITH
WITH this, this_delete_actedIn_Movie0
OPTIONAL MATCH (this_delete_actedIn_Movie0)<-[this_delete_actedIn_Movie0_actors0_relationship:ACTED_IN]-(this_delete_actedIn_Movie0_actors0:Actor)
WHERE this_delete_actedIn_Movie0_actors0.name = $updateActors.args.delete.actedIn[0].delete.actors[0].where.node.name

WITH this, this_delete_actedIn_Movie0, collect(DISTINCT this_delete_actedIn_Movie0_actors0) as this_delete_actedIn_Movie0_actors0_to_delete
FOREACH(x IN this_delete_actedIn_Movie0_actors0_to_delete | DETACH DELETE x)

WITH this, collect(DISTINCT this_delete_actedIn_Movie0) as this_delete_actedIn_Movie0_to_delete
FOREACH(x IN this_delete_actedIn_Movie0_to_delete | DETACH DELETE x)

WITH this
OPTIONAL MATCH (this)-[this_delete_actedIn_Series0_relationship:ACTED_IN]->(this_delete_actedIn_Series0:Series)
WHERE this_delete_actedIn_Series0.title STARTS WITH $updateActors.args.delete.actedIn[0].where.node.title_STARTS_WITH
WITH this, this_delete_actedIn_Series0
OPTIONAL MATCH (this_delete_actedIn_Series0)<-[this_delete_actedIn_Series0_actors0_relationship:ACTED_IN]-(this_delete_actedIn_Series0_actors0:Actor)
WHERE this_delete_actedIn_Series0_actors0.name = $updateActors.args.delete.actedIn[0].delete.actors[0].where.node.name

WITH this, this_delete_actedIn_Series0, collect(DISTINCT this_delete_actedIn_Series0_actors0) as this_delete_actedIn_Series0_actors0_to_delete
FOREACH(x IN this_delete_actedIn_Series0_actors0_to_delete | DETACH DELETE x)

WITH this, collect(DISTINCT this_delete_actedIn_Series0) as this_delete_actedIn_Series0_to_delete
FOREACH(x IN this_delete_actedIn_Series0_to_delete | DETACH DELETE x)

RETURN this { .name } AS this
```

### Expected Cypher Params

```json
{
    "updateActors": {
        "args": {
            "delete": {
                "actedIn": [
                    {
                        "where": {
                            "node": {
                                "title_STARTS_WITH": "The "
                            }
                        },
                        "delete": {
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

## Update delete an interface relationship with nested delete using \_on to delete from only one implementation

### GraphQL Input

```graphql
mutation {
    updateActors(
        delete: {
            actedIn: {
                where: { node: { title_STARTS_WITH: "The " } }
                delete: { _on: { Movie: { actors: { where: { node: { name: "Actor" } } } } } }
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
OPTIONAL MATCH (this)-[this_delete_actedIn_Movie0_relationship:ACTED_IN]->(this_delete_actedIn_Movie0:Movie)
WHERE this_delete_actedIn_Movie0.title STARTS WITH $updateActors.args.delete.actedIn[0].where.node.title_STARTS_WITH
WITH this, this_delete_actedIn_Movie0
OPTIONAL MATCH (this_delete_actedIn_Movie0)<-[this_delete_actedIn_Movie0_actors0_relationship:ACTED_IN]-(this_delete_actedIn_Movie0_actors0:Actor)
WHERE this_delete_actedIn_Movie0_actors0.name = $updateActors.args.delete.actedIn[0].delete._on.Movie[0].actors[0].where.node.name

WITH this, this_delete_actedIn_Movie0, collect(DISTINCT this_delete_actedIn_Movie0_actors0) as this_delete_actedIn_Movie0_actors0_to_delete
FOREACH(x IN this_delete_actedIn_Movie0_actors0_to_delete | DETACH DELETE x)

WITH this, collect(DISTINCT this_delete_actedIn_Movie0) as this_delete_actedIn_Movie0_to_delete
FOREACH(x IN this_delete_actedIn_Movie0_to_delete | DETACH DELETE x)

WITH this
OPTIONAL MATCH (this)-[this_delete_actedIn_Series0_relationship:ACTED_IN]->(this_delete_actedIn_Series0:Series)
WHERE this_delete_actedIn_Series0.title STARTS WITH $updateActors.args.delete.actedIn[0].where.node.title_STARTS_WITH

WITH this, collect(DISTINCT this_delete_actedIn_Series0) as this_delete_actedIn_Series0_to_delete
FOREACH(x IN this_delete_actedIn_Series0_to_delete | DETACH DELETE x)

RETURN this { .name } AS this
```

### Expected Cypher Params

```json
{
    "updateActors": {
        "args": {
            "delete": {
                "actedIn": [
                    {
                        "where": {
                            "node": {
                                "title_STARTS_WITH": "The "
                            }
                        },
                        "delete": {
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

## Update delete an interface relationship with nested delete using \_on to override deletion

### GraphQL Input

```graphql
mutation {
    updateActors(
        delete: {
            actedIn: {
                where: { node: { title_STARTS_WITH: "The " } }
                delete: {
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
OPTIONAL MATCH (this)-[this_delete_actedIn_Movie0_relationship:ACTED_IN]->(this_delete_actedIn_Movie0:Movie)
WHERE this_delete_actedIn_Movie0.title STARTS WITH $updateActors.args.delete.actedIn[0].where.node.title_STARTS_WITH
WITH this, this_delete_actedIn_Movie0
OPTIONAL MATCH (this_delete_actedIn_Movie0)<-[this_delete_actedIn_Movie0_actors0_relationship:ACTED_IN]-(this_delete_actedIn_Movie0_actors0:Actor)
WHERE this_delete_actedIn_Movie0_actors0.name = $updateActors.args.delete.actedIn[0].delete._on.Movie[0].actors[0].where.node.name

WITH this, this_delete_actedIn_Movie0, collect(DISTINCT this_delete_actedIn_Movie0_actors0) as this_delete_actedIn_Movie0_actors0_to_delete
FOREACH(x IN this_delete_actedIn_Movie0_actors0_to_delete | DETACH DELETE x)

WITH this, collect(DISTINCT this_delete_actedIn_Movie0) as this_delete_actedIn_Movie0_to_delete
FOREACH(x IN this_delete_actedIn_Movie0_to_delete | DETACH DELETE x)

WITH this
OPTIONAL MATCH (this)-[this_delete_actedIn_Series0_relationship:ACTED_IN]->(this_delete_actedIn_Series0:Series)
WHERE this_delete_actedIn_Series0.title STARTS WITH $updateActors.args.delete.actedIn[0].where.node.title_STARTS_WITH
WITH this, this_delete_actedIn_Series0
OPTIONAL MATCH (this_delete_actedIn_Series0)<-[this_delete_actedIn_Series0_actors0_relationship:ACTED_IN]-(this_delete_actedIn_Series0_actors0:Actor)
WHERE this_delete_actedIn_Series0_actors0.name = $updateActors.args.delete.actedIn[0].delete.actors[0].where.node.name

WITH this, this_delete_actedIn_Series0, collect(DISTINCT this_delete_actedIn_Series0_actors0) as this_delete_actedIn_Series0_actors0_to_delete
FOREACH(x IN this_delete_actedIn_Series0_actors0_to_delete | DETACH DELETE x)

WITH this, collect(DISTINCT this_delete_actedIn_Series0) as this_delete_actedIn_Series0_to_delete
FOREACH(x IN this_delete_actedIn_Series0_to_delete | DETACH DELETE x)

RETURN this { .name } AS this
```

### Expected Cypher Params

```json
{
    "updateActors": {
        "args": {
            "delete": {
                "actedIn": [
                    {
                        "where": {
                            "node": {
                                "title_STARTS_WITH": "The "
                            }
                        },
                        "delete": {
                            "actors": [
                                {
                                    "where": {
                                        "node": {
                                            "name": "Actor"
                                        }
                                    }
                                }
                            ],
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
                            }
                        }
                    }
                ]
            }
        }
    }
}
```
