# Cypher -> Connections -> Filtering -> Node -> Arrays

Schema:

```schema
type Movie {
  title: String!
  actors: [Actor!]! @relationship(type: "ACTED_IN", properties: "ActedIn", direction: IN)
}

type Actor {
  name: String!
  favouriteColours: [String!]
  movies: [Movie!]! @relationship(type: "ACTED_IN", properties: "ActedIn", direction: OUT)
}

interface ActedIn {
  screenTime: Int!
}
```

---

## IN

### GraphQL Input

```graphql
query {
    movies {
        title
        actorsConnection(
            where: { node: { name_IN: ["Tom Hanks", "Robin Wright"] } }
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
    WHERE this_actor.name IN $this_actorsConnection.args.where.node.name_IN
    WITH collect({ screenTime: this_acted_in.screenTime, node: { name: this_actor.name } }) AS edges
    RETURN { edges: edges, totalCount: size(edges) } AS actorsConnection
}
RETURN this { .title, actorsConnection } as this
```

### Expected Cypher Params

```cypher-params
{
    "this_actorsConnection": {
        "args": {
            "where": {
                "node": {
                    "name_IN": ["Tom Hanks", "Robin Wright"]
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
            where: { node: { name_NOT_IN: ["Tom Hanks", "Robin Wright"] } }
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
    WHERE (NOT this_actor.name IN $this_actorsConnection.args.where.node.name_NOT_IN)
    WITH collect({ screenTime: this_acted_in.screenTime, node: { name: this_actor.name } }) AS edges
    RETURN { edges: edges, totalCount: size(edges) } AS actorsConnection
}
RETURN this { .title, actorsConnection } as this
```

### Expected Cypher Params

```cypher-params
{
    "this_actorsConnection": {
        "args": {
            "where": {
                "node": {
                    "name_NOT_IN": ["Tom Hanks", "Robin Wright"]
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
            where: { node: { favouriteColours_INCLUDES: "Blue" } }
        ) {
            edges {
                screenTime
                node {
                    name
                    favouriteColours
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
    WHERE $this_actorsConnection.args.where.node.favouriteColours_INCLUDES IN this_actor.favouriteColours
    WITH collect({ screenTime: this_acted_in.screenTime, node: { name: this_actor.name, favouriteColours: this_actor.favouriteColours } }) AS edges
    RETURN { edges: edges, totalCount: size(edges) } AS actorsConnection
}
RETURN this { .title, actorsConnection } as this
```

### Expected Cypher Params

```cypher-params
{
    "this_actorsConnection": {
        "args": {
            "where": {
                "node": {
                    "favouriteColours_INCLUDES": "Blue"
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
            where: { node: { favouriteColours_NOT_INCLUDES: "Blue" } }
        ) {
            edges {
                screenTime
                node {
                    name
                    favouriteColours
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
    WHERE (NOT $this_actorsConnection.args.where.node.favouriteColours_NOT_INCLUDES IN this_actor.favouriteColours)
    WITH collect({ screenTime: this_acted_in.screenTime, node: { name: this_actor.name, favouriteColours: this_actor.favouriteColours } }) AS edges
    RETURN { edges: edges, totalCount: size(edges) } AS actorsConnection
}
RETURN this { .title, actorsConnection } as this
```

### Expected Cypher Params

```cypher-params
{
    "this_actorsConnection": {
        "args": {
            "where": {
                "node": {
                    "favouriteColours_NOT_INCLUDES": "Blue"
                }
            }
        }
    }
}
```

---
