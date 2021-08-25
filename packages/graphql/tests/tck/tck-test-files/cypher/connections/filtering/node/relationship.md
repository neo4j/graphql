# Cypher -> Connections -> Filtering -> Node -> Relationship

Schema:

```graphql
type Movie {
    title: String!
    actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN)
}

type Actor {
    name: String!
    movies: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT)
}
```

---

## Equality

### GraphQL Input

```graphql
query {
    movies {
        title
        actorsConnection(
            where: { node: { movies: { title: "Forrest Gump" } } }
        ) {
            edges {
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
    MATCH (this)<-[this_acted_in_relationship:ACTED_IN]-(this_actor:Actor)
    WHERE EXISTS((this_actor)-[:ACTED_IN]->(:Movie)) AND ANY(this_actor_movies IN [(this_actor)-[:ACTED_IN]->(this_actor_movies:Movie) | this_actor_movies] WHERE this_actor_movies.title = $this_actorsConnection.args.where.node.movies.title)
    WITH collect({ node: { name: this_actor.name } }) AS edges
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
                    "movies": {
                        "title": "Forrest Gump"
                    }
                }
            }
        }
    }
}
```

---
