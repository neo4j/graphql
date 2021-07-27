# Nested Unions

Tests for edge cases where either end of a relationship might be a union.

Schema:

```graphql
type Movie {
    title: String!
    actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN)
}

type Series {
    name: String!
    actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN)
}

union Production = Movie | Series

type LeadActor {
    name: String!
    actedIn: [Production!]! @relationship(type: "ACTED_IN", direction: OUT)
}

type Extra {
    name: String
    actedIn: [Production!]! @relationship(type: "ACTED_IN", direction: OUT)
}

union Actor = LeadActor | Extra
```

---

## Nested Unions - Connect -> Connect

### GraphQL Input

```graphql
mutation {
    updateMovies(
        where: { title: "Movie" }
        connect: {
            actors: {
                LeadActor: {
                    where: { node: { name: "Actor" } }
                    connect: {
                        actedIn: {
                            Series: { where: { node: { name: "Series" } } }
                        }
                    }
                }
            }
        }
    ) {
        movies {
            title
            actors {
                ... on LeadActor {
                    name
                    actedIn {
                        ... on Series {
                            name
                        }
                    }
                }
            }
        }
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Movie)
WHERE this.title = $this_title
WITH this
CALL {
    WITH this
    OPTIONAL MATCH (this_connect_actors_LeadActor0_node:LeadActor)
    WHERE this_connect_actors_LeadActor0_node.name = $this_connect_actors_LeadActor0_node_name
    FOREACH(_ IN CASE this_connect_actors_LeadActor0_node WHEN NULL THEN [] ELSE [1] END | MERGE (this)<-[:ACTED_IN]-(this_connect_actors_LeadActor0_node) )
    WITH this, this_connect_actors_LeadActor0_node
    CALL {
        WITH this, this_connect_actors_LeadActor0_node
        OPTIONAL MATCH (this_connect_actors_LeadActor0_node_actedIn_Series0_node:Series)
        WHERE this_connect_actors_LeadActor0_node_actedIn_Series0_node.name = $this_connect_actors_LeadActor0_node_actedIn_Series0_node_name
        FOREACH(_ IN CASE this_connect_actors_LeadActor0_node_actedIn_Series0_node WHEN NULL THEN [] ELSE [1] END | MERGE (this_connect_actors_LeadActor0_node)-[:ACTED_IN]->(this_connect_actors_LeadActor0_node_actedIn_Series0_node) )
        RETURN count(*)
    }
    RETURN count(*)
}
RETURN this { .title, actors: [(this)<-[:ACTED_IN]-(this_actors) WHERE "LeadActor" IN labels(this_actors) OR "Extra" IN labels(this_actors) | head( [ this_actors IN [this_actors] WHERE "LeadActor" IN labels (this_actors) | this_actors { __resolveType: "LeadActor", .name, actedIn: [(this_actors)-[:ACTED_IN]->(this_actors_actedIn) WHERE "Movie" IN labels(this_actors_actedIn) OR "Series" IN labels(this_actors_actedIn) | head( [ this_actors_actedIn IN [this_actors_actedIn] WHERE "Movie" IN labels (this_actors_actedIn) | this_actors_actedIn { __resolveType: "Movie" } ] + [ this_actors_actedIn IN [this_actors_actedIn] WHERE "Series" IN labels (this_actors_actedIn) | this_actors_actedIn { __resolveType: "Series", .name } ] ) ] } ] + [ this_actors IN [this_actors] WHERE "Extra" IN labels (this_actors) | this_actors { __resolveType: "Extra" } ] ) ] } AS this
```

### Expected Cypher Params

```json
{
    "this_connect_actors_LeadActor0_node_actedIn_Series0_node_name": "Series",
    "this_connect_actors_LeadActor0_node_name": "Actor",
    "this_title": "Movie"
}
```

---

## Nested Unions - Disconnect -> Disconnect

### GraphQL Input

```graphql
mutation {
    updateMovies(
        where: { title: "Movie" }
        disconnect: {
            actors: {
                LeadActor: {
                    where: { node: { name: "Actor" } }
                    disconnect: {
                        actedIn: {
                            Series: { where: { node: { name: "Series" } } }
                        }
                    }
                }
            }
        }
    ) {
        movies {
            title
            actors {
                ... on LeadActor {
                    name
                    actedIn {
                        ... on Series {
                            name
                        }
                    }
                }
            }
        }
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Movie)
WHERE this.title = $this_title WITH this
OPTIONAL MATCH (this)<-[this_disconnect_actors_LeadActor0_rel:ACTED_IN]-(this_disconnect_actors_LeadActor0:LeadActor)
WHERE this_disconnect_actors_LeadActor0.name = $updateMovies.args.disconnect.actors.LeadActor[0].where.node.name
FOREACH(_ IN CASE this_disconnect_actors_LeadActor0 WHEN NULL THEN [] ELSE [1] END | DELETE this_disconnect_actors_LeadActor0_rel )
WITH this, this_disconnect_actors_LeadActor0
OPTIONAL MATCH (this_disconnect_actors_LeadActor0)-[this_disconnect_actors_LeadActor0_actedIn_Series0_rel:ACTED_IN]->(this_disconnect_actors_LeadActor0_actedIn_Series0:Series)
WHERE this_disconnect_actors_LeadActor0_actedIn_Series0.name = $updateMovies.args.disconnect.actors.LeadActor[0].disconnect.actedIn.Series[0].where.node.name
FOREACH(_ IN CASE this_disconnect_actors_LeadActor0_actedIn_Series0 WHEN NULL THEN [] ELSE [1] END | DELETE this_disconnect_actors_LeadActor0_actedIn_Series0_rel )
RETURN this { .title, actors: [(this)<-[:ACTED_IN]-(this_actors) WHERE "LeadActor" IN labels(this_actors) OR "Extra" IN labels(this_actors) | head( [ this_actors IN [this_actors] WHERE "LeadActor" IN labels (this_actors) | this_actors { __resolveType: "LeadActor", .name, actedIn: [(this_actors)-[:ACTED_IN]->(this_actors_actedIn) WHERE "Movie" IN labels(this_actors_actedIn) OR "Series" IN labels(this_actors_actedIn) | head( [ this_actors_actedIn IN [this_actors_actedIn] WHERE "Movie" IN labels (this_actors_actedIn) | this_actors_actedIn { __resolveType: "Movie" } ] + [ this_actors_actedIn IN [this_actors_actedIn] WHERE "Series" IN labels (this_actors_actedIn) | this_actors_actedIn { __resolveType: "Series", .name } ] ) ] } ] + [ this_actors IN [this_actors] WHERE "Extra" IN labels (this_actors) | this_actors { __resolveType: "Extra" } ] ) ] } AS this
```

### Expected Cypher Params

```json
{
    "this_title": "Movie",
    "updateMovies": {
        "args": {
            "disconnect": {
                "actors": {
                    "LeadActor": [
                        {
                            "disconnect": {
                                "actedIn": {
                                    "Series": [
                                        {
                                            "where": {
                                                "node": {
                                                    "name": "Series"
                                                }
                                            }
                                        }
                                    ]
                                }
                            },
                            "where": {
                                "node": {
                                    "name": "Actor"
                                }
                            }
                        }
                    ]
                }
            }
        }
    }
}
```

---
