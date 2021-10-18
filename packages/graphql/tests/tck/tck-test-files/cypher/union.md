# Cypher Union

Tests for queries on Unions.

Schema:

```graphql
union Search = Movie | Genre

type Genre @auth(rules: [{ operations: [READ], allow: { name: "$jwt.jwtAllowedNamesExample" } }]) {
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
    search: [this_search IN [(this)-[:SEARCH]->(this_search)
        WHERE ("Genre" IN labels(this_search)) OR ("Movie" IN labels(this_search)) |
        head(
            [ this_search IN [this_search]
                WHERE ("Genre" IN labels(this_search)) AND
                this_search.name = $this_search_Genre_name AND
                apoc.util.validatePredicate(NOT(this_search.name IS NOT NULL AND this_search.name = $this_search_Genre_auth_allow0_name), "@neo4j/graphql/FORBIDDEN", [0])  |
                this_search {
                    __resolveType: "Genre",
                     .name
                } ] +
            [ this_search IN [this_search]
                WHERE ("Movie" IN labels(this_search)) AND
                this_search.title = $this_search_Movie_title |
                this_search {
                    __resolveType: "Movie",
                    .title
                } ]
        )
    ] WHERE this_search IS NOT NULL] [1..11]
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
    createMovies(input: [{ title: "some movie", search: { Genre: { create: [{ node: { name: "some genre" } }] } } }]) {
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

    WITH this0, [ metaVal IN [{type: 'Created', name: 'Movie', id: id(this0), properties: this0}] WHERE metaVal IS NOT NULL AND metaVal.id IS NOT NULL ] as this0_mutateMeta
    CREATE (this0_search_Genre0_node:Genre)
    SET this0_search_Genre0_node.name = $this0_search_Genre0_node_name
    MERGE (this0)-[:SEARCH]->(this0_search_Genre0_node)

    RETURN this0, this0_mutateMeta
}
WITH this0_mutateMeta as mutateMeta
RETURN mutateMeta, this0 { .title } AS this0
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
    updateMovies(create: { search: { Genre: [{ node: { name: "some genre" } }] } }) {
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
RETURN [ metaVal IN [{type: 'Created', name: 'Genre', id: id(this_create_search_Genre0_node), properties: this_create_search_Genre0_node}] WHERE metaVal IS NOT NULL AND metaVal.id IS NOT NULL ] as mutateMeta, this { .title } AS this
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
        input: [{ title: "some movie", search: { Genre: { connect: [{ where: { node: { name: "some genre" } } }] } } }]
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

    WITH this0, [ metaVal IN [{type: 'Created', name: 'Movie', id: id(this0), properties: this0}] WHERE metaVal IS NOT NULL AND metaVal.id IS NOT NULL ] as this0_mutateMeta

    CALL {
        WITH this0
        MATCH (this0_search_Genre_connect0_node:Genre)
        WHERE this0_search_Genre_connect0_node.name = $this0_search_Genre_connect0_node_name
        MERGE (this0)-[:SEARCH]->(this0_search_Genre_connect0_node)
        RETURN [ metaVal IN [{type: 'Connected', name: 'Movie', toName: 'Genre', id: id(this0), toID: id(this0_search_Genre_connect0_node), properties: this0_search_Genre_connect0_relationship}] WHERE metaVal IS NOT NULL AND metaVal.id IS NOT NULL ] as this0_search_Genre_connect0_mutateMeta
    }

    WITH this0, this0_mutateMeta + this0_search_Genre_connect0_mutateMeta as this0_mutateMeta
    RETURN this0, this0_mutateMeta
}
WITH this0_mutateMeta as mutateMeta
RETURN mutateMeta, this0 { .title } AS this0
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
            search: { Genre: { where: { node: { name: "some genre" } }, update: { node: { name: "some new genre" } } } }
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

WITH this, [ metaVal IN [{type: 'Updated', name: 'Movie', id: id(this), properties: $this_update}] WHERE metaVal IS NOT NULL AND metaVal.id IS NOT NULL ] as mutateMeta
OPTIONAL MATCH (this)-[this_search0_relationship:SEARCH]->(this_search_Genre0:Genre)
WHERE this_search_Genre0.name = $updateMovies.args.update.search.Genre[0].where.node.name
CALL apoc.do.when(this_search_Genre0 IS NOT NULL, "
    SET this_search_Genre0.name = $this_update_search_Genre0_name
    RETURN id(this_search_Genre0) as _id ", "", {this:this, updateMovies: $updateMovies, this_search_Genre0:this_search_Genre0, auth:$auth,this_update_search_Genre0_name:$this_update_search_Genre0_name,this_update_search_Genre0:$this_update_search_Genre0}) 

YIELD value

RETURN mutateMeta + [ metaVal IN [{type: 'Updated', name: 'Genre', id: value._id, properties: $this_update_search_Genre0}] WHERE metaVal IS NOT NULL AND metaVal.id IS NOT NULL ] as mutateMeta, this { .title } AS this
```

### Expected Cypher Params

```json
{
    "this_title": "some movie",
    "this_update_search_Genre0_name": "some new genre",
    "this_update": {},
    "this_update_search_Genre0": {
        "name": "some new genre"
    },
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
        update: { search: { Genre: { disconnect: [{ where: { node: { name: "some genre" } } }] } } }
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
CALL {
    WITH this
    OPTIONAL MATCH (this)-[this_search_Genre0_disconnect0_rel:SEARCH]->(this_search_Genre0_disconnect0:Genre)
    WHERE this_search_Genre0_disconnect0.name = $updateMovies.args.update.search.Genre[0].disconnect[0].where.node.name
    FOREACH(_ IN CASE this_search_Genre0_disconnect0 WHEN NULL THEN [] ELSE [1] END |
        DELETE this_search_Genre0_disconnect0_rel
    )

    RETURN count(*)
}

RETURN [ metaVal IN [{type: 'Updated', name: 'Movie', id: id(this), properties: $this_update}] WHERE metaVal IS NOT NULL AND metaVal.id IS NOT NULL ] as mutateMeta, this { .title } AS this
```

### Expected Cypher Params

```json
{
    "this_title": "some movie",
    "this_update": {},
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
        disconnect: { search: { Genre: { where: { node: { name: "some genre" } } } } }
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
CALL {
    WITH this
    OPTIONAL MATCH (this)-[this_disconnect_search_Genre0_rel:SEARCH]->(this_disconnect_search_Genre0:Genre)
    WHERE this_disconnect_search_Genre0.name = $updateMovies.args.disconnect.search.Genre[0].where.node.name
    FOREACH(_ IN CASE this_disconnect_search_Genre0 WHEN NULL THEN [] ELSE [1] END |
        DELETE this_disconnect_search_Genre0_rel
    )
    RETURN count(*)
}

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
        connect: { search: { Genre: { where: { node: { name: "some genre" } } } } }
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
CALL {
    WITH this
    MATCH (this_connect_search_Genre0_node:Genre)
    WHERE this_connect_search_Genre0_node.name = $this_connect_search_Genre0_node_name
    MERGE (this)-[:SEARCH]->(this_connect_search_Genre0_node)
    RETURN [ metaVal IN [{type: 'Connected', name: 'Movie', toName: 'Genre', id: id(this), toID: id(this_connect_search_Genre0_node), properties: this_connect_search_Genre0_relationship}] WHERE metaVal IS NOT NULL AND metaVal.id IS NOT NULL ] as this_connect_search_Genre0_mutateMeta
}

WITH this, this_connect_search_Genre0_mutateMeta as mutateMeta
RETURN mutateMeta, this { .title } AS this
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
        delete: { search: { Genre: { where: { node: { name: "some genre" } } } } }
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
WITH this, collect(DISTINCT this_delete_search_Genre0) as this_delete_search_Genre0_to_delete
FOREACH(x IN this_delete_search_Genre0_to_delete | DETACH DELETE x)
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
