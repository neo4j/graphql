# Interface Relationships - Update update

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

## Update update an interface relationship

### GraphQL Input

```graphql
mutation {
    updateActors(
        update: { actedIn: { where: { node: { title: "Old Title" } }, update: { node: { title: "New Title" } } } }
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
    OPTIONAL MATCH (this)-[this_acted_in0_relationship:ACTED_IN]->(this_actedIn0:Movie)
    WHERE this_actedIn0.title = $updateActors.args.update.actedIn[0].where.node.title
    CALL apoc.do.when(this_actedIn0 IS NOT NULL, " SET this_actedIn0.title = $this_update_actedIn0_title RETURN count(*) ", "", {this:this, updateActors: $updateActors, this_actedIn0:this_actedIn0, auth:$auth,this_update_actedIn0_title:$this_update_actedIn0_title}) YIELD value as _
    RETURN count(*)
UNION
    WITH this
    OPTIONAL MATCH (this)-[this_acted_in0_relationship:ACTED_IN]->(this_actedIn0:Series) WHERE this_actedIn0.title = $updateActors.args.update.actedIn[0].where.node.title
    CALL apoc.do.when(this_actedIn0 IS NOT NULL, " SET this_actedIn0.title = $this_update_actedIn0_title RETURN count(*) ", "", {this:this, updateActors: $updateActors, this_actedIn0:this_actedIn0, auth:$auth,this_update_actedIn0_title:$this_update_actedIn0_title}) YIELD value as _
    RETURN count(*)
}
RETURN this { .name } AS this
```

### Expected Cypher Params

```json
{
    "auth": {
        "isAuthenticated": true,
        "jwt": {},
        "roles": []
    },
    "this_update_actedIn0_title": "New Title",
    "updateActors": {
        "args": {
            "update": {
                "actedIn": [
                    {
                        "update": {
                            "node": {
                                "title": "New Title"
                            }
                        },
                        "where": {
                            "node": {
                                "title": "Old Title"
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

## Update update an interface relationship with nested update

### GraphQL Input

```graphql
mutation {
    updateActors(
        update: {
            actedIn: {
                where: { node: { title: "Old Title" } }
                update: { node: { actors: { update: { node: { name: "New Actor Name" } } } } }
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
    OPTIONAL MATCH (this)-[this_acted_in0_relationship:ACTED_IN]->(this_actedIn0:Movie)
    WHERE this_actedIn0.title = $updateActors.args.update.actedIn[0].where.node.title
    CALL apoc.do.when(this_actedIn0 IS NOT NULL, "
        WITH this, this_actedIn0
        OPTIONAL MATCH (this_actedIn0)<-[this_actedIn0_acted_in0_relationship:ACTED_IN]-(this_actedIn0_actors0:Actor)
        CALL apoc.do.when(this_actedIn0_actors0 IS NOT NULL, \"
            SET this_actedIn0_actors0.name = $this_update_actedIn0_actors0_name
            RETURN count(*)
        \", \"\", {this:this, this_actedIn0:this_actedIn0, updateActors: $updateActors, this_actedIn0_actors0:this_actedIn0_actors0, auth:$auth,this_update_actedIn0_actors0_name:$this_update_actedIn0_actors0_name})
        YIELD value as _
        RETURN count(*)
    ", "", {this:this, updateActors: $updateActors, this_actedIn0:this_actedIn0, auth:$auth,this_update_actedIn0_actors0_name:$this_update_actedIn0_actors0_name})
    YIELD value as _
    RETURN count(*)
UNION
    WITH this
    OPTIONAL MATCH (this)-[this_acted_in0_relationship:ACTED_IN]->(this_actedIn0:Series)
    WHERE this_actedIn0.title = $updateActors.args.update.actedIn[0].where.node.title
    CALL apoc.do.when(this_actedIn0 IS NOT NULL, "
        WITH this, this_actedIn0
        OPTIONAL MATCH (this_actedIn0)<-[this_actedIn0_acted_in0_relationship:ACTED_IN]-(this_actedIn0_actors0:Actor)
        CALL apoc.do.when(this_actedIn0_actors0 IS NOT NULL, \"
            SET this_actedIn0_actors0.name = $this_update_actedIn0_actors0_name
            RETURN count(*)
        \", \"\", {this:this, this_actedIn0:this_actedIn0, updateActors: $updateActors, this_actedIn0_actors0:this_actedIn0_actors0, auth:$auth,this_update_actedIn0_actors0_name:$this_update_actedIn0_actors0_name})
        YIELD value as _
        RETURN count(*)
    ", "", {this:this, updateActors: $updateActors, this_actedIn0:this_actedIn0, auth:$auth,this_update_actedIn0_actors0_name:$this_update_actedIn0_actors0_name})
    YIELD value as _
    RETURN count(*)
}
RETURN this { .name } AS this
```

### Expected Cypher Params

```json
{
    "auth": {
        "isAuthenticated": true,
        "jwt": {},
        "roles": []
    },
    "this_update_actedIn0_actors0_name": "New Actor Name",
    "updateActors": {
        "args": {
            "update": {
                "actedIn": [
                    {
                        "update": {
                            "node": {
                                "actors": [
                                    {
                                        "update": {
                                            "node": {
                                                "name": "New Actor Name"
                                            }
                                        }
                                    }
                                ]
                            }
                        },
                        "where": {
                            "node": {
                                "title": "Old Title"
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

## Update update an interface relationship with nested update using \_on to only update one implementation

### GraphQL Input

```graphql
mutation {
    updateActors(
        update: {
            actedIn: {
                where: { node: { title: "Old Title" } }
                update: { node: { _on: { Movie: { actors: { update: { node: { name: "New Actor Name" } } } } } } }
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
    OPTIONAL MATCH (this)-[this_acted_in0_relationship:ACTED_IN]->(this_actedIn0:Movie)
    WHERE this_actedIn0.title = $updateActors.args.update.actedIn[0].where.node.title
    CALL apoc.do.when(this_actedIn0 IS NOT NULL, "
        WITH this, this_actedIn0
        OPTIONAL MATCH (this_actedIn0)<-[this_actedIn0_acted_in0_relationship:ACTED_IN]-(this_actedIn0_actors0:Actor)
        CALL apoc.do.when(this_actedIn0_actors0 IS NOT NULL, \"
            SET this_actedIn0_actors0.name = $this_update_actedIn0_on_Movie_actors0_name
            RETURN count(*)
        \", \"\", {this:this, this_actedIn0:this_actedIn0, updateActors: $updateActors, this_actedIn0_actors0:this_actedIn0_actors0, auth:$auth,this_update_actedIn0_on_Movie_actors0_name:$this_update_actedIn0_on_Movie_actors0_name})
        YIELD value as _
        RETURN count(*)
    ", "", {this:this, updateActors: $updateActors, this_actedIn0:this_actedIn0, auth:$auth,this_update_actedIn0_on_Movie_actors0_name:$this_update_actedIn0_on_Movie_actors0_name})
    YIELD value as _
    RETURN count(*)
UNION
    WITH this
    OPTIONAL MATCH (this)-[this_acted_in0_relationship:ACTED_IN]->(this_actedIn0:Series)
    WHERE this_actedIn0.title = $updateActors.args.update.actedIn[0].where.node.title
    CALL apoc.do.when(this_actedIn0 IS NOT NULL, "
        RETURN count(*)
    ", "", {this:this, updateActors: $updateActors, this_actedIn0:this_actedIn0, auth:$auth})
    YIELD value as _
    RETURN count(*)
}
RETURN this { .name } AS this
```

### Expected Cypher Params

```json
{
    "auth": {
        "isAuthenticated": true,
        "jwt": {},
        "roles": []
    },
    "this_update_actedIn0_on_Movie_actors0_name": "New Actor Name",
    "updateActors": {
        "args": {
            "update": {
                "actedIn": [
                    {
                        "update": {
                            "node": {
                                "_on": {
                                    "Movie": {
                                        "actors": [
                                            {
                                                "update": {
                                                    "node": {
                                                        "name": "New Actor Name"
                                                    }
                                                }
                                            }
                                        ]
                                    }
                                }
                            }
                        },
                        "where": {
                            "node": {
                                "title": "Old Title"
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

## Update update an interface relationship with nested update using \_on to override update

### GraphQL Input

```graphql
mutation {
    updateActors(
        update: {
            actedIn: {
                where: { node: { title: "Old Title" } }
                update: {
                    node: {
                        actors: { update: { node: { name: "New Actor Name" } } }
                        _on: { Movie: { actors: { update: { node: { name: "Different Actor Name" } } } } }
                    }
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
    OPTIONAL MATCH (this)-[this_acted_in0_relationship:ACTED_IN]->(this_actedIn0:Movie)
    WHERE this_actedIn0.title = $updateActors.args.update.actedIn[0].where.node.title
    CALL apoc.do.when(this_actedIn0 IS NOT NULL, "
        WITH this, this_actedIn0
        OPTIONAL MATCH (this_actedIn0)<-[this_actedIn0_acted_in0_relationship:ACTED_IN]-(this_actedIn0_actors0:Actor)
        CALL apoc.do.when(this_actedIn0_actors0 IS NOT NULL, \"
            SET this_actedIn0_actors0.name = $this_update_actedIn0_on_Movie_actors0_name
            RETURN count(*)
        \", \"\", {this:this, this_actedIn0:this_actedIn0, updateActors: $updateActors, this_actedIn0_actors0:this_actedIn0_actors0, auth:$auth,this_update_actedIn0_on_Movie_actors0_name:$this_update_actedIn0_on_Movie_actors0_name})
        YIELD value as _
        RETURN count(*)
    ", "", {this:this, updateActors: $updateActors, this_actedIn0:this_actedIn0, auth:$auth,this_update_actedIn0_on_Movie_actors0_name:$this_update_actedIn0_on_Movie_actors0_name})
    YIELD value as _
    RETURN count(*)
UNION
    WITH this
    OPTIONAL MATCH (this)-[this_acted_in0_relationship:ACTED_IN]->(this_actedIn0:Series)
    WHERE this_actedIn0.title = $updateActors.args.update.actedIn[0].where.node.title
    CALL apoc.do.when(this_actedIn0 IS NOT NULL, "
        WITH this, this_actedIn0
        OPTIONAL MATCH (this_actedIn0)<-[this_actedIn0_acted_in0_relationship:ACTED_IN]-(this_actedIn0_actors0:Actor)
        CALL apoc.do.when(this_actedIn0_actors0 IS NOT NULL, \"
            SET this_actedIn0_actors0.name = $this_update_actedIn0_actors0_name
            RETURN count(*)
        \", \"\", {this:this, this_actedIn0:this_actedIn0, updateActors: $updateActors, this_actedIn0_actors0:this_actedIn0_actors0, auth:$auth,this_update_actedIn0_actors0_name:$this_update_actedIn0_actors0_name})
        YIELD value as _
        RETURN count(*)
    ", "", {this:this, updateActors: $updateActors, this_actedIn0:this_actedIn0, auth:$auth,this_update_actedIn0_actors0_name:$this_update_actedIn0_actors0_name})
    YIELD value as _
    RETURN count(*)
}
RETURN this { .name } AS this
```

### Expected Cypher Params

```json
{
    "auth": {
        "isAuthenticated": true,
        "jwt": {},
        "roles": []
    },
    "this_update_actedIn0_actors0_name": "New Actor Name",
    "this_update_actedIn0_on_Movie_actors0_name": "Different Actor Name",
    "updateActors": {
        "args": {
            "update": {
                "actedIn": [
                    {
                        "update": {
                            "node": {
                                "_on": {
                                    "Movie": {
                                        "actors": [
                                            {
                                                "update": {
                                                    "node": {
                                                        "name": "Different Actor Name"
                                                    }
                                                }
                                            }
                                        ]
                                    }
                                },
                                "actors": [
                                    {
                                        "update": {
                                            "node": {
                                                "name": "New Actor Name"
                                            }
                                        }
                                    }
                                ]
                            }
                        },
                        "where": {
                            "node": {
                                "title": "Old Title"
                            }
                        }
                    }
                ]
            }
        }
    }
}
```
