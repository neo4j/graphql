## Problem

Currently, running a `create` mutation with several elements cause low performance when running with a large (>500) elements.
This is caused by the complex query with nested subqueries per item.

### Example

**Schema**

```graphql
type Movie {
    title: String!
    actors: [Person!]! @relationship(type: "ACTED_IN", direction: IN, properties: "ActedIn")
}

type Person {
    name: String!
    movies: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT, properties: "ActedIn")
}
```

**GraphQL**

```graphql
mutation Mutation {
    createMovies(input: [{ title: "The Matrix" }, { title: "The Matrix Resurrection" }]) {
        movies {
            title
        }
    }
}
```

**Cypher**

```cypher
CALL { // <-- Note these CALL blocks
CREATE (this0:Movie)
SET this0.title = $this0_title
RETURN this0
}
CALL {
CREATE (this1:Movie)
SET this1.title = $this1_title
RETURN this1
}
WITH this0, this1


RETURN [
this0 { .title },
this1 { .title }] AS data, meta

```

# Proposed solution

`UNWIND` can be used to improve performance for batch create. This performance improvement has already been verified:

```cypher
UNWIND [{title: $this0_title}, {title: $this1_title}] as batch
CREATE (this:Movie)
SET this.title = batch.title
RETURN collect(this { .title }) as data
```

## With Relationships

`create` mutations allow for creating new relationships on the same query. This can add some difficulties when removing the `CALL` subqueries:

**GraphQL**

```graphql
mutation Mutation {
    createMovies(
        input: [
            { title: "The Matrix", actors: { create: [{ node: { name: "Keanu" } }] } }
            { title: "The Matrix Resurrection" }
        ]
    ) {
        movies {
            title
            actors {
                name
            }
        }
    }
}
```

The query without `UNWIND` will yield the following Cypher:

**Cypher**

```cypher
CALL {
CREATE (this0:Movie)
SET this0.title = $this0_title

WITH this0
CREATE (this0_actors0_node:Person)
SET this0_actors0_node.name = $this0_actors0_node_name
MERGE (this0)<-[this0_actors0_relationship:ACTED_IN]-(this0_actors0_node)

RETURN this0
}
CALL {
CREATE (this1:Movie)
SET this1.title = $this1_title
RETURN this1
}


CALL {
    WITH this0
    MATCH (this0_actors:`Person`)-[create_this0:ACTED_IN]->(this0)
    WITH this0_actors { .name } AS this0_actors
    RETURN collect(this0_actors) AS this0_actors
}
CALL {
    WITH this1
    MATCH (this1_actors:`Person`)-[create_this0:ACTED_IN]->(this1)
    WITH this1_actors { .name } AS this1_actors
    RETURN collect(this1_actors) AS this1_actors
}
RETURN [
this0 { .title, actors: this0_actors },
this1 { .title, actors: this1_actors }] AS data

```

For `UNWIND`, a subquery to generate the relationship nodes with a `collect` return can be used instead:

```cypher
UNWIND [{title: "The Matrix", actors: [{name: "Keanu"}]}, {title: "The Matrix 2"}] as x
CREATE(m:Movie)
SET m.title=x.title
WITH *
CALL {
    WITH x, m
    UNWIND x.actors as x_actors
    CREATE (p:Person)
    SET p.name=x_actors.name
    MERGE (p)-[:ACTED_IN]->(m)
    RETURN collect(p) as res
}
WITH m
CALL {
    WITH m
    MATCH(a:Person)-[:ACTED_IN]->(m)
    WITH a {.name} as m_actors
    RETURN collect(m_actors) AS m_actors
}
RETURN collect(m {.title, actors: m_actors}) AS data
```

## Complex Example

**Typedefs**

```graphql
type Movie {
    title: String!
    released: Int
    actors: [Person!]! @relationship(type: "ACTED_IN", direction: IN, properties: "ActedIn")
    web: Website @relationship(type: "HAS_WEBSITE", direction: OUT)
}

type Person {
    name: String!
    movies: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT, properties: "ActedIn")
    web: Website @relationship(type: "HAS_WEBSITE", direction: OUT)
}

type Website {
    address: String!
}

interface ActedIn @relationshipProperties {
    year: Int
}
```

**Query**

```graphql
mutation CreateMovies($input: [MovieCreateInput!]!) {
    createMovies(input: $input) {
        movies {
            title
            web {
                address
            }
            actors {
                name
                web {
                    address
                }
            }
        }
        info {
            nodesCreated
        }
    }
}
```

**Params**

```json
{
    "input": [
        {
            "title": "Movie",
            "web": {
                "create": {
                    "node": {
                        "address": "movie.com"
                    }
                }
            },
            "actors": {
                "create": [
                    {
                        "node": {
                            "name": "Keanu",
                            "web": {
                                "create": {
                                    "node": {
                                        "address": "keanu.com"
                                    }
                                }
                            }
                        },
                        "edge": {
                            "year": 1999
                        }
                    }
                ]
            }
        },
        {
            "title": "Movie 2",
            "actors": {
                "create": [
                    {
                        "node": {
                            "name": "Keanu 2"
                        }
                    }
                ]
            }
        }
    ]
}
```

**Current Cypher**:

```
CALL {
CREATE (this0:Movie)
SET this0.title = $this0_title

WITH this0
CREATE (this0_actors0_node:Person)
SET this0_actors0_node.name = $this0_actors0_node_name

WITH this0, this0_actors0_node
CREATE (this0_actors0_node_web0_node:Website)
SET this0_actors0_node_web0_node.address = $this0_actors0_node_web0_node_address
MERGE (this0_actors0_node)-[:HAS_WEBSITE]->(this0_actors0_node_web0_node)
MERGE (this0)<-[this0_actors0_relationship:ACTED_IN]-(this0_actors0_node)
SET this0_actors0_relationship.year = $this0_actors0_relationship_year
WITH this0, this0_actors0_node
CALL {
	WITH this0_actors0_node
	MATCH (this0_actors0_node)-[this0_actors0_node_web_Website_unique:HAS_WEBSITE]->(:Website)
	WITH count(this0_actors0_node_web_Website_unique) as c
	CALL apoc.util.validate(NOT (c <= 1), '@neo4j/graphql/RELATIONSHIP-REQUIREDPerson.web must be less than or equal to one', [0])
	RETURN c AS this0_actors0_node_web_Website_unique_ignored
}

WITH this0
CREATE (this0_web0_node:Website)
SET this0_web0_node.address = $this0_web0_node_address
MERGE (this0)-[:HAS_WEBSITE]->(this0_web0_node)
WITH this0
CALL {
	WITH this0
	MATCH (this0)-[this0_web_Website_unique:HAS_WEBSITE]->(:Website)
	WITH count(this0_web_Website_unique) as c
	CALL apoc.util.validate(NOT (c <= 1), '@neo4j/graphql/RELATIONSHIP-REQUIREDMovie.web must be less than or equal to one', [0])
	RETURN c AS this0_web_Website_unique_ignored
}
RETURN this0
}
CALL {
CREATE (this1:Movie)
SET this1.title = $this1_title

WITH this1
CREATE (this1_actors0_node:Person)
SET this1_actors0_node.name = $this1_actors0_node_name
MERGE (this1)<-[this1_actors0_relationship:ACTED_IN]-(this1_actors0_node)

WITH this1, this1_actors0_node
CALL {
	WITH this1_actors0_node
	MATCH (this1_actors0_node)-[this1_actors0_node_web_Website_unique:HAS_WEBSITE]->(:Website)
	WITH count(this1_actors0_node_web_Website_unique) as c
	CALL apoc.util.validate(NOT (c <= 1), '@neo4j/graphql/RELATIONSHIP-REQUIREDPerson.web must be less than or equal to one', [0])
	RETURN c AS this1_actors0_node_web_Website_unique_ignored
}
WITH this1
CALL {
	WITH this1
	MATCH (this1)-[this1_web_Website_unique:HAS_WEBSITE]->(:Website)
	WITH count(this1_web_Website_unique) as c
	CALL apoc.util.validate(NOT (c <= 1), '@neo4j/graphql/RELATIONSHIP-REQUIREDMovie.web must be less than or equal to one', [0])
	RETURN c AS this1_web_Website_unique_ignored
}
RETURN this1
}


CALL {
    WITH this0
    MATCH (this0)-[create_this0:HAS_WEBSITE]->(this0_web:`Website`)
    WITH this0_web { .address } AS this0_web
    RETURN head(collect(this0_web)) AS this0_web
}
CALL {
    WITH this0
    MATCH (this0_actors:`Person`)-[create_this1:ACTED_IN]->(this0)
    CALL {
        WITH this0_actors
        MATCH (this0_actors)-[create_this2:HAS_WEBSITE]->(this0_actors_web:`Website`)
        WITH this0_actors_web { .address } AS this0_actors_web
        RETURN head(collect(this0_actors_web)) AS this0_actors_web
    }
    WITH this0_actors { .name, web: this0_actors_web } AS this0_actors
    RETURN collect(this0_actors) AS this0_actors
}
CALL {
    WITH this1
    MATCH (this1)-[create_this0:HAS_WEBSITE]->(this1_web:`Website`)
    WITH this1_web { .address } AS this1_web
    RETURN head(collect(this1_web)) AS this1_web
}
CALL {
    WITH this1
    MATCH (this1_actors:`Person`)-[create_this1:ACTED_IN]->(this1)
    CALL {
        WITH this1_actors
        MATCH (this1_actors)-[create_this2:HAS_WEBSITE]->(this1_actors_web:`Website`)
        WITH this1_actors_web { .address } AS this1_actors_web
        RETURN head(collect(this1_actors_web)) AS this1_actors_web
    }
    WITH this1_actors { .name, web: this1_actors_web } AS this1_actors
    RETURN collect(this1_actors) AS this1_actors
}
RETURN [
this0 { .title, web: this0_web, actors: this0_actors },
this1 { .title, web: this1_web, actors: this1_actors }] AS data

```

Params:

```json
{
    "this0_title": "Movie",
    "this0_actors0_node_name": "Keanu",
    "this0_actors0_node_web0_node_address": "keanu.com",
    "this0_actors0_relationship_year": {
        "low": 1999,
        "high": 0
    },
    "this0_web0_node_address": "movie.com",
    "this1_title": "Movie 2",
    "this1_actors0_node_name": "Keanu 2",
    "resolvedCallbacks": {}
}
```

### Proposed Cypher

```cypher
UNWIND [{title: "The Matrix", website: {address: "movie.com"}, actors: [{node: {name: "Keanu", website: {address: "keanu.com"}}, edge: { year: 1999}}]}, {title: "The Matrix 2", actors: [{node: {name: "Keanu 2", website: {address: "movie2.com"}}}]}] as x
CREATE (this0:Movie)
SET this0.title=x.title
WITH this0,x
CALL {
    WITH this0, x
    UNWIND x.actors as x_actor_connection
    WITH x_actor_connection.node as x_actor, x_actor_connection.edge as x_actor_edge, this0
    CREATE(this1:Person)
    SET this1.name=x_actor.name
    MERGE (this1)-[edge0:ACTED_IN]->(this0)
    SET edge0.year=x_actor_edge.year
    WITH *
    CALL {
        WITH this1, x_actor
        UNWIND x_actor.website as x_actor_web
        CREATE (this2:Website)
        SET this2.address=x_actor_web.address
        MERGE (this1)-[:HAS_WEBSITE]->(this2)
        WITH this1
        CALL {
            WITH this1
            MATCH (this1)-[r:HAS_WEBSITE]->(:Website)
            WITH count(r) as c
            CALL apoc.util.validate(NOT (c <= 1), '@neo4j/graphql/RELATIONSHIP-REQUIREDMovie.web must be less than or equal to one', [0])
            RETURN null AS var4
        }
        RETURN collect(null) AS var1
    }
    RETURN collect(null) AS var2 // This var does not need to be unique if we use WITH this0, x before CALL
}
WITH this0, x
CALL {
    WITH this0, x
    UNWIND x.website AS x_web
    CREATE(this3:Website)
    SET this3.address=x_web.address
    MERGE (this0)-[:HAS_WEBSITE]->(this3)
    WITH this0
    CALL {
        WITH this0
        MATCH (this0)-[r:HAS_WEBSITE]->(:Website)
        WITH count(r) as c
        CALL apoc.util.validate(NOT (c <= 1), '@neo4j/graphql/RELATIONSHIP-REQUIREDMovie.web must be less than or equal to one', [0])
        RETURN null AS var4
    }
    RETURN collect(null) AS var3
}
WITH this0
// Note that projection now does not require dealing with multiple movies
CALL {
    WITH this0
    MATCH (this0)-[create_this0:HAS_WEBSITE]->(this0_web:`Website`)
    WITH this0_web { .address } AS this0_web
    RETURN head(collect(this0_web)) AS this0_web
}
CALL {
    WITH this0
    MATCH (this0_actors:`Person`)-[create_this1:ACTED_IN]->(this0)
    CALL {
        WITH this0_actors
        MATCH (this0_actors)-[create_this2:HAS_WEBSITE]->(this0_actors_web:`Website`)
        WITH this0_actors_web { .address } AS this0_actors_web
        RETURN head(collect(this0_actors_web)) AS this0_actors_web
    }
    WITH this0_actors { .name, web: this0_actors_web } AS this0_actors
    RETURN collect(this0_actors) AS this0_actors
}

RETURN [
    this0 { .title, web: this0_web, actors: this0_actors }
    ] AS data
```
