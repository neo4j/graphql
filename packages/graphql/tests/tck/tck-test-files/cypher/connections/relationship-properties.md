# Relationship Properties Cypher

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

## Projecting node and relationship properties with no arguments

### GraphQL Input

```graphql
query {
    movies(where: { title: "Forrest Gump" }) {
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
```

### Expected Cypher Output

```cypher
MATCH (this:Movie)
WHERE this.title = $this_title
CALL {
    WITH this
    MATCH (this)<-[this_acted_in:ACTED_IN]-(this_actor:Actor)
    WITH collect({ screenTime: this_acted_in.screenTime, node: { name: this_actor.name } }) AS edges
    RETURN { edges: edges, totalCount: size(edges) } AS actorsConnection
}
RETURN this { .title, actorsConnection } as this
```

### Expected Cypher Params

```json
{
    "this_title": "Forrest Gump"
}
```

---

## Projecting node and relationship properties with where argument

### GraphQL Input

```graphql
query {
    movies(where: { title: "Forrest Gump" }) {
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
```

### Expected Cypher Output

```cypher
MATCH (this:Movie)
WHERE this.title = $this_title
CALL {
    WITH this
    MATCH (this)<-[this_acted_in:ACTED_IN]-(this_actor:Actor)
    WHERE this_actor.name = $this_actorsConnection.args.where.node.name
    WITH collect({ screenTime: this_acted_in.screenTime, node: { name: this_actor.name } }) AS edges
    RETURN { edges: edges, totalCount: size(edges) } AS actorsConnection
}
RETURN this { .title, actorsConnection } as this
```

### Expected Cypher Params

```json
{
    "this_title": "Forrest Gump",
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

## Projecting node and relationship properties with sort argument

### GraphQL Input

```graphql
query {
    movies(where: { title: "Forrest Gump" }) {
        title
        actorsConnection(sort: { edge: { screenTime: DESC } }) {
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
    MATCH (this)<-[this_acted_in:ACTED_IN]-(this_actor:Actor)
    WITH this_acted_in, this_actor
    ORDER BY this_acted_in.screenTime DESC
    WITH collect({ screenTime: this_acted_in.screenTime, node: { name: this_actor.name } }) AS edges
    RETURN { edges: edges, totalCount: size(edges) } AS actorsConnection
}
RETURN this { .title, actorsConnection } as this
```

### Expected Cypher Params

```json
{
    "this_title": "Forrest Gump"
}
```

---

## Projecting twice nested node and relationship properties with no arguments

### GraphQL Input

```graphql
query {
    movies(where: { title: "Forrest Gump" }) {
        title
        actorsConnection {
            edges {
                screenTime
                node {
                    name
                    moviesConnection {
                        edges {
                            screenTime
                            node {
                                title
                            }
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
CALL {
    WITH this
    MATCH (this)<-[this_acted_in:ACTED_IN]-(this_actor:Actor)
    CALL {
        WITH this_actor
        MATCH (this_actor)-[this_actor_acted_in:ACTED_IN]->(this_actor_movie:Movie)
        WITH collect({ screenTime: this_actor_acted_in.screenTime, node: { title: this_actor_movie.title } }) AS edges
        RETURN { edges: edges, totalCount: size(edges) } AS moviesConnection
    }
    WITH collect({ screenTime: this_acted_in.screenTime, node: { name: this_actor.name, moviesConnection: moviesConnection } }) AS edges
    RETURN { edges: edges, totalCount: size(edges) } AS actorsConnection
}
RETURN this { .title, actorsConnection } as this
```

### Expected Cypher Params

```json
{
    "this_title": "Forrest Gump"
}
```

---

## Projecting thrice nested node and relationship properties with no arguments

### GraphQL Input

```graphql
query {
    movies(where: { title: "Forrest Gump" }) {
        title
        actorsConnection {
            edges {
                screenTime
                node {
                    name
                    moviesConnection {
                        edges {
                            screenTime
                            node {
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
    MATCH (this)<-[this_acted_in:ACTED_IN]-(this_actor:Actor)
    CALL {
        WITH this_actor
        MATCH (this_actor)-[this_actor_acted_in:ACTED_IN]->(this_actor_movie:Movie)
        CALL {
            WITH this_actor_movie
            MATCH (this_actor_movie)<-[this_actor_movie_acted_in:ACTED_IN]-(this_actor_movie_actor:Actor)
            WITH collect({ screenTime: this_actor_movie_acted_in.screenTime, node: { name: this_actor_movie_actor.name } }) AS edges
            RETURN { edges: edges, totalCount: size(edges) } AS actorsConnection
        }
        WITH collect({ screenTime: this_actor_acted_in.screenTime, node: { title: this_actor_movie.title, actorsConnection: actorsConnection } }) AS edges
        RETURN { edges: edges, totalCount: size(edges) } AS moviesConnection
    }
    WITH collect({ screenTime: this_acted_in.screenTime, node: { name: this_actor.name, moviesConnection: moviesConnection } }) AS edges
    RETURN { edges: edges, totalCount: size(edges) } AS actorsConnection
}
RETURN this { .title, actorsConnection } as this
```

### Expected Cypher Params

```json
{
    "this_title": "Forrest Gump"
}
```

---
