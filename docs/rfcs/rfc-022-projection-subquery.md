# Projection Subqueries

## Problem
Currently, projection and nested filtering is done in the `RETURN` statement, through [Pattern Comprehension](https://neo4j.com/docs/cypher-manual/current/syntax/lists/#cypher-pattern-comprehension). 
For instance:

**Normal query**
```graphql
query Query {
  movies {
    title
  }
}
```

```cypher
MATCH (this:`Movie`)
RETURN this { .title } as this
```

**Nested query with filters**

```graphql
query Query {
  movies(where: {released: 1999}) {
    title
    actors(where: {name: "Keanu Reeves"}) {
      name
    }
  }
}
```

```cypher
MATCH (this:`Movie`)
WHERE this.released = $param0
RETURN this { .title, actors: [ (this)<-[:ACTED_IN]-(this_actors:Person)  WHERE this_actors.name = $this_actors_param0 | this_actors { .name } ] } as this
```

This means that top-level projection and filtering is inherently different to nested filtering, and the former happens as part of a `MATCH` or `CREATE` clause and the 
later is limited to a comprehension. This causes code duplicity, as the same behaviour needs to be implemented in both places, and limits 
adding features and performance improvements in nested fields. For instance aggregation require `runFirstColumn` to workaround this limitation and sort uses `apoc.coll.sortMulti`:

```graphql
query Query {
  movies {
    actorsAggregate {
      node {
        name {
          longest
        }
      }
    }
  }
}
```


```cypher
MATCH (this:`Movie`)
RETURN this { actorsAggregate: { node: { name: head(apoc.cypher.runFirstColumnMany("MATCH (this)<-[r:ACTED_IN]-(n:Person)    
        WITH n as n
        ORDER BY size(n.name) DESC
        WITH collect(n.name) as list
        RETURN {longest: head(list), shortest: last(list)}", { this: this })) } } } as this
```

## Proposed Solution
This RFC proposes to move the projection out of the return clause.

Using `CALL`, we can compose subqueries easily:
```cypher
MATCH (this:`Movie`)
WHERE this.released = 1999
CALL {
    WITH this
    MATCH (this)<-[:ACTED_IN]-(this_actors:Person)
    WHERE this_actors.name = "Keanu Reeves"
    RETURN collect(this_actors {.name}) as this_actors
}
RETURN this { .title, actors: this_actors }
```

By using CALL, it would be easier to compose in a nested fashion:

```cypher
MATCH (this:`Movie`)
WHERE this.released = 1999
CALL {
    WITH this
    MATCH (this)<-[:ACTED_IN]-(this_actors:Person)
    WHERE this_actors.name = "Keanu Reeves"
    CALL {
      WITH this_actors
      MATCH(this_actors)-[:DIRECTED]->(this_movies:Movie)
      WHERE this_movies.released > 1999
      RETURN collect(this_movies {.title}) as this_movies
    }
    RETURN collect(this_actors {.name, directed: this_movies}) as this_actors
}
RETURN this { .title, actors: this_actors}
```


### Examples

#### With Order
Currently, ordering is done with apoc.coll.sortMulti


```graphql
query Movies {
  movies {
    actors(options: {sort: {name: ASC}}) {
      name
    }
  }
}
```

```cypher
MATCH (this:`Movie`)
RETURN this { actors: apoc.coll.sortMulti([ (this)<-[:ACTED_IN]-(this_actors:Person)   | this_actors { .name } ], ['^name']) } as this
```

By using subqueries, we can stop using `sortMulti` and use `ORDER BY` instead:

```cypher
MATCH (this:`Movie`)
CALL {
    WITH this
    MATCH (thisthis1:`Person`)-[thisthis0:ACTED_IN]-(this)
    WITH thisthis1
    ORDER BY thisthis1.name ASC
    RETURN collect(thisthis1 { .name }) AS this_actors
}
RETURN this { actors: this_actors } as this
```

#### Connections
Connection queries already use a separate, nested `CALL` to perform this subqueries:

**graphql**
```graphql
query Movies {
  movies {
    released
    actorsConnection {
      edges {
        node {
          name
          moviesConnection {
            edges {
              node {
                title
              }
            }
          }
        }
      }
    }
  }
}
```

**current cypher**
```cypher
MATCH (this:`Movie`)
CALL {
  WITH this
  MATCH (this)<-[this_acted_in_relationship:ACTED_IN]-(this_person:Person)
  CALL {
    WITH this_person
    MATCH (this_person)-[this_person_acted_in_relationship:ACTED_IN]->(this_person_movie:Movie)
    WITH collect({ node: { title: this_person_movie.title } }) AS edges
    UNWIND edges as edge
    WITH collect(edge) AS edges, size(collect(edge)) AS totalCount
    RETURN { edges: edges, totalCount: totalCount } AS moviesConnection
  }
  WITH collect({ node: { name: this_person.name, moviesConnection: moviesConnection } }) AS edges
  UNWIND edges as edge
  WITH collect(edge) AS edges, size(collect(edge)) AS totalCount
  RETURN { edges: edges, totalCount: totalCount } AS actorsConnection
}
RETURN this { .released, actorsConnection } as this
```

Projections inside connections, however, may require nested CALL statements


## Risks
- Nested CALL statements may have a performance impact

### Security consideration
Auth checks need to be updated accordingly.

## Out of Scope

- Remove `runFirstColumn`

## Alternative solutions

Using `OPTIONAL MATCH` we can perform multiple matches and collect them. A list comprehension can be used to return them in the same way as before:
```cypher
MATCH (this:`Movie`)
WHERE this.released = 1999
OPTIONAL MATCH (this)<-[:ACTED_IN]-(this_actors:Person)
WHERE this_actors.name = "Keanu Reeves"
WITH this, collect(this_actors) as this_actors
RETURN this { .title, actors: [x IN this_actors | x { .name }]}
```

This alternative **may be** more performant that `CALL`.

## Related Work
* https://github.com/neo4j/graphql/pull/983


