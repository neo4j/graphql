## Problem
We want to remove `runFirstColumn` out of our Cypher queries. Currently, it is used to run the custom Cypher
using the [`@cypher` directive](https://neo4j.com/docs/graphql-manual/current/type-definitions/cypher/).

**Example**

```graphql
type Movie {
    id: ID
    title: String
    topActor: Actor
        @cypher(
            statement: """
            MATCH (a:Actor)
            RETURN a
            """
        )
```

```graphql
query {
    movies {
        title
        topActor {
            name
        }
    }
}
```


```cypher
MATCH (this:\`Movie\`)
CALL {
    WITH this
    UNWIND apoc.cypher.runFirstColumnSingle(\\"MATCH (a:Actor)
    RETURN a\\", { this: this, auth: $auth }) AS this_topActor
    RETURN this_topActor { .name } AS this_topActor
}
RETURN this { .title, topActor: this_topActor } as this
```


## Proposed Solution
The example above can be run with a `CALL { ... }` statement as follows:

```graphql
MATCH (this:\`Movie\`)
CALL {
  WITH this
  CALL {
    WITH this
    MATCH (a:Actor)  // CustomCypher
    RETURN a         // CustomCypher
  }
  WITH this, head(collect(a)) AS this_topActor // Note that `head` is only required for single elements, and it may be replaced by Limit
  RETURN this_topActor { .name } AS this_topActor
}
RETURN this { .title, topActor: this_topActor } as this
```

This solution, however, poses a difficulty, as `collect(a)` requires knowledge of the returned variable in the custom cypher `a`

### Using explain

### Alternatives
**User provided name**
**Parsing**
