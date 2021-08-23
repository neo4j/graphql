# Cypher Delete

Tests delete operations.

Schema:

```graphql
type Actor {
    name: String
    movies: [Movie] @relationship(type: "ACTED_IN", direction: OUT)
}

type Movie {
    id: ID
    title: String
    actors: [Actor]! @relationship(type: "ACTED_IN", direction: IN)
}
```

---

## Simple Delete

### GraphQL Input

```graphql
mutation {
    deleteMovies(where: { id: "123" }) {
        nodesDeleted
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Movie)
WHERE this.id = $this_id
DETACH DELETE this
```

### Expected Cypher Params

```json
{
    "this_id": "123"
}
```

---

## Single Nested Delete

### GraphQL Input

```graphql
mutation {
    deleteMovies(
        where: { id: 123 }
        delete: { actors: { where: { node: { name: "Actor to delete" } } } }
    ) {
        nodesDeleted
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Movie)
WHERE this.id = $this_id
WITH this
OPTIONAL MATCH (this)<-[this_actors0_relationship:ACTED_IN]-(this_actors0:Actor)
WHERE this_actors0.name = $this_deleteMovies.args.delete.actors[0].where.node.name
WITH this, this_actors0
CALL {
    WITH this_actors0
    FOREACH(_ IN CASE this_actors0 WHEN NULL THEN [] ELSE [1] END |
        DETACH DELETE this_actors0
    )
    RETURN count(*)
}
DETACH DELETE this
```

### Expected Cypher Params

```json
{
    "this_id": "123",
    "this_deleteMovies": {
        "args": {
            "delete": {
                "actors": [
                    {
                        "where": {
                            "node": {
                                "name": "Actor to delete"
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

## Single Nested Delete deleting multiple

### GraphQL Input

```graphql
mutation {
    deleteMovies(
        where: { id: 123 }
        delete: {
            actors: [
                { where: { node: { name: "Actor to delete" } } }
                { where: { node: { name: "Another actor to delete" } } }
            ]
        }
    ) {
        nodesDeleted
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Movie)
WHERE this.id = $this_id
WITH this
OPTIONAL MATCH (this)<-[this_actors0_relationship:ACTED_IN]-(this_actors0:Actor)
WHERE this_actors0.name = $this_deleteMovies.args.delete.actors[0].where.node.name
WITH this, this_actors0
CALL {
    WITH this_actors0
    FOREACH(_ IN CASE this_actors0 WHEN NULL THEN [] ELSE [1] END |
        DETACH DELETE this_actors0
    )
    RETURN count(*)
}
WITH this
OPTIONAL MATCH (this)<-[this_actors1_relationship:ACTED_IN]-(this_actors1:Actor)
WHERE this_actors1.name = $this_deleteMovies.args.delete.actors[1].where.node.name
WITH this, this_actors1
CALL {
    WITH this_actors1
    FOREACH(_ IN CASE this_actors1 WHEN NULL THEN [] ELSE [1] END |
        DETACH DELETE this_actors1
    )
    RETURN count(*)
}
DETACH DELETE this
```

### Expected Cypher Params

```json
{
    "this_id": "123",
    "this_deleteMovies": {
        "args": {
            "delete": {
                "actors": [
                    {
                        "where": {
                            "node": {
                                "name": "Actor to delete"
                            }
                        }
                    },
                    {
                        "where": {
                            "node": {
                                "name": "Another actor to delete"
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

## Double Nested Delete

### GraphQL Input

```graphql
mutation {
    deleteMovies(
        where: { id: 123 }
        delete: {
            actors: {
                where: { node: { name: "Actor to delete" } }
                delete: { movies: { where: { node: { id: 321 } } } }
            }
        }
    ) {
        nodesDeleted
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Movie)
WHERE this.id = $this_id
WITH this
OPTIONAL MATCH (this)<-[this_actors0_relationship:ACTED_IN]-(this_actors0:Actor)
WHERE this_actors0.name = $this_deleteMovies.args.delete.actors[0].where.node.name
WITH this, this_actors0
OPTIONAL MATCH (this_actors0)-[this_actors0_movies0_relationship:ACTED_IN]->(this_actors0_movies0:Movie)
WHERE this_actors0_movies0.id = $this_deleteMovies.args.delete.actors[0].delete.movies[0].where.node.id
WITH this, this_actors0, this_actors0_movies0
CALL {
    WITH this_actors0_movies0
    FOREACH(_ IN CASE this_actors0_movies0 WHEN NULL THEN [] ELSE [1] END |
        DETACH DELETE this_actors0_movies0
    )
    RETURN count(*)
}
WITH this, this_actors0
CALL {
    WITH this_actors0
    FOREACH(_ IN CASE this_actors0 WHEN NULL THEN [] ELSE [1] END |
        DETACH DELETE this_actors0
    )
    RETURN count(*)
}
DETACH DELETE this
```

### Expected Cypher Params

```json
{
    "this_id": "123",
    "this_deleteMovies": {
        "args": {
            "delete": {
                "actors": [
                    {
                        "delete": {
                            "movies": [
                                {
                                    "where": {
                                        "node": {
                                            "id": "321"
                                        }
                                    }
                                }
                            ]
                        },
                        "where": {
                            "node": {
                                "name": "Actor to delete"
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

## Triple Nested Delete

### GraphQL Input

```graphql
mutation {
    deleteMovies(
        where: { id: 123 }
        delete: {
            actors: {
                where: { node: { name: "Actor to delete" } }
                delete: {
                    movies: {
                        where: { node: { id: 321 } }
                        delete: {
                            actors: {
                                where: {
                                    node: { name: "Another actor to delete" }
                                }
                            }
                        }
                    }
                }
            }
        }
    ) {
        nodesDeleted
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Movie)
WHERE this.id = $this_id
WITH this
OPTIONAL MATCH (this)<-[this_actors0_relationship:ACTED_IN]-(this_actors0:Actor)
WHERE this_actors0.name = $this_deleteMovies.args.delete.actors[0].where.node.name
WITH this, this_actors0
OPTIONAL MATCH (this_actors0)-[this_actors0_movies0_relationship:ACTED_IN]->(this_actors0_movies0:Movie)
WHERE this_actors0_movies0.id = $this_deleteMovies.args.delete.actors[0].delete.movies[0].where.node.id
WITH this, this_actors0, this_actors0_movies0
OPTIONAL MATCH (this_actors0_movies0)<-[this_actors0_movies0_actors0_relationship:ACTED_IN]-(this_actors0_movies0_actors0:Actor)
WHERE this_actors0_movies0_actors0.name = $this_deleteMovies.args.delete.actors[0].delete.movies[0].delete.actors[0].where.node.name

WITH this, this_actors0, this_actors0_movies0, this_actors0_movies0_actors0
CALL {
    WITH this_actors0_movies0_actors0
    FOREACH(_ IN CASE this_actors0_movies0_actors0 WHEN NULL THEN [] ELSE [1] END |
        DETACH DELETE this_actors0_movies0_actors0
    )
    RETURN count(*)
}

WITH this, this_actors0, this_actors0_movies0
CALL {
    WITH this_actors0_movies0
    FOREACH(_ IN CASE this_actors0_movies0 WHEN NULL THEN [] ELSE [1] END |
        DETACH DELETE this_actors0_movies0
    )
    RETURN count(*)
}

WITH this, this_actors0
CALL {
    WITH this_actors0
    FOREACH(_ IN CASE this_actors0 WHEN NULL THEN [] ELSE [1] END |
        DETACH DELETE this_actors0
    )
    RETURN count(*)
}
DETACH DELETE this
```

### Expected Cypher Params

```json
{
    "this_id": "123",
    "this_deleteMovies": {
        "args": {
            "delete": {
                "actors": [
                    {
                        "delete": {
                            "movies": [
                                {
                                    "delete": {
                                        "actors": [
                                            {
                                                "where": {
                                                    "node": {
                                                        "name": "Another actor to delete"
                                                    }
                                                }
                                            }
                                        ]
                                    },
                                    "where": {
                                        "node": {
                                            "id": "321"
                                        }
                                    }
                                }
                            ]
                        },
                        "where": {
                            "node": {
                                "name": "Actor to delete"
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
