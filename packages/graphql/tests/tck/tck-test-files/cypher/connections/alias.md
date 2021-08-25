# Connections Alias

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

## Alias Top Level Connection Field

### GraphQL Input

```graphql
{
    movies {
        actors: actorsConnection {
            totalCount
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
    WITH collect({ }) AS edges
    RETURN {
        totalCount: size(edges)
    } AS actors
}
RETURN this { actors } as this
```

### Expected Cypher Params

```json
{}
```

---

## Alias Top Level Connection Field Multiple Times

### GraphQL Input

```graphql
query {
    movies(where: { title: "Forrest Gump" }) {
        title
        hanks: actorsConnection(where: { node: { name: "Tom Hanks" } }) {
            edges {
                screenTime
                node {
                    name
                }
            }
        }
        jenny: actorsConnection(where: { node: { name: "Robin Wright" } }) {
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
WHERE this.title = $this_title
CALL {
    WITH this
    MATCH (this)<-[this_acted_in_relationship:ACTED_IN]-(this_actor:Actor)
    WHERE this_actor.name = $this_hanks.args.where.node.name
    WITH collect({
        screenTime: this_acted_in_relationship.screenTime,
        node: {
            name: this_actor.name
        }
    }) AS edges
    RETURN { edges: edges, totalCount: size(edges) } AS hanks
}
CALL {
    WITH this
    MATCH (this)<-[this_acted_in_relationship:ACTED_IN]-(this_actor:Actor)
    WHERE this_actor.name = $this_jenny.args.where.node.name
    WITH collect({
        screenTime: this_acted_in_relationship.screenTime,
        node: {
            name: this_actor.name
        }
    }) AS edges
    RETURN { edges: edges, totalCount: size(edges) } AS jenny
}
RETURN this { .title, hanks, jenny } as this
```

### Expected Cypher Params

```json
{
    "this_title": "Forrest Gump",
    "this_hanks": {
        "args": {
            "where": {
                "node": {
                    "name": "Tom Hanks"
                }
            }
        }
    },
    "this_jenny": {
        "args": {
            "where": {
                "node": {
                    "name": "Robin Wright"
                }
            }
        }
    }
}
```

---
