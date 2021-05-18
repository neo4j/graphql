## Cypher -> Connections -> Filtering -> Node -> Points

Schema:

```schema
type Movie {
  title: String!
  actors: [Actor!]! @relationship(type: "ACTED_IN", properties: "ActedIn", direction: IN)
}

type Actor {
  name: String!
  currentLocation: Point!
  movies: [Movie!]! @relationship(type: "ACTED_IN", properties: "ActedIn", direction: OUT)
}

interface ActedIn {
  screenTime: Int!
}
```

---

### DISTANCE

**GraphQL input**

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

**Expected Cypher output**

```cypher
MATCH (this:Movie)
CALL {
    WITH this
    MATCH (this)<-[this_acted_in:ACTED_IN]-(this_actor:Actor)
    WHERE distance(this_actor.currentLocation, point($this_actorsConnection.args.where.node.currentLocation_DISTANCE.point)) = $this_actorsConnection.args.where.node.currentLocation_DISTANCE.distance
    WITH collect({ screenTime: this_acted_in.screenTime, node: { name: this_actor.name, currentLocation: { point: this_actor.currentLocation } } }) AS edges
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
