# Node Directive

Additional labels using @node.

Schema:

```graphql

type Actor @node(additionalLabels:["Person"]) {
    name: String
    movies: [Movie] @relationship(type: "ACTED_IN", direction: OUT)
}

type Movie @node(label:"Film", additionalLabels:["Multimedia"]) {
    id: ID
    title: String
    actors: [Actor]! @relationship(type: "ACTED_IN", direction: IN)
}
```

---

## Select Movie with additional labels

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
MATCH (this:Film:Multimedia)
RETURN this { .title } as this
```

### Expected Cypher Params

```json
{ }
```

---

## Select movie and actor with additional labels

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
MATCH (this:Film:Multimedia)
RETURN this { .title, actors: [ (this)<-[:ACTED_IN]-(this_actors:Actor:Person) | this_actors { .name } ] } as this
```

### Expected Cypher Params

```json
{}
```

---

## Create Movie and relation with additional labels

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
  CREATE (this0:Film:Multimedia)
  SET this0.id = $this0_id

    WITH this0
    CREATE (this0_actors0_node:Actor:Person)
    SET this0_actors0_node.name = $this0_actors0_node_name
    MERGE (this0)<-[:ACTED_IN]-(this0_actors0_node)

  RETURN this0
}

CALL {
  CREATE (this1:Film:Multimedia)
  SET this1.id = $this1_id

    WITH this1
    CREATE (this1_actors0_node:Actor:Person)
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

## Delete Movie with additional additionalLabels

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
MATCH (this:Film:Multimedia)
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

## Update Movie with additional labels

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
MATCH (this:Film:Multimedia)
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

## Count movies with additional labels

### GraphQL Input

```graphql
{
    moviesCount
}
```

### Expected Cypher Output

```cypher
MATCH (this:Film:Multimedia)
RETURN count(this)
```

### Expected Cypher Params

```json
{}
```

---
