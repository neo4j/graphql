# Cypher Union

Tests for queries on Unions.

Schema:

```schema
union Search = Movie | Genre

type Genre @auth(rules: [
    {
        operations: [READ],
        allow: {
            name: "$jwt.jwtAllowedNamesExample"
        }
    }
]) {
    name: String
}

type Movie {
    title: String
    search: [Search] @relationship(type: "SEARCH", direction: OUT)
}
```

---

## Read Unions

### GraphQL Input

```graphql
{
    movies(where: { title: "some title" }) {
        search(
            where: { Movie: { title: "The Matrix" }, Genre: { name: "Horror" } }
            options: { offset: 1, limit: 10 }
        ) {
            ... on Movie {
                title
            }
            ... on Genre {
                name
            }
        }
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Movie)
WHERE this.title = $this_title

RETURN this {
    search: [(this)-[:SEARCH]->(this_search)
        WHERE "Genre" IN labels(this_search) OR "Movie" IN labels(this_search) |
        head(
            [ this_search IN [this_search]
                WHERE "Genre" IN labels (this_search) AND
                this_search.name = $this_search_Genre_name AND
                apoc.util.validatePredicate(NOT(EXISTS(this_search.name) AND this_search.name = $this_search_Genre_auth_allow0_name), "@neo4j/graphql/FORBIDDEN", [0])  |
                this_search {
                    __resolveType: "Genre",
                     .name
                } ] +
            [ this_search IN [this_search]
                WHERE "Movie" IN labels (this_search) AND
                this_search.title = $this_search_Movie_title |
                this_search {
                    __resolveType: "Movie",
                    .title
                } ]
        )
    ] [1..11]
} as this
```

### Expected Cypher Params

```json
{
    "this_title": "some title",
    "this_search_Genre_auth_allow0_name": ["Horror"],
    "this_search_Genre_name": "Horror",
    "this_search_Movie_title": "The Matrix"
}
```

### JWT Object

```json
{
    "jwtAllowedNamesExample": ["Horror"]
}
```

---

## Create Unions from create mutation

### GraphQL Input

```graphql
mutation {
    createMovies(
        input: [
            {
                title: "some movie"
                search: {
                    Genre: { create: [{ node: { name: "some genre" } }] }
                }
            }
        ]
    ) {
        movies {
            title
        }
    }
}
```

### Expected Cypher Output

```cypher
CALL {
    CREATE (this0:Movie)
    SET this0.title = $this0_title

    WITH this0
    CREATE (this0_search_Genre0_node:Genre)
    SET this0_search_Genre0_node.name = $this0_search_Genre0_node_name
    MERGE (this0)-[:SEARCH]->(this0_search_Genre0_node)

    RETURN this0
}

RETURN this0 {
    .title
} AS this0
```

### Expected Cypher Params

```json
{
    "this0_title": "some movie",
    "this0_search_Genre0_node_name": "some genre"
}
```

---

## Create Unions from update create(top-level)

### GraphQL Input

```graphql
mutation {
    updateMovies(
        create: { search: { Genre: [{ node: { name: "some genre" } }] } }
    ) {
        movies {
            title
        }
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Movie)
CREATE (this_create_search_Genre0_node:Genre)
SET this_create_search_Genre0_node.name = $this_create_search_Genre0_node_name
MERGE (this)-[:SEARCH]->(this_create_search_Genre0_node)
RETURN this { .title } AS this
```

### Expected Cypher Params

```json
{
    "this_create_search_Genre0_node_name": "some genre"
}
```

---

## Connect Unions (in create)

### GraphQL Input

```graphql
mutation {
    createMovies(
        input: [
            {
                title: "some movie"
                search: {
                    Genre: {
                        connect: [{ where: { node: { name: "some genre" } } }]
                    }
                }
            }
        ]
    ) {
        movies {
            title
        }
    }
}
```

### Expected Cypher Output

```cypher
CALL {
    CREATE (this0:Movie)
    SET this0.title = $this0_title

    WITH this0
    OPTIONAL MATCH (this0_search_Genre_connect0_node:Genre)
    WHERE this0_search_Genre_connect0_node.name = $this0_search_Genre_connect0_node_name
    FOREACH(_ IN CASE this0_search_Genre_connect0_node WHEN NULL THEN [] ELSE [1] END |
        MERGE (this0)-[:SEARCH]->(this0_search_Genre_connect0_node)
    )

    RETURN this0
}

RETURN this0 { .title } AS this0
```

### Expected Cypher Params

```json
{
    "this0_title": "some movie",
    "this0_search_Genre_connect0_node_name": "some genre"
}
```

---

## Update Unions

### GraphQL Input

```graphql
mutation {
    updateMovies(
        where: { title: "some movie" }
        update: {
            search: {
                Genre: {
                    where: { node: { name: "some genre" } }
                    update: { node: { name: "some new genre" } }
                }
            }
        }
    ) {
        movies {
            title
        }
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Movie)
WHERE this.title = $this_title

WITH this
OPTIONAL MATCH (this)-[this_search0:SEARCH]->(this_search_Genre0:Genre)
WHERE this_search_Genre0.name = $updateMovies.args.update.search.Genre[0].where.node.name
CALL apoc.do.when(this_search_Genre0 IS NOT NULL, " SET this_search_Genre0.name = $this_update_search_Genre0_name RETURN count(*) ", "", {this:this, updateMovies: $updateMovies, this_search_Genre0:this_search_Genre0, auth:$auth,this_update_search_Genre0_name:$this_update_search_Genre0_name}) YIELD value as _

RETURN this { .title } AS this
```

### Expected Cypher Params

```json
{
    "this_title": "some movie",
    "this_update_search_Genre0_name": "some new genre",
    "auth": {
        "isAuthenticated": true,
        "roles": [],
        "jwt": {}
    },
    "updateMovies": {
        "args": {
            "update": {
                "search": {
                    "Genre": [
                        {
                            "update": {
                                "node": {
                                    "name": "some new genre"
                                }
                            },
                            "where": {
                                "node": {
                                    "name": "some genre"
                                }
                            }
                        }
                    ]
                }
            }
        }
    }
}
```

---

## Disconnect Unions (in update)

### GraphQL Input

```graphql
mutation {
    updateMovies(
        where: { title: "some movie" }
        update: {
            search: {
                Genre: {
                    disconnect: [{ where: { node: { name: "some genre" } } }]
                }
            }
        }
    ) {
        movies {
            title
        }
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Movie)
WHERE this.title = $this_title

WITH this
OPTIONAL MATCH (this)-[this_search_Genre0_disconnect0_rel:SEARCH]->(this_search_Genre0_disconnect0:Genre)
WHERE this_search_Genre0_disconnect0.name = $updateMovies.args.update.search.Genre[0].disconnect[0].where.node.name
FOREACH(_ IN CASE this_search_Genre0_disconnect0 WHEN NULL THEN [] ELSE [1] END |
    DELETE this_search_Genre0_disconnect0_rel
)

RETURN this { .title } AS this
```

### Expected Cypher Params

```json
{
    "this_title": "some movie",
    "updateMovies": {
        "args": {
            "update": {
                "search": {
                    "Genre": [
                        {
                            "disconnect": [
                                {
                                    "where": {
                                        "node": {
                                            "name": "some genre"
                                        }
                                    }
                                }
                            ]
                        }
                    ]
                }
            }
        }
    }
}
```

---

## Disconnect Unions

### GraphQL Input

```graphql
mutation {
    updateMovies(
        where: { title: "some movie" }
        disconnect: {
            search: { Genre: { where: { node: { name: "some genre" } } } }
        }
    ) {
        movies {
            title
        }
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Movie)
WHERE this.title = $this_title

WITH this
OPTIONAL MATCH (this)-[this_disconnect_search_Genre0_rel:SEARCH]->(this_disconnect_search_Genre0:Genre)
WHERE this_disconnect_search_Genre0.name = $updateMovies.args.disconnect.search.Genre[0].where.node.name
FOREACH(_ IN CASE this_disconnect_search_Genre0 WHEN NULL THEN [] ELSE [1] END |
    DELETE this_disconnect_search_Genre0_rel
)

RETURN this { .title } AS this
```

### Expected Cypher Params

```json
{
    "this_title": "some movie",
    "updateMovies": {
        "args": {
            "disconnect": {
                "search": {
                    "Genre": [
                        {
                            "where": {
                                "node": {
                                    "name": "some genre"
                                }
                            }
                        }
                    ]
                }
            }
        }
    }
}
```

---

## Connect Unions (in update)

### GraphQL Input

```graphql
mutation {
    updateMovies(
        where: { title: "some movie" }
        connect: {
            search: { Genre: { where: { node: { name: "some genre" } } } }
        }
    ) {
        movies {
            title
        }
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Movie)
WHERE this.title = $this_title
WITH this
OPTIONAL MATCH (this_connect_search_Genre0_node:Genre)
WHERE this_connect_search_Genre0_node.name = $this_connect_search_Genre0_node_name
FOREACH(_ IN CASE this_connect_search_Genre0_node WHEN NULL THEN [] ELSE [1] END | MERGE (this)-[:SEARCH]->(this_connect_search_Genre0_node) )
RETURN this { .title } AS this
```

### Expected Cypher Params

```json
{
    "this_title": "some movie",
    "this_connect_search_Genre0_node_name": "some genre"
}
```

---

## Delete Unions (from update)

### GraphQL Input

```graphql
mutation {
    updateMovies(
        where: { title: "some movie" }
        delete: {
            search: { Genre: { where: { node: { name: "some genre" } } } }
        }
    ) {
        movies {
            title
        }
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Movie)
WHERE this.title = $this_title
WITH this
OPTIONAL MATCH (this)-[this_delete_search_Genre0_relationship:SEARCH]->(this_delete_search_Genre0:Genre)
WHERE this_delete_search_Genre0.name = $updateMovies.args.delete.search.Genre[0].where.node.name
FOREACH(_ IN CASE this_delete_search_Genre0 WHEN NULL THEN [] ELSE [1] END | DETACH DELETE this_delete_search_Genre0 )
RETURN this { .title } AS this
```

### Expected Cypher Params

```json
{
    "this_title": "some movie",
    "updateMovies": {
        "args": {
            "delete": {
                "search": {
                    "Genre": [
                        {
                            "where": {
                                "node": {
                                    "name": "some genre"
                                }
                            }
                        }
                    ]
                }
            }
        }
    }
}
```

---
