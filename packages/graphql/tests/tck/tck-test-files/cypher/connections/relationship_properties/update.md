# Cypher -> Connections -> Relationship Properties -> Update

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

## Update a relationship property on a relationship between two specified nodes (update -> update)

### GraphQL Input

```graphql
mutation {
    updateMovies(
        where: { title: "Forrest Gump" }
        update: {
            actors: [
                {
                    where: { node: { name: "Tom Hanks" } }
                    update: { relationship: { screenTime: 60 } }
                }
            ]
        }
    ) {
        movies {
            title
        }
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Movie)
WHERE this.title = $this_title

WITH this
OPTIONAL MATCH (this)<-[this_acted_in0_relationship:ACTED_IN]-(this_actors0:Actor)
WHERE this_actors0.name = $updateMovies.args.update.actors[0].where.node.name

CALL apoc.do.when(this_acted_in0_relationship IS NOT NULL, "
SET this_acted_in0_relationship.screenTime = $updateMovies.args.update.actors[0].update.relationship.screenTime
RETURN count(*)
", "", {this_acted_in0_relationship:this_acted_in0_relationship, updateMovies: $updateMovies})
YIELD value as this_acted_in0_relationship_actors0_relationship

RETURN this { .title } AS this
```

### Expected Cypher Params

```json
{
    "this_title": "Forrest Gump",
    "updateMovies": {
        "args": {
            "update": {
                "actors": [
                    {
                        "update": {
                            "relationship": {
                                "screenTime": {
                                    "high": 0,
                                    "low": 60
                                }
                            }
                        },
                        "where": {
                            "node": {
                                "name": "Tom Hanks"
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

## Update properties on both the relationship and end node in a nested update (update -> update)

### GraphQL Input

```graphql
mutation {
    updateMovies(
        where: { title: "Forrest Gump" }
        update: {
            actors: [
                {
                    where: { node: { name: "Tom Hanks" } }
                    update: {
                        relationship: { screenTime: 60 }
                        node: { name: "Tom Hanks" }
                    }
                }
            ]
        }
    ) {
        movies {
            title
        }
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Movie)
WHERE this.title = $this_title

WITH this
OPTIONAL MATCH (this)<-[this_acted_in0_relationship:ACTED_IN]-(this_actors0:Actor)
WHERE this_actors0.name = $updateMovies.args.update.actors[0].where.node.name

CALL apoc.do.when(this_actors0 IS NOT NULL, "
SET this_actors0.name = $this_update_actors0_name
RETURN count(*)
", "", {this:this, updateMovies: $updateMovies, this_actors0:this_actors0, auth:$auth,this_update_actors0_name:$this_update_actors0_name})
YIELD value as _

CALL apoc.do.when(this_acted_in0_relationship IS NOT NULL, "
SET this_acted_in0_relationship.screenTime = $updateMovies.args.update.actors[0].update.relationship.screenTime
RETURN count(*)
", "", {this_acted_in0_relationship:this_acted_in0_relationship, updateMovies: $updateMovies})
YIELD value as this_acted_in0_relationship_actors0_relationship

RETURN this { .title } AS this
```

### Expected Cypher Params

```json
{
    "auth": {
        "isAuthenticated": true,
        "jwt": {},
        "roles": []
    },
    "this_title": "Forrest Gump",
    "this_update_actors0_name": "Tom Hanks",
    "updateMovies": {
        "args": {
            "update": {
                "actors": [
                    {
                        "update": {
                            "relationship": {
                                "screenTime": {
                                    "high": 0,
                                    "low": 60
                                }
                            },
                            "node": {
                                "name": "Tom Hanks"
                            }
                        },
                        "where": {
                            "node": {
                                "name": "Tom Hanks"
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
