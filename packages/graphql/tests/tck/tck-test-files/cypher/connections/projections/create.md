# Cypher -> Connections -> Projections -> Create

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

## Connection can be selected following the creation of a single node

### GraphQL Input

```graphql
mutation {
    createMovies(input: [{ title: "Forrest Gump" }]) {
        movies {
            title
            actorsConnection {
                edges {
                    screenTime
                    node {
                        name
                    }
                }
            }
        }
    }
}
```

### Expected Cypher Output

```cypher
CALL {
    CREATE (this0:Movie)
    SET this0.title = $this0_title
    RETURN this0
}
CALL {
    WITH this0
    MATCH (this0)<-[this0_acted_in_relationship:ACTED_IN]-(this0_actor:Actor)
    WITH collect({ screenTime: this0_acted_in_relationship.screenTime, node: { name: this0_actor.name } }) AS edges
    RETURN { edges: edges, totalCount: size(edges) } AS actorsConnection
}
RETURN this0 { .title, actorsConnection } AS this0
```

### Expected Cypher Params

```json
{
    "this0_title": "Forrest Gump"
}
```

---

## Connection can be selected following the creation of a multiple nodes

### GraphQL Input

```graphql
mutation {
    createMovies(input: [{ title: "Forrest Gump" }, { title: "Toy Story" }]) {
        movies {
            title
            actorsConnection {
                edges {
                    screenTime
                    node {
                        name
                    }
                }
            }
        }
    }
}
```

### Expected Cypher Output

```cypher
CALL {
    CREATE (this0:Movie)
    SET this0.title = $this0_title
    RETURN this0
}
CALL {
    CREATE (this1:Movie)
    SET this1.title = $this1_title
    RETURN this1
}
CALL {
    WITH this0
    MATCH (this0)<-[this0_acted_in_relationship:ACTED_IN]-(this0_actor:Actor)
    WITH collect({ screenTime: this0_acted_in_relationship.screenTime, node: { name: this0_actor.name } }) AS edges
    RETURN { edges: edges, totalCount: size(edges) } AS actorsConnection
}
CALL {
    WITH this1
    MATCH (this1)<-[this1_acted_in_relationship:ACTED_IN]-(this1_actor:Actor)
    WITH collect({ screenTime: this1_acted_in_relationship.screenTime, node: { name: this1_actor.name } }) AS edges
    RETURN { edges: edges, totalCount: size(edges) } AS actorsConnection
}
RETURN this0 { .title, actorsConnection } AS this0, this1 { .title, actorsConnection } AS this1
```

### Expected Cypher Params

```json
{
    "this0_title": "Forrest Gump",
    "this1_title": "Toy Story"
}
```

---

## Connection can be selected and filtered following the creation of a multiple nodes

### GraphQL Input

```graphql
mutation {
    createMovies(input: [{ title: "Forrest Gump" }, { title: "Toy Story" }]) {
        movies {
            title
            actorsConnection(where: { node: { name: "Tom Hanks" } }) {
                edges {
                    screenTime
                    node {
                        name
                    }
                }
            }
        }
    }
}
```

### Expected Cypher Output

```cypher
CALL {
    CREATE (this0:Movie)
    SET this0.title = $this0_title
    RETURN this0
}
CALL {
    CREATE (this1:Movie)
    SET this1.title = $this1_title
    RETURN this1
}
CALL {
    WITH this0
    MATCH (this0)<-[this0_acted_in_relationship:ACTED_IN]-(this0_actor:Actor)
    WHERE this0_actor.name = $this0_actorsConnection.args.where.node.name
    WITH collect({ screenTime: this0_acted_in_relationship.screenTime, node: { name: this0_actor.name } }) AS edges
    RETURN { edges: edges, totalCount: size(edges) } AS actorsConnection
}
CALL {
    WITH this1
    MATCH (this1)<-[this1_acted_in_relationship:ACTED_IN]-(this1_actor:Actor)
    WHERE this1_actor.name = $this1_actorsConnection.args.where.node.name
    WITH collect({ screenTime: this1_acted_in_relationship.screenTime, node: { name: this1_actor.name } }) AS edges
    RETURN { edges: edges, totalCount: size(edges) } AS actorsConnection
}
RETURN this0 { .title, actorsConnection } AS this0, this1 { .title, actorsConnection } AS this1
```

### Expected Cypher Params

```json
{
    "this0_title": "Forrest Gump",
    "this1_title": "Toy Story",
    "this0_actorsConnection": {
        "args": {
            "where": {
                "node": {
                    "name": "Tom Hanks"
                }
            }
        }
    },
    "this1_actorsConnection": {
        "args": {
            "where": {
                "node": {
                    "name": "Tom Hanks"
                }
            }
        }
    }
}
```

---
