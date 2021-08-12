# Cypher -> Connections -> Filtering -> Node -> Points

Schema:

```graphql
type Movie {
    title: String!
    actors: [Actor!]!
        @relationship(type: "ACTED_IN", properties: "ActedIn", direction: IN)
}

type Actor {
    name: String!
    currentLocation: Point!
    movies: [Movie!]!
        @relationship(type: "ACTED_IN", properties: "ActedIn", direction: OUT)
}

interface ActedIn {
    screenTime: Int!
}
```

---

## DISTANCE

### GraphQL Input

```graphql
query {
    movies {
        title
        actorsConnection(
            where: {
                node: {
                    currentLocation_DISTANCE: {
                        point: { longitude: 1.0, latitude: 2.0 }
                        distance: 3.0
                    }
                }
            }
        ) {
            edges {
                screenTime
                node {
                    name
                    currentLocation {
                        latitude
                        longitude
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
CALL {
    WITH this
    MATCH (this)<-[this_acted_in_relationship:ACTED_IN]-(this_actor:Actor)
    WHERE distance(this_actor.currentLocation, point($this_actorsConnection.args.where.node.currentLocation_DISTANCE.point)) = $this_actorsConnection.args.where.node.currentLocation_DISTANCE.distance
    WITH collect({ screenTime: this_acted_in_relationship.screenTime, node: { name: this_actor.name, currentLocation: { point: this_actor.currentLocation } } }) AS edges
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
                    "currentLocation_DISTANCE": {
                        "distance": 3,
                        "point": {
                            "latitude": 2,
                            "longitude": 1
                        }
                    }
                }
            }
        }
    }
}
```

---
