## Cypher Update

Tests Update operations.

Schema:

```schema
type Actor {
    name: String
    movies: [Movie] @relationship(type: "ACTED_IN", properties: "ActedIn", direction: OUT)
}

type Movie {
    id: ID
    title: String
    actors: [Actor]! @relationship(type: "ACTED_IN", properties: "ActedIn", direction: IN)
}

interface ActedIn {
    screenTime: Int
}

```

---

### Simple Update

**GraphQL input**

```graphql
mutation {
    updateMovies(where: { id: "1" }, update: { id: "2" }) {
        movies {
            id
        }
    }
}
```

**Expected Cypher output**

```cypher
MATCH (this:Movie)
WHERE this.id = $this_id
SET this.id = $this_update_id

RETURN this { .id } AS this
```

**Expected Cypher params**

```cypher-params
{
    "this_id": "1",
    "this_update_id": "2"
}
```

---

### Single Nested Update

**GraphQL input**

```graphql
mutation {
    updateMovies(
        where: { id: "1" }
        update: {
            actors: [
                {
                    where: { node: { name: "old name" } }
                    update: { node: { name: "new name" } }
                }
            ]
        }
    ) {
        movies {
            id
        }
    }
}
```

**Expected Cypher output**

```cypher
MATCH (this:Movie)
WHERE this.id = $this_id
WITH this
OPTIONAL MATCH (this)<-[this_acted_in0:ACTED_IN]-(this_actors0:Actor)
WHERE this_actors0.name = $updateMovies.args.update.actors[0].where.node.name
CALL apoc.do.when(this_actors0 IS NOT NULL,
  "
    SET this_actors0.name = $this_update_actors0_name
    RETURN count(*)
  ",
  "",
  {this:this, updateMovies: $updateMovies, this_actors0:this_actors0, auth:$auth,this_update_actors0_name:$this_update_actors0_name}) YIELD value as _

RETURN this { .id } AS this
```

**Expected Cypher params**

```cypher-params
{
    "this_id": "1",
    "this_update_actors0_name": "new name",
    "auth": {
       "isAuthenticated": true,
       "roles": [],
       "jwt": {}
    },
    "updateMovies": {
        "args": {
            "update": {
                "actors": [
                    {
                        "update": {
                            "node": {
                                "name": "new name"
                            }
                        },
                        "where": {
                            "node": {
                                "name": "old name"
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

### Double Nested Update

**GraphQL input**

```graphql
mutation {
    updateMovies(
        where: { id: "1" }
        update: {
            actors: [
                {
                    where: { node: { name: "old actor name" } }
                    update: {
                        node: {
                            name: "new actor name"
                            movies: [
                                {
                                    where: { node: { id: "old movie title" } }
                                    update: {
                                        node: { title: "new movie title" }
                                    }
                                }
                            ]
                        }
                    }
                }
            ]
        }
    ) {
        movies {
            id
        }
    }
}
```

**Expected Cypher output**

```cypher
MATCH (this:Movie)
WHERE this.id = $this_id
WITH this
OPTIONAL MATCH (this)<-[this_acted_in0:ACTED_IN]-(this_actors0:Actor)
WHERE this_actors0.name = $updateMovies.args.update.actors[0].where.node.name
CALL apoc.do.when(this_actors0 IS NOT NULL, "
    SET this_actors0.name = $this_update_actors0_name

    WITH this, this_actors0
    OPTIONAL MATCH (this_actors0)-[this_actors0_acted_in0:ACTED_IN]->(this_actors0_movies0:Movie)
    WHERE this_actors0_movies0.id = $updateMovies.args.update.actors[0].update.node.movies[0].where.node.id
    CALL apoc.do.when(this_actors0_movies0 IS NOT NULL, \"
        SET this_actors0_movies0.title = $this_update_actors0_movies0_title
        RETURN count(*)
    \",
      \"\",
      {this_actors0:this_actors0, updateMovies: $updateMovies, this_actors0_movies0:this_actors0_movies0, auth:$auth,this_update_actors0_movies0_title:$this_update_actors0_movies0_title}) YIELD value as _

    RETURN count(*)
  ",
  "",
  {this:this, updateMovies: $updateMovies, this_actors0:this_actors0, auth:$auth,this_update_actors0_name:$this_update_actors0_name,this_update_actors0_movies0_title:$this_update_actors0_movies0_title}) YIELD value as _

RETURN this { .id } AS this
```

**Expected Cypher params**

```cypher-params
{
    "this_id": "1",
    "this_update_actors0_movies0_title": "new movie title",
    "this_update_actors0_name": "new actor name",
    "auth": {
       "isAuthenticated": true,
       "roles": [],
       "jwt": {}
    },
    "updateMovies": {
      "args": {
        "update": {
          "actors": [
                {
                    "update": {
                        "node": {
                            "movies": [
                                {
                                    "update": {
                                        "node": {
                                            "title": "new movie title"
                                        }
                                    },
                                    "where": {
                                        "node": {
                                            "id": "old movie title"
                                        }
                                    }
                                }
                            ],
                            "name": "new actor name"
                        }
                    },
                    "where": {
                        "node": {
                            "name": "old actor name"
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

### Simple Update as Connect

**GraphQL input**

```graphql
mutation {
    updateMovies(
        where: { id: "1" }
        connect: { actors: [{ where: { node: { name: "Daniel" } } }] }
    ) {
        movies {
            id
        }
    }
}
```

**Expected Cypher output**

```cypher
MATCH (this:Movie)
WHERE this.id = $this_id
WITH this
OPTIONAL MATCH (this_connect_actors0_node:Actor)
WHERE this_connect_actors0_node.name = $this_connect_actors0_node_name
FOREACH(_ IN CASE this_connect_actors0_node WHEN NULL THEN [] ELSE [1] END |
    MERGE (this)<-[:ACTED_IN]-(this_connect_actors0_node)
)
RETURN this { .id } AS this
```

**Expected Cypher params**

```cypher-params
{
    "this_id": "1",
    "this_connect_actors0_node_name": "Daniel"
}
```

---

### Update as multiple Connect

**GraphQL input**

```graphql
mutation {
    updateMovies(
        where: { id: "1" }
        connect: {
            actors: [
                { where: { node: { name: "Daniel" } } }
                { where: { node: { name: "Darrell" } } }
            ]
        }
    ) {
        movies {
            id
        }
    }
}
```

**Expected Cypher output**

```cypher
MATCH (this:Movie)
WHERE this.id = $this_id
WITH this
OPTIONAL MATCH (this_connect_actors0_node:Actor)
WHERE this_connect_actors0_node.name = $this_connect_actors0_node_name
FOREACH(_ IN CASE this_connect_actors0_node WHEN NULL THEN [] ELSE [1] END |
    MERGE (this)<-[:ACTED_IN]-(this_connect_actors0_node)
)
WITH this
OPTIONAL MATCH (this_connect_actors1_node:Actor)
WHERE this_connect_actors1_node.name = $this_connect_actors1_node_name
FOREACH(_ IN CASE this_connect_actors1_node WHEN NULL THEN [] ELSE [1] END |
    MERGE (this)<-[:ACTED_IN]-(this_connect_actors1_node)
)
RETURN this { .id } AS this
```

**Expected Cypher params**

```cypher-params
{
    "this_id": "1",
    "this_connect_actors0_node_name": "Daniel",
    "this_connect_actors1_node_name": "Darrell"
}
```

---

### Simple Update as Disconnect

**GraphQL input**

```graphql
mutation {
    updateMovies(
        where: { id: "1" }
        disconnect: { actors: [{ where: { node: { name: "Daniel" } } }] }
    ) {
        movies {
            id
        }
    }
}
```

**Expected Cypher output**

```cypher
MATCH (this:Movie)
WHERE this.id = $this_id
WITH this
OPTIONAL MATCH (this)<-[this_disconnect_actors0_rel:ACTED_IN]-(this_disconnect_actors0:Actor)
WHERE this_disconnect_actors0.name = $updateMovies.args.disconnect.actors[0].where.node.name
FOREACH(_ IN CASE this_disconnect_actors0 WHEN NULL THEN [] ELSE [1] END |
DELETE this_disconnect_actors0_rel
)
RETURN this { .id } AS this
```

**Expected Cypher params**

```cypher-params
{
    "this_id": "1",
    "updateMovies": {
        "args": {
            "disconnect": {
                "actors": [
                    {
                        "where": {
                            "node": {
                                "name": "Daniel"
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

### Update as multiple Disconnect

**GraphQL input**

```graphql
mutation {
    updateMovies(
        where: { id: "1" }
        disconnect: {
            actors: [
                { where: { node: { name: "Daniel" } } }
                { where: { node: { name: "Darrell" } } }
            ]
        }
    ) {
        movies {
            id
        }
    }
}
```

**Expected Cypher output**

```cypher
MATCH (this:Movie)
WHERE this.id = $this_id
WITH this
OPTIONAL MATCH (this)<-[this_disconnect_actors0_rel:ACTED_IN]-(this_disconnect_actors0:Actor)
WHERE this_disconnect_actors0.name = $updateMovies.args.disconnect.actors[0].where.node.name
FOREACH(_ IN CASE this_disconnect_actors0 WHEN NULL THEN [] ELSE [1] END |
DELETE this_disconnect_actors0_rel
)
WITH this
OPTIONAL MATCH (this)<-[this_disconnect_actors1_rel:ACTED_IN]-(this_disconnect_actors1:Actor)
WHERE this_disconnect_actors1.name = $updateMovies.args.disconnect.actors[1].where.node.name
FOREACH(_ IN CASE this_disconnect_actors1 WHEN NULL THEN [] ELSE [1] END |
DELETE this_disconnect_actors1_rel
)
RETURN this { .id } AS this
```

**Expected Cypher params**

```cypher-params
{
    "this_id": "1",
    "updateMovies": {
        "args": {
            "disconnect": {
                "actors": [
                    {
                        "where": {
                            "node": {
                                "name": "Daniel"
                            }
                        }
                    },
                    {
                        "where": {
                            "node": {
                                "name": "Darrell"
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

### Update an Actor while creating and connecting to a new Movie (via field level)

**GraphQL input**

```graphql
mutation {
    updateActors(
        where: { name: "Dan" }
        update: {
            movies: {
                create: [
                    { node: { id: "dan_movie_id", title: "The Story of Beer" } }
                ]
            }
        }
    ) {
        actors {
            name
            movies {
                id
                title
            }
        }
    }
}
```

**Expected Cypher output**

```cypher
MATCH (this:Actor)
WHERE this.name = $this_name

WITH this
CREATE (this_movies0_create0_node:Movie)
SET this_movies0_create0_node.id = $this_movies0_create0_node_id
SET this_movies0_create0_node.title = $this_movies0_create0_node_title
MERGE (this)-[:ACTED_IN]->(this_movies0_create0_node)

RETURN this { .name, movies: [ (this)-[:ACTED_IN]->(this_movies:Movie)  | this_movies { .id, .title } ] } AS this
```

**Expected Cypher params**

```cypher-params
{
  "this_name": "Dan",
  "this_movies0_create0_node_id": "dan_movie_id",
  "this_movies0_create0_node_title": "The Story of Beer"
}
```

---

### Update an Actor while creating and connecting to a new Movie (via top level)

**GraphQL input**

```graphql
mutation {
    updateActors(
        where: { name: "Dan" }
        create: {
            movies: [
                { node: { id: "dan_movie_id", title: "The Story of Beer" } }
            ]
        }
    ) {
        actors {
            name
            movies {
                id
                title
            }
        }
    }
}
```

**Expected Cypher output**

```cypher
MATCH (this:Actor)
WHERE this.name = $this_name

CREATE (this_create_movies0_node:Movie)
SET this_create_movies0_node.id = $this_create_movies0_node_id
SET this_create_movies0_node.title = $this_create_movies0_node_title
MERGE (this)-[:ACTED_IN]->(this_create_movies0_node)

RETURN this { .name, movies: [ (this)-[:ACTED_IN]->(this_movies:Movie) | this_movies { .id, .title } ] } AS this
```

**Expected Cypher params**

```cypher-params
{
  "this_name": "Dan",
  "this_create_movies0_node_id": "dan_movie_id",
  "this_create_movies0_node_title": "The Story of Beer"
}
```

---

### Update an Actor while creating and connecting to multiple new Movies (via top level)

**GraphQL input**

```graphql
mutation {
    updateActors(
        where: { name: "Dan" }
        create: {
            movies: [
                { node: { id: "dan_movie_id", title: "The Story of Beer" } }
                { node: { id: "dan_movie2_id", title: "Forrest Gump" } }
            ]
        }
    ) {
        actors {
            name
            movies {
                id
                title
            }
        }
    }
}
```

**Expected Cypher output**

```cypher
MATCH (this:Actor)
WHERE this.name = $this_name

CREATE (this_create_movies0_node:Movie)
SET this_create_movies0_node.id = $this_create_movies0_node_id
SET this_create_movies0_node.title = $this_create_movies0_node_title
MERGE (this)-[:ACTED_IN]->(this_create_movies0_node)

CREATE (this_create_movies1_node:Movie)
SET this_create_movies1_node.id = $this_create_movies1_node_id
SET this_create_movies1_node.title = $this_create_movies1_node_title
MERGE (this)-[:ACTED_IN]->(this_create_movies1_node)

RETURN this { .name, movies: [ (this)-[:ACTED_IN]->(this_movies:Movie) | this_movies { .id, .title } ] } AS this
```

**Expected Cypher params**

```cypher-params
{
  "this_name": "Dan",
  "this_create_movies0_node_id": "dan_movie_id",
  "this_create_movies0_node_title": "The Story of Beer",
  "this_create_movies1_node_id": "dan_movie2_id",
  "this_create_movies1_node_title": "Forrest Gump"
}
```

---

### Delete related node as update

**GraphQL input**

```graphql
mutation {
    updateMovies(
        where: { id: "1" }
        delete: {
            actors: {
                where: {
                    node: { name: "Actor to delete" }
                    relationship: { screenTime: 60 }
                }
            }
        }
    ) {
        movies {
            id
        }
    }
}
```

**Expected Cypher output**

```cypher
MATCH (this:Movie)
WHERE this.id = $this_id
WITH this
OPTIONAL MATCH (this)<-[this_delete_actors0_relationship:ACTED_IN]-(this_delete_actors0:Actor)
WHERE this_delete_actors0_relationship.screenTime = $updateMovies.args.delete.actors[0].where.relationship.screenTime AND this_delete_actors0.name = $updateMovies.args.delete.actors[0].where.node.name
FOREACH(_ IN CASE this_delete_actors0 WHEN NULL THEN [] ELSE [1] END |
    DETACH DELETE this_delete_actors0
)
RETURN this { .id } AS this
```

**Expected Cypher params**

```cypher-params
{
    "this_id": "1",
    "updateMovies": {
      "args": {
        "delete": {
          "actors": [
            {
              "where": {
                "node": {
                  "name": "Actor to delete"
                },
                "relationship": {
                    "screenTime": {
                        "high": 0,
                        "low": 60
                    }
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

### Delete and update nested operations under same mutation

**GraphQL input**

```graphql
mutation {
    updateMovies(
        where: { id: "1" }
        update: {
            actors: {
                where: { node: { name: "Actor to update" } }
                update: { node: { name: "Updated name" } }
            }
        }
        delete: { actors: { where: { node: { name: "Actor to delete" } } } }
    ) {
        movies {
            id
        }
    }
}
```

**Expected Cypher output**

```cypher
MATCH (this:Movie)
WHERE this.id = $this_id
WITH this
OPTIONAL MATCH (this)<-[this_acted_in0:ACTED_IN]-(this_actors0:Actor)
WHERE this_actors0.name = $updateMovies.args.update.actors[0].where.node.name
CALL apoc.do.when(this_actors0 IS NOT NULL, "
    SET this_actors0.name = $this_update_actors0_name
    RETURN count(*)
",
"",
{this:this, updateMovies: $updateMovies, this_actors0:this_actors0, auth:$auth,this_update_actors0_name:$this_update_actors0_name}) YIELD value as _
WITH this
OPTIONAL MATCH (this)<-[this_delete_actors0_relationship:ACTED_IN]-(this_delete_actors0:Actor)
WHERE this_delete_actors0.name = $updateMovies.args.delete.actors[0].where.node.name
FOREACH(_ IN CASE this_delete_actors0 WHEN NULL THEN [] ELSE [1] END |
    DETACH DELETE this_delete_actors0
)
RETURN this { .id } AS this
```

**Expected Cypher params**

```cypher-params
{
    "this_id": "1",
    "this_update_actors0_name": "Updated name",
    "auth": {
        "isAuthenticated": true,
        "jwt": {},
        "roles": []
    },
    "updateMovies": {
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
            },
            "update": {
                "actors": [
                    {
                        "update": {
                            "node": {
                                "name": "Updated name"
                            }
                        },
                        "where": {
                            "node": {
                                "name": "Actor to update"
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

### Nested delete under a nested update

**GraphQL input**

```graphql
mutation {
    updateMovies(
        where: { id: "1" }
        update: {
            actors: { delete: { where: { node: { name: "Actor to delete" } } } }
        }
    ) {
        movies {
            id
        }
    }
}
```

**Expected Cypher output**

```cypher
MATCH (this:Movie)
WHERE this.id = $this_id
WITH this
OPTIONAL MATCH (this)<-[this_actors0_delete0_relationship:ACTED_IN]-(this_actors0_delete0:Actor)
WHERE this_actors0_delete0.name = $updateMovies.args.update.actors[0].delete[0].where.node.name
FOREACH(_ IN CASE this_actors0_delete0 WHEN NULL THEN [] ELSE [1] END |
    DETACH DELETE this_actors0_delete0
)
RETURN this { .id } AS this
```

**Expected Cypher params**

```cypher-params
{
    "this_id": "1",
    "updateMovies": {
      "args": {
        "update": {
          "actors": [
            {
              "delete": [
                {
                  "where": {
                    "node": {
                      "name": "Actor to delete"
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
```

---

### Double nested delete under a nested update

**GraphQL input**

```graphql
mutation {
    updateMovies(
        where: { id: "1" }
        update: {
            actors: {
                delete: {
                    where: { node: { name: "Actor to delete" } }
                    delete: { movies: { where: { node: { id: "2" } } } }
                }
            }
        }
    ) {
        movies {
            id
        }
    }
}
```

**Expected Cypher output**

```cypher
MATCH (this:Movie)
WHERE this.id = $this_id
WITH this OPTIONAL MATCH (this)<-[this_actors0_delete0_relationship:ACTED_IN]-(this_actors0_delete0:Actor)
WHERE this_actors0_delete0.name = $updateMovies.args.update.actors[0].delete[0].where.node.name
WITH this, this_actors0_delete0
OPTIONAL MATCH (this_actors0_delete0)-[this_actors0_delete0_movies0_relationship:ACTED_IN]->(this_actors0_delete0_movies0:Movie)
WHERE this_actors0_delete0_movies0.id = $updateMovies.args.update.actors[0].delete[0].delete.movies[0].where.node.id
FOREACH(_ IN CASE this_actors0_delete0_movies0 WHEN NULL THEN [] ELSE [1] END | DETACH DELETE this_actors0_delete0_movies0 )
FOREACH(_ IN CASE this_actors0_delete0 WHEN NULL THEN [] ELSE [1] END | DETACH DELETE this_actors0_delete0 )
RETURN this { .id } AS this
```

**Expected Cypher params**

```cypher-params
{
    "this_id": "1",
    "updateMovies": {
        "args": {
            "update": {
                "actors": [
                    {
                        "delete": [
                            {
                                "delete": {
                                    "movies": [
                                        {
                                            "where": {
                                                "node": {
                                                    "id": "2"
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
                ]
            }
        }
    }
}
```

---
