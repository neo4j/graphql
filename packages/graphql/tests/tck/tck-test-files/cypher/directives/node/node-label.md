# Node Directive

Custom label using @node.

Schema:

```graphql

type Actor @node(label:"Person") {
    name: String
    movies: [Movie] @relationship(type: "ACTED_IN", direction: OUT)
}

type Movie @node(label:"Film") {
    id: ID
    title: String
    actors: [Actor]! @relationship(type: "ACTED_IN", direction: IN)
}
```

---

## Select Movie with label Film

### GraphQL Input

```graphql
{
    movies {
        title
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Film)
RETURN this { .title } as this
```

### Expected Cypher Params

```json
{ }
```

---

## Select movie and actor with custom labels

### GraphQL Input

```graphql
{
    movies {
        title
        actors {
            name
        }
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Film)
RETURN this { .title, actors: [ (this)<-[:ACTED_IN]-(this_actors:Person) | this_actors { .name } ] } as this
```

### Expected Cypher Params

```json
{}
```

---

## Select movie and actor with custom labels using Relay connection

### GraphQL Input

```graphql
{
    movies {
        title
        actorsConnection {
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
MATCH (this:Film) CALL { WITH this MATCH (this)<-[this_acted_in_relationship:ACTED_IN]-(this_actor:Person) WITH collect({ node: { name: this_actor.name } }) AS edges RETURN { edges: edges, totalCount: size(edges) } AS actorsConnection } RETURN this { .title, actorsConnection } as this
```

### Expected Cypher Params

```json
{}
```

---

## Create Movie with label Film

### GraphQL Input

```graphql
mutation {
    createMovies(input: [{ id: "1" }]) {
        movies {
            id
        }
    }
}
```

### Expected Cypher Output

```cypher
CALL {
  CREATE (this0:Film)
  SET this0.id = $this0_id
  RETURN this0
}

RETURN this0 { .id } AS this0
```

### Expected Cypher Params

```json
{
    "this0_id": "1"
}
```

---

## Create Movie and relation with custom labels

### GraphQL Input

```graphql
mutation {
    createMovies(
        input: [
            { id: 1, actors: { create: [{ node: { name: "actor 1" } }] } }
            { id: 2, actors: { create: [{ node: { name: "actor 2" } }] } }
        ]
    ) {
        movies {
            id
        }
    }
}
```

### Expected Cypher Output

```cypher
CALL {
  CREATE (this0:Film)
  SET this0.id = $this0_id

    WITH this0
    CREATE (this0_actors0_node:Person)
    SET this0_actors0_node.name = $this0_actors0_node_name
    MERGE (this0)<-[:ACTED_IN]-(this0_actors0_node)

  RETURN this0
}

CALL {
  CREATE (this1:Film)
  SET this1.id = $this1_id

    WITH this1
    CREATE (this1_actors0_node:Person)
    SET this1_actors0_node.name = $this1_actors0_node_name
    MERGE (this1)<-[:ACTED_IN]-(this1_actors0_node)

  RETURN this1
}

RETURN this0 { .id } AS this0, this1 { .id } AS this1
```

### Expected Cypher Params

```json
{
    "this0_id": "1",
    "this0_actors0_node_name": "actor 1",
    "this1_id": "2",
    "this1_actors0_node_name": "actor 2"
}
```

---

## Update Movie with label film

### GraphQL Input

```graphql
mutation {
    updateMovies(where: { id: "1" }, update: { id: "2" }) {
        movies {
            id
        }
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Film)
WHERE this.id = $this_id
SET this.id = $this_update_id

RETURN this { .id } AS this
```

### Expected Cypher Params

```json
{
    "this_id": "1",
    "this_update_id": "2"
}
```

---

## Update nested actors with custom label

### GraphQL Input

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

### Expected Cypher Output

```cypher
MATCH (this:Film)
WHERE this.id = $this_id
WITH this
OPTIONAL MATCH (this)<-[this_acted_in0_relationship:ACTED_IN]-(this_actors0:Person)
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

### Expected Cypher Params

```json
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

## Update connection in Movie with label film

### GraphQL Input

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

### Expected Cypher Output

```cypher
MATCH (this:Film)
WHERE this.id = $this_id
WITH this
CALL {
    WITH this
    OPTIONAL MATCH (this_connect_actors0_node:Person)
    WHERE this_connect_actors0_node.name = $this_connect_actors0_node_name
    FOREACH(_ IN CASE this_connect_actors0_node WHEN NULL THEN [] ELSE [1] END |
    MERGE (this)<-[:ACTED_IN]-(this_connect_actors0_node)
    )
    RETURN count(*)
}
RETURN this { .id } AS this
```

### Expected Cypher Params

```json
{
    "this_id": "1",
    "this_connect_actors0_node_name": "Daniel"
}
```

---

## Update disconnect in Movie with label film

### GraphQL Input

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

### Expected Cypher Output

```cypher
MATCH (this:Film)
WHERE this.id = $this_id
WITH this
CALL {
    WITH this
    OPTIONAL MATCH (this)<-[this_disconnect_actors0_rel:ACTED_IN]-(this_disconnect_actors0:Person)
    WHERE this_disconnect_actors0.name = $updateMovies.args.disconnect.actors[0].where.node.name
    FOREACH(_ IN CASE this_disconnect_actors0 WHEN NULL THEN [] ELSE [1] END |
    DELETE this_disconnect_actors0_rel )
    RETURN count(*)
    }
RETURN this { .id } AS this
```

### Expected Cypher Params

```json
{
    "this_id": "1",
    "updateMovies": {
     "args": {
       "disconnect": {
         "actors": [{
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


## Delete Movie with custom label

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
MATCH (this:Film)
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

## Delete Movies and actors with custom labels

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
MATCH (this:Film)
WHERE this.id = $this_id
WITH this
OPTIONAL MATCH (this)<-[this_actors0_relationship:ACTED_IN]-(this_actors0:Person)
WHERE this_actors0.name = $this_deleteMovies.args.delete.actors[0].where.node.name
FOREACH(_ IN CASE this_actors0 WHEN NULL THEN [] ELSE [1] END |
    DETACH DELETE this_actors0
)
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

## Admin Deletes Post

### GraphQL Input

```graphql
mutation {
    deleteMovies(where: {
        actors: {
            name:"tom"
        }
    }) {
        nodesDeleted
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Film) WHERE EXISTS((this)<-[:ACTED_IN]-(:Person)) AND ANY(this_actors IN [(this)<-[:ACTED_IN]-(this_actors:Person) | this_actors] WHERE this_actors.name = $this_actors_name) DETACH DELETE this
```

### Expected Cypher Params

```json
{
    "this_actors_name": "tom"
}
```

---


## Count movies with custom label

### GraphQL Input

```graphql
{
    moviesCount
}
```

### Expected Cypher Output

```cypher
MATCH (this:Film)
RETURN count(this)
```

### Expected Cypher Params

```json
{}
```

---
