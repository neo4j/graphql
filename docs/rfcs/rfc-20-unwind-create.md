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
  createMovies(
    input: [{ title: "The Matrix" }, { title: "The Matrix Resurrection" }]
  ) {
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
Alternatively, `UNWIND` can be used to improve performance for batch create. This performance improvement has already been verified:

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

Currently, the previous query will yield the following Cypher:

**Cypher**
```cypher
CALL {
CREATE (this0:Movie)
SET this0.title = $this0_title
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
WITH this0, this1

RETURN [
this0 { .title, actors: [ (this0)<-[:ACTED_IN]-(this0_actors:Person)   | this0_actors { .name } ] }, 
this1 { .title, actors: [ (this1)<-[:ACTED_IN]-(this1_actors:Person)   | this1_actors { .name } ] }] AS data
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
RETURN m, res
```
