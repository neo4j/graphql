## Mixed nesting

Schema:

```schema
type Movie {
  title: String!
  actors: [Actor!]! @relationship(type: "ACTED_IN", properties: "ActedIn", direction: IN)
}

type Actor {
  name: String!
  movies: [Movie!]! @relationship(type: "ACTED_IN", properties: "ActedIn", direction: OUT)
}

interface ActedIn {
  screenTime: Int!
}
```

---

### Connection -> Relationship

**GraphQL input**

```graphql
query {
    movies(where: { title: "Forrest Gump" }) {
        title
        actorsConnection(where: { node: { name: "Tom Hanks" } }) {
            edges {
                screenTime
                node {
                    name
                    movies(where: { title_NOT: "Forrest Gump" }) {
                        title
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
WHERE this.title = $this_title
CALL {
    WITH this
    MATCH (this)<-[this_acted_in:ACTED_IN]-(this_actor:Actor)
    WHERE this_actor.name = $this_actorsConnection.args.where.node.name
    WITH collect({
        screenTime: this_acted_in.screenTime,
        node: {
            name: this_actor.name,
            movies: [ (this_actor)-[:ACTED_IN]->(this_actor_movies:Movie) WHERE (NOT this_actor_movies.title = $this_actor_movies_title_NOT) | this_actor_movies { .title } ]
        }
    }) AS edges
    RETURN { edges: edges, totalCount: size(edges) } AS actorsConnection
}
RETURN this { .title, actorsConnection } as this
```

**Expected Cypher params**

```cypher-params
{
    "this_title": "Forrest Gump",
    "this_actor_movies_title_NOT": "Forrest Gump",
    "this_actorsConnection": {
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

### Connection -> Connection -> Relationship

**GraphQL input**

```graphql
query {
    movies(where: { title: "Forrest Gump" }) {
        title
        actorsConnection(where: { node: { name: "Tom Hanks" } }) {
            edges {
                screenTime
                node {
                    name
                    moviesConnection(
                        where: { node: { title_NOT: "Forrest Gump" } }
                    ) {
                        edges {
                            node {
                                title
                                actors(where: { name_NOT: "Tom Hanks" }) {
                                    name
                                }
                            }
                        }
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
WHERE this.title = $this_title
CALL {
    WITH this
    MATCH (this)<-[this_acted_in:ACTED_IN]-(this_actor:Actor)
    WHERE this_actor.name = $this_actorsConnection.args.where.node.name
    CALL {
        WITH this_actor
        MATCH (this_actor)-[this_actor_acted_in:ACTED_IN]->(this_actor_movie:Movie)
        WHERE (NOT this_actor_movie.title = $this_actorsConnection.edges.node.moviesConnection.args.where.node.title_NOT)
        WITH collect({
            node: {
                title: this_actor_movie.title,
                actors: [ (this_actor_movie)<-[:ACTED_IN]-(this_actor_movie_actors:Actor) WHERE (NOT this_actor_movie_actors.name = $this_actor_movie_actors_name_NOT) | this_actor_movie_actors { .name } ]
            }
        }) AS edges
        RETURN { edges: edges, totalCount: size(edges) } AS moviesConnection
    }
    WITH collect({ screenTime: this_acted_in.screenTime, node: { name: this_actor.name, moviesConnection: moviesConnection } }) AS edges
    RETURN { edges: edges, totalCount: size(edges) } AS actorsConnection
}
RETURN this { .title, actorsConnection } as this
```

**Expected Cypher params**

```cypher-params
{
    "this_title": "Forrest Gump",
    "this_actor_movie_actors_name_NOT": "Tom Hanks",
    "this_actorsConnection": {
        "args": {
            "where": {
                "node": {
                    "name": "Tom Hanks"
                }
            }
        },
        "edges": {
            "node": {
                "moviesConnection": {
                    "args": {
                        "where": {
                            "node": {
                                "title_NOT": "Forrest Gump"
                            }
                        }
                    }
                }
            }
        }
    }
}
```

---
