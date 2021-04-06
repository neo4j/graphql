## Cypher Update

Tests Update operations.

Schema:

```schema
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
                { where: { name: "old name" }, update: { name: "new name" } }
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
OPTIONAL MATCH (this)<-[:ACTED_IN]-(this_actors0:Actor)
WHERE this_actors0.name = $this_actors0_name
CALL apoc.do.when(this_actors0 IS NOT NULL,
  "
    SET this_actors0.name = $this_update_actors0_name
    RETURN count(*)
  ",
  "",
  {this:this, this_actors0:this_actors0, auth:$auth,this_update_actors0_name:$this_update_actors0_name}) YIELD value as _

RETURN this { .id } AS this
```

**Expected Cypher params**

```cypher-params
{
    "this_id": "1",
    "this_actors0_name": "old name",
    "this_update_actors0_name": "new name",
    "auth": {
       "isAuthenticated": true,
       "roles": [],
       "jwt": {}
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
                    where: { name: "old actor name" }
                    update: {
                        name: "new actor name"
                        movies: [
                            {
                                where: { id: "old movie title" }
                                update: { title: "new movie title" }
                            }
                        ]
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
OPTIONAL MATCH (this)<-[:ACTED_IN]-(this_actors0:Actor)
WHERE this_actors0.name = $this_actors0_name
CALL apoc.do.when(this_actors0 IS NOT NULL, "
    SET this_actors0.name = $this_update_actors0_name

    WITH this, this_actors0
    OPTIONAL MATCH (this_actors0)-[:ACTED_IN]->(this_actors0_movies0:Movie)
    WHERE this_actors0_movies0.id = $this_actors0_movies0_id
    CALL apoc.do.when(this_actors0_movies0 IS NOT NULL, \"
        SET this_actors0_movies0.title = $this_update_actors0_movies0_title
        RETURN count(*)
    \",
      \"\",
      {this_actors0:this_actors0, this_actors0_movies0:this_actors0_movies0, auth:$auth,this_update_actors0_movies0_title:$this_update_actors0_movies0_title}) YIELD value as _

    RETURN count(*)
  ",
  "",
  {this:this, this_actors0:this_actors0, auth:$auth,this_update_actors0_name:$this_update_actors0_name,this_actors0_movies0_id:$this_actors0_movies0_id,this_update_actors0_movies0_title:$this_update_actors0_movies0_title}) YIELD value as _

RETURN this { .id } AS this
```

**Expected Cypher params**

```cypher-params
{
    "this_id": "1",
    "this_actors0_name": "old name",
    "this_actors0_movies0_id": "old movie title",
    "this_actors0_name": "old actor name",
    "this_update_actors0_movies0_title": "new movie title",
    "this_update_actors0_name": "new actor name",
    "auth": {
       "isAuthenticated": true,
       "roles": [],
       "jwt": {}
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
        connect: { actors: [{ where: { name: "Daniel" } }] }
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
OPTIONAL MATCH (this_connect_actors0:Actor)
WHERE this_connect_actors0.name = $this_connect_actors0_name
FOREACH(_ IN CASE this_connect_actors0 WHEN NULL THEN [] ELSE [1] END |
MERGE (this)<-[:ACTED_IN]-(this_connect_actors0)
)
RETURN this { .id } AS this
```

**Expected Cypher params**

```cypher-params
{
    "this_id": "1",
    "this_connect_actors0_name": "Daniel"
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
                { where: { name: "Daniel" } }
                { where: { name: "Darrell" } }
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
OPTIONAL MATCH (this_connect_actors0:Actor)
WHERE this_connect_actors0.name = $this_connect_actors0_name
FOREACH(_ IN CASE this_connect_actors0 WHEN NULL THEN [] ELSE [1] END |
MERGE (this)<-[:ACTED_IN]-(this_connect_actors0)
)
WITH this
OPTIONAL MATCH (this_connect_actors1:Actor)
WHERE this_connect_actors1.name = $this_connect_actors1_name
FOREACH(_ IN CASE this_connect_actors1 WHEN NULL THEN [] ELSE [1] END |
MERGE (this)<-[:ACTED_IN]-(this_connect_actors1)
)
RETURN this { .id } AS this
```

**Expected Cypher params**

```cypher-params
{
    "this_id": "1",
    "this_connect_actors0_name": "Daniel",
    "this_connect_actors1_name": "Darrell"
}
```

---

### Simple Update as Disconnect

**GraphQL input**

```graphql
mutation {
    updateMovies(
        where: { id: "1" }
        disconnect: { actors: [{ where: { name: "Daniel" } }] }
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
WHERE this_disconnect_actors0.name = $this_disconnect_actors0_name
FOREACH(_ IN CASE this_disconnect_actors0 WHEN NULL THEN [] ELSE [1] END |
DELETE this_disconnect_actors0_rel
)
RETURN this { .id } AS this
```

**Expected Cypher params**

```cypher-params
{
    "this_id": "1",
    "this_disconnect_actors0_name": "Daniel"
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
                { where: { name: "Daniel" } }
                { where: { name: "Darrell" } }
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
WHERE this_disconnect_actors0.name = $this_disconnect_actors0_name
FOREACH(_ IN CASE this_disconnect_actors0 WHEN NULL THEN [] ELSE [1] END |
DELETE this_disconnect_actors0_rel
)
WITH this
OPTIONAL MATCH (this)<-[this_disconnect_actors1_rel:ACTED_IN]-(this_disconnect_actors1:Actor)
WHERE this_disconnect_actors1.name = $this_disconnect_actors1_name
FOREACH(_ IN CASE this_disconnect_actors1 WHEN NULL THEN [] ELSE [1] END |
DELETE this_disconnect_actors1_rel
)
RETURN this { .id } AS this
```

**Expected Cypher params**

```cypher-params
{
    "this_id": "1",
    "this_disconnect_actors0_name": "Daniel",
    "this_disconnect_actors1_name": "Darrell"
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
                create: [{ id: "dan_movie_id", title: "The Story of Beer" }]
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
CREATE (this_movies0_create0:Movie)
SET this_movies0_create0.id = $this_movies0_create0_id
SET this_movies0_create0.title = $this_movies0_create0_title
MERGE (this)-[:ACTED_IN]->(this_movies0_create0)

RETURN this { .name, movies: [ (this)-[:ACTED_IN]->(this_movies:Movie)  | this_movies { .id, .title } ] } AS this
```

**Expected Cypher params**

```cypher-params
{
  "this_name": "Dan",
  "this_movies0_create0_id": "dan_movie_id",
  "this_movies0_create0_title": "The Story of Beer"
}
```

---

### Update an Actor while creating and connecting to a new Movie (via top level)

**GraphQL input**

```graphql
mutation {
    updateActors(
        where: { name: "Dan" }
        create: { movies: [{ id: "dan_movie_id", title: "The Story of Beer" }] }
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

CREATE (this_create_movies0:Movie)
SET this_create_movies0.id = $this_create_movies0_id
SET this_create_movies0.title = $this_create_movies0_title
MERGE (this)-[:ACTED_IN]->(this_create_movies0)

RETURN this { .name, movies: [ (this)-[:ACTED_IN]->(this_movies:Movie) | this_movies { .id, .title } ] } AS this
```

**Expected Cypher params**

```cypher-params
{
  "this_name": "Dan",
  "this_create_movies0_id": "dan_movie_id",
  "this_create_movies0_title": "The Story of Beer"
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
                { id: "dan_movie_id", title: "The Story of Beer" }
                { id: "dan_movie2_id", title: "Forrest Gump" }
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

CREATE (this_create_movies0:Movie)
SET this_create_movies0.id = $this_create_movies0_id
SET this_create_movies0.title = $this_create_movies0_title
MERGE (this)-[:ACTED_IN]->(this_create_movies0)

CREATE (this_create_movies1:Movie)
SET this_create_movies1.id = $this_create_movies1_id
SET this_create_movies1.title = $this_create_movies1_title
MERGE (this)-[:ACTED_IN]->(this_create_movies1)

RETURN this { .name, movies: [ (this)-[:ACTED_IN]->(this_movies:Movie) | this_movies { .id, .title } ] } AS this
```

**Expected Cypher params**

```cypher-params
{
  "this_name": "Dan",
  "this_create_movies0_id": "dan_movie_id",
  "this_create_movies0_title": "The Story of Beer",
  "this_create_movies1_id": "dan_movie2_id",
  "this_create_movies1_title": "Forrest Gump"
}
```

---

### Delete related node as update

**GraphQL input**

```graphql
mutation {
    updateMovies(
        where: { id: "1" }
        delete: { actors: { where: { name: "Actor to delete" } } }
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
OPTIONAL MATCH (this)<-[:ACTED_IN]-(this_delete_actors0:Actor)
WHERE this_delete_actors0.name = $this_delete_actors0_name
FOREACH(_ IN CASE this_delete_actors0 WHEN NULL THEN [] ELSE [1] END |
    DETACH DELETE this_delete_actors0
)
RETURN this { .id } AS this
```

**Expected Cypher params**

```cypher-params
{
    "this_id": "1",
    "this_delete_actors0_name": "Actor to delete"
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
                where: { name: "Actor to update" }
                update: { name: "Updated name" }
            }
        }
        delete: { actors: { where: { name: "Actor to delete" } } }
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
OPTIONAL MATCH (this)<-[:ACTED_IN]-(this_actors0:Actor)
WHERE this_actors0.name = $this_actors0_name
CALL apoc.do.when(this_actors0 IS NOT NULL, "
    SET this_actors0.name = $this_update_actors0_name
    RETURN count(*)
",
"",
{this:this, this_actors0:this_actors0, auth:$auth,this_update_actors0_name:$this_update_actors0_name}) YIELD value as _
WITH this
OPTIONAL MATCH (this)<-[:ACTED_IN]-(this_delete_actors0:Actor)
WHERE this_delete_actors0.name = $this_delete_actors0_name
FOREACH(_ IN CASE this_delete_actors0 WHEN NULL THEN [] ELSE [1] END |
    DETACH DELETE this_delete_actors0
)
RETURN this { .id } AS this
```

**Expected Cypher params**

```cypher-params
{
    "this_id": "1",
    "this_actors0_name": "Actor to update",
    "this_update_actors0_name": "Updated name",
    "this_delete_actors0_name": "Actor to delete",
    "auth": {
        "isAuthenticated": true,
        "jwt": {},
        "roles": []
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
        update: { actors: { delete: { where: { name: "Actor to delete" } } } }
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
OPTIONAL MATCH (this)<-[:ACTED_IN]-(this_actors0_delete0:Actor)
WHERE this_actors0_delete0.name = $this_actors0_delete0_name
FOREACH(_ IN CASE this_actors0_delete0 WHEN NULL THEN [] ELSE [1] END |
    DETACH DELETE this_actors0_delete0
)
RETURN this { .id } AS this
```

**Expected Cypher params**

```cypher-params
{
    "this_id": "1",
    "this_actors0_delete0_name": "Actor to delete"
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
                    where: { name: "Actor to delete" }
                    delete: { movies: { where: { id: "2" } } }
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
OPTIONAL MATCH (this)<-[:ACTED_IN]-(this_actors0_delete0:Actor)
WHERE this_actors0_delete0.name = $this_actors0_delete0_name
WITH this, this_actors0_delete0
OPTIONAL MATCH (this_actors0_delete0)-[:ACTED_IN]->(this_actors0_delete0_movies0:Movie)
WHERE this_actors0_delete0_movies0.id = $this_actors0_delete0_movies0_id
FOREACH(_ IN CASE this_actors0_delete0_movies0 WHEN NULL THEN [] ELSE [1] END |
    DETACH DELETE this_actors0_delete0_movies0
)
FOREACH(_ IN CASE this_actors0_delete0 WHEN NULL THEN [] ELSE [1] END |
    DETACH DELETE this_actors0_delete0
)
RETURN this { .id } AS this
```

**Expected Cypher params**

```cypher-params
{
    "this_id": "1",
    "this_actors0_delete0_name": "Actor to delete",
    "this_actors0_delete0_movies0_id": "2"
}
```

---
