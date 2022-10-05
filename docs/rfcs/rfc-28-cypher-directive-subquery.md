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
The provided custom Cypher can be run against the database prepending the `EXPLAIN` to the query, this will not execute the query, but will validate it and return metadata.

The metadata for an example Cypher (`RETURN 5+5 as a, 5+6 as b`) is the following: 
```json
{
  "records": [],
  "summary": {
    "query": {
      "text": "EXPLAIN RETURN 5+5 as a, 5+6 as b",
      "parameters": {}
    },
    "queryType": "r",
    "counters": {
      "_stats": {
        "nodesCreated": 0,
        "nodesDeleted": 0,
        "relationshipsCreated": 0,
        "relationshipsDeleted": 0,
        "propertiesSet": 0,
        "labelsAdded": 0,
        "labelsRemoved": 0,
        "indexesAdded": 0,
        "indexesRemoved": 0,
        "constraintsAdded": 0,
        "constraintsRemoved": 0
      },
      "_systemUpdates": 0
    },
    "updateStatistics": {
      "_stats": {
        "nodesCreated": 0,
        "nodesDeleted": 0,
        "relationshipsCreated": 0,
        "relationshipsDeleted": 0,
        "propertiesSet": 0,
        "labelsAdded": 0,
        "labelsRemoved": 0,
        "indexesAdded": 0,
        "indexesRemoved": 0,
        "constraintsAdded": 0,
        "constraintsRemoved": 0
      },
      "_systemUpdates": 0
    },
    "plan": {
      "operatorType": "ProduceResults@neo4j",
      "identifiers": [
        "a",
        "b"
      ],
      "arguments": {
        "planner-impl": "IDP",
        "Details": "a, b",
        "PipelineInfo": "Fused in Pipeline 0",
        "planner-version": "4.4",
        "runtime-version": "4.4",
        "runtime": "PIPELINED",
        "runtime-impl": "PIPELINED",
        "version": "CYPHER 4.4",
        "EstimatedRows": 1,
        "planner": "COST"
      },
      "children": [
        {
          "operatorType": "Projection@neo4j",
          "identifiers": [
            "a",
            "b"
          ],
          "arguments": {
            "Details": "$autoint_0 AS a, $autoint_1 AS b",
            "EstimatedRows": 1,
            "PipelineInfo": "Fused in Pipeline 0"
          },
          "children": []
        }
      ]
    },
    "profile": false,
    "notifications": [],
    "server": {
      "address": "localhost:7687",
      "agent": "Neo4j/4.4.11",
      "protocolVersion": 4.4
    },
    "resultConsumedAfter": {
      "low": 0,
      "high": 0
    },
    "resultAvailableAfter": {
      "low": 1,
      "high": 0
    },
    "database": {
      "name": "neo4j"
    }
  }
}
```

The values we are interested in can be found in the following paths:
* `summary.plan.identifiers`: An array containing the identifiers we want to use.
* `summary.plan.children[0].identifiers`: An array containing the identifiers of the first children of the request (Projection), same data as above
* `summary.plan.children[0].operatorType`: Contains the operator of the top children, it is usually `Projection@neo4j` (although not always). We can use this to identify the edge cases of not returning any values, as it will be set to `EmptyResult@neo4j` 


### Server Lifecycle
These "Explain" checks need to happen once after the database is ready, when the version checks are done. All of the custom cypher queries will be run with explain, and the result variable names will be added to the metadata of that node directive.


In large typdefs it may yield a high load at the beggining. For these cases an **opt-in** setup would be to lazily generate these metadata:
1. When a request happens to a custom cypher, it will call a memoized method to generate these metadata
    1. If the metadata does not exists, an `EXPLAIN` request is done
    2. If the metadata does not exists, but an `EXPLAIN` request has already been done (i.e. `pending`) the memoized method will attach to that promise to resolve
    3. If the metadata exists, the promise will inmediatly answer with the metadata
2. Having those definitions, the main request is done.

This way, only 1 extra request per custom cypher is done, and only when needed. The disadvantage (and why this is opt-in) is that we loose early cypher validation 


### Query Plan examples

#### Simple Return without alias

**Cypher**
```cypher
RETURN 5+5
```

**Plan**
```json
{
"plan": {
  "operatorType": "ProduceResults@neo4j",
  "identifiers": [
    "`5+5`"
  ],
}
```

#### Aliased return with multiple values and subquery

**Cypher**
```cypher
CALL { 
    RETURN 5+5 as a 
} 
WITH a 
RETURN a, 1+1 as b
```
**Plan**
```json
 {
 "operatorType": "ProduceResults@neo4j",
  "identifiers": [
    "a",
    "b"
  ],
}
````

#### Empty result

**Cypher**
```cypher
CREATE(:Movie)
```

**Plan**
```json
{
  "operatorType": "ProduceResults@neo4j",
  "identifiers": [
    "anon_0"
  ],
  ...
    "children": [
    {
      "operatorType": "EmptyResult@neo4j",
      "identifiers": [
        "anon_0"
      ],
      "arguments": {
        "EstimatedRows": 1,
        "PipelineInfo": "Fused in Pipeline 0"
      },
      "children": [
        ...
}
```
In this case, identifiers contain an autogeenrated value `anon_0` that cannot be used, however, the `children` array contains the operator `EmptyResult@neo4j` which can be used to identify these cases


### Risks and considerations

* Number of initial `EXPLAIN` requests, particularly in large typedefs
* Database/Server lifecycle
* Cypher injection

### Alternatives
**User provided name**    
If we ask the user to provide the name separately, it would be possible to inject the `Cypher` and collect the results without using the initial `EXPLAIN` operation, however, this will negatively impact developer experience. This could be considered for a future opt-in optimization to avoid the initial EXPLAIN requests cause performance problems.

**Parsing**    
Instead of going to the Database, the last `RETURN` statement could be parsed to get the name. This solution is discarded, as `RETURN` parsing is non-trivial, and would require complex full cypher parsing tools.

Examples of statements to parse:
* `RETURN 5+5`
* `RETURN apoc.cypher.runFirstColumnSingle("RETURN 5+5 as a", {})`


