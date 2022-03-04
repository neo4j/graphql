# Performance Testing

## Problem
To start work on performance improvements, we need a way of measuring these improvements, preferably automatically.

## Proposed Solution
The library has 3 possible areas where overall performance can be tested and improved. Each of these areas test a different part of the library, and will require a different strategy.

* **Cypher Query**: Improvements on the generated Cypher queries.
* **Server Execution**:  Improvements on resolvers and library code performance.
* **Augmented Schema**: The generation of the augmented schema is a one-off execution at server startup, but due to the long execution of this process for large schemas, it may be worth optimising this process to speed up server startup.
	* **Schema Size**: Another measurable metric is the total size of the augmented schema.

## Cypher query performance
As the most probable bottleneck of production systems, all generated queries need to be efficient enough. To measure resulting quest, a test suite of common and complex GraphQL queries is proposed. These can be translated to Cypher statements (in the same fashion as TCK tests), that can be passed down to Neo4j with a `EXPLAIN` or `PROFILE` statements to run these tools as describe [here](https://neo4j.com/docs/cypher-manual/4.4/query-tuning/#how-do-i-profile-a-query).

### Time vs DBHits
The **best** measure for query performance is time of execution. This approach, however, have some challenges:
* The test database must be always running on the same machine with a stable performance (i.e. not in Aura nor some cloud provided)
* Multiple runs and average needed per test (i.e. performance tests will be ~10 times slower)
* Network may affect this metric. Getting the execution time from Neo4j may be difficult

Before investing the time in building the required infrastructure, [proxy metrics](https://neo4j.com/docs/cypher-manual/current/execution-plans/) provided by Neo4j could be used to get a close enough approximation:

```typescript
    const session = driver.session();
    const result = await session.run("PROFILE MATCH(N) RETURN N");
    const { dbHits, rows, pageCacheHitRatio } = result.summary.profile || {};
    console.log("dbHits", dbHits);
    console.log("rows", rows);
    console.log("pageCacheHitRatio", pageCacheHitRatio); // Requires enterprise
```

`dbHits` and `rows` are only dependant on Neo4j version and the database. Both can easily be controlled in our tests, leading to consistent results in which we only test changes to our queries. Testing these is also faster and easier than time. The main pitfall is that in some cases may not be an accurate representation of real execution time (particularly when using [Apoc](https://neo4j.com/labs/apoc/)).

## Server execution
Any server will be running the resolvers provided by `@neo4j/graphql`. This code needs to execute in an efficient way. Due to the difference in magnitude, this is probably less important when compared to database execution.

### Resolvers execution
By running simple JavaScript performance tests over our resolvers with complex schemas we should be able to find bottlenecks in our code that may improve overall performance of a running server.

> Note: Despite these improvements directly affecting user servers, it's impact is probably very low compared to Cypher improvements. Because of this, these tests should probably be of lower priority.
### E2E performance
A full E2E test, in which time spanned for a real-life case covering all our stack (JavaScript, GraphQL and Neo4j) should be considered as a long-term goal. This kind of test would be one of the best indicators of overall performance, but requires a strict control of all the stack and will be the harder to implement.

## Augmented schema
There are some performance measurements related to the augmented schema generation process that we should consider. 

### Startup time
The generation of the augmented schema is a one-off execution at server startup, but due to the long execution of this process for large schemas, it may be worth optimising this process to speed up server startup, even if it won't produce a real difference in a running server performance.

This kind of performance is a pure time span performance of JavaScript execution, the same principles as Server performance apply.

### Schema size
Another measurable metric is the total size of the augmented schema. This schema lives in memory through the server's life, optimising the size may improve performance, particularly on low-memory servers.

The resulting size of the augmented schema can be easily measured by generating a big schema (e.g. [FHIR Schema](https://gist.github.com/aspectgfg/087612013e61eac4f7dffff1dc372a5e)) an simply counting the size of the resulting file (after minification).

> Note: Because the schema lives in memory under the GraphQL library internal representation, the metric of the raw schema may not be an accurate measure of the in-memory gains.
## Challenges
In addition to the challenges present in every testing strategy, we may find the following challenges when building any performance testing suite:
* **Continuous Integration**: We should be able to measure and validate performance improvements, as well as detect noticeable drops in performance when developing new features.
* **Benchmarks**: We need to find reasonable benchmarks and goals to hit in terms of performance (i.e. What is the performance we want to achieve for x feature?).
* **Standard measures**: Any time-based measure is bound to hardware dependencies, for CI and long-term purposes, these measures should happen in a strictly controlled machine and standard benchmarking practices (e.g. average multiple runs) should be taken into consideration.

## Risks and unknowns
* Currently, `@neo4j/graphql` works on the principle of a single Cypher query per request, we need to validate if this is still the best way to achieve good performance.

## Out of scope
* How to store these metrics and monitor them over time.
