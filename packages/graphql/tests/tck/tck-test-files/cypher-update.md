## Cypher Update

Tests Update operations.

Schema:

```schema
type Actor {
    name: String
    movies: [Movie] @relationship(type: "ACTED_IN", direction: "OUT")
}
    
type Movie {
    id: ID
    title: String
    actors: [Actor]! @relationship(type: "ACTED_IN", direction: "IN")
}
```

---

### Simple Update

**GraphQL input**

```graphql
mutation {
  updateMovies(where: { id: "1" }, update: { id: "2" }) {
    id
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
    where: { id: "1" },
    update: { 
      actors: {
        where: { name: "old name" },
        update: { name: "new name" }
      }
    }
) {
    id
  }
}
```

**Expected Cypher output**

```cypher
MATCH (this:Movie)
WHERE this.id = $this_id 
WITH this 
OPTIONAL MATCH (this)<-[:ACTED_IN]-(this_actors:Actor) 
WHERE this_actors.name = $this_actors_name 
CALL apoc.do.when(this_actors IS NOT NULL, 
  " 
    SET this_actors.name = $this_update_actors_name 
    RETURN count(*)
  ",
  "", 
  {this:this, this_actors:this_actors, this_update_actors_name:$this_update_actors_name}) YIELD value as _ 
RETURN this { .id } AS this
```

**Expected Cypher params**

```cypher-params
{
    "this_id": "1",
    "this_actors_name": "old name",
    "this_update_actors_name": "new name"
}
```

---

### Double Nested Update 

**GraphQL input**

```graphql
mutation {
  updateMovies(
    where: { id: "1" },
    update: { 
      actors: {
        where: { name: "old actor name" },
        update: { 
          name: "new actor name",
          movies: {
            where: { id: "old movie title" },
            update: { title: "new movie title" }
          }
        }
      }
    }
) {
    id
  }
}
```

**Expected Cypher output**

```cypher
MATCH (this:Movie) 
WHERE this.id = $this_id 
WITH this 
OPTIONAL MATCH (this)<-[:ACTED_IN]-(this_actors:Actor) 
WHERE this_actors.name = $this_actors_name 
CALL apoc.do.when(this_actors IS NOT NULL, " 
    SET this_actors.name = $this_update_actors_name 
    WITH this, this_actors 
    OPTIONAL MATCH (this_actors)-[:ACTED_IN]->(this_actors_movies:Movie) 
    WHERE this_actors_movies.id = $this_actors_movies_id 
    CALL apoc.do.when(this_actors_movies IS NOT NULL, \" 
        SET this_actors_movies.title = $this_update_actors_movies_title 
        RETURN count(*) 
    \", 
      \"\", 
      {this_actors:this_actors, this_actors_movies:this_actors_movies, this_update_actors_movies_title:$this_update_actors_movies_title}) YIELD value as _ 
    RETURN count(*)
  ", 
  "", 
  {this:this, this_actors:this_actors, this_update_actors_name:$this_update_actors_name,this_actors_movies_id:$this_actors_movies_id,this_update_actors_movies_title:$this_update_actors_movies_title}) YIELD value as _ 
RETURN this { .id } AS this
```

**Expected Cypher params**

```cypher-params
{
    "this_id": "1",
    "this_actors_name": "old name",
    "this_actors_movies_id": "old movie title",
    "this_actors_name": "old actor name",
    "this_update_actors_movies_title": "new movie title",
    "this_update_actors_name": "new actor name"
}
```

---

### Simple Update as Connect

**GraphQL input**

```graphql
mutation {
  updateMovies(where: { id: "1" }, connect: {actors: [{where: {name: "Daniel"}}]}) {
    id
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
