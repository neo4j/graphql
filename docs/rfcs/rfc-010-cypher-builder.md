# Cypher Builder

This is a proposal on an internal Cypher query builder tool to improve consistency and reduce complexity in the internal code of the neo4j/graphql library.

## Problem
Currently, our Cypher generation relies on string concatenation on-demand, this is prone to errors and cause several issues:
* Inconsistency on generated Cypher
* Typos may cause hard to find bugs
* Verbosity
* Duplicate and non-reusable code
* Hard to test code

## Cypher Builder proposal
This is a proposal on a Cypher builder, the goal of this builder is to be able to generate valid Cypher statements in a flexible and consistent manner with TypeScript as well as handle Cypher parameters. The interface should be clean and usable, as both internal developers and contributors should be able to use it. Having a feature complete Cypher builder, is out of scope.

**Must-have** goals:
* Provide an unified way of creating valid Cypher.
* Have an easy interface, abstracting some of the nitty-gritty details of Cypher composition where possible.
* Ease unit-testing.
* Reduce code complexity, duplicity, and size by abstracting the Cypher composition layer.
* Handle parameters in a consistent way.
* Ensure Cypher Injection is not possible

**Nice-to-have** that may be achieved with this proposal:
* Improve TypeScript types over using plain string.
* Decoupled from GraphQL and business logic.
* Static Cypher validation (i.e. before hitting the database).
* Cypher Backtracking (i.e. allow to easily modify Cypher statements in a non-sequential fashion).

## Proposed interface
The proposed interface follows a similar [builder-like pattern](https://refactoring.guru/design-patterns/builder) to other query builders. All typings are part of the builder (i.e. none of the library typings are used) to avoid coupling.

The classes will compose the query in a simplified [AST](https://en.wikipedia.org/wiki/Abstract_syntax_tree) representing our query. Parameters, references and string generation are generated lazily after the full tree has been composed.

## Examples

### Build a simple Match query
```Cypher
MATCH(a:Actor)-[:ACTED_IN]->(m:Movie)							 
WHERE a.name = "Arthur"
RETURN m.title
```

Example with plain strings as input
```typescript
const actorNode = new CypherBuilder.Node({
    labels: ["Actor"],
});
const movieNode = new CypherBuilder.Node({
    labels: ["Movie"],
});
const relationship = new CypherBuilder.Relationship({ source: node1, target: node2, type: "ACTED_IN" });

// NOTE: Alternatively, Match should take a "MatchPattern" instead of a relationship 
const query = new CypherBuilder.Match(relationship).where(actorNode, {name: "Arthur"}).return(movieNode, ["title"]);

const { cypher, params } = query.build()
cypher // "MATCH(this1:Actor)...."
params // { param1: "Arthur" }
```

### Query composition
An important factor to consider is a complex query being composed using multiple statements:
```cypher
CALL {
	CREATE (this0:Movie)
	SET this0.id = $this0_id
	RETURN this0
	}
RETURN this0 { .id } AS this0
```

```typescript
const movieNode = new CypherBuilder.Node({labels: ["Movie"]});
const idParam = new CypherBuilder.Param();

const subQuery = new CypherBuilder.Create(movieNode, {id: idParam}).return(movieNode)

const query = new CypherBuilder.Call(subQuery).return(movieNode, {"id"}, "this0")

query.print() // CALL { ...
query.params // [this0_id]
```


### Backtracking / Lazy
Because the actual string would be built at the last moment (lazy), all reference can be updated after being defined (e.g. renaming nodes):
```typescript
const actorNode = new CypherBuilder.Node({labels: ["Actor"]})
const movieNode = new CypherBuilder.Node({labels: ["Movie"]})
const actedIn = new CypherBuilder.Relationship({type: "ACTED_IN", source: actorNode, target: movieNode})

const query = new CypherBuilder.Match(actedIn).where(actorNode, {name: "Arthur"}).return([[movieNode, "title"]])


actorNode.addLabel("MyOtherLabel")
actorNode.setAlias("pepe");

query.print() // MATCH(pepe:Actor:MyOtherLabel)-[:ACTED_IN]->(m:Movie) ....

```

## Risks & Unknowns
* An [AST](https://en.wikipedia.org/wiki/Abstract_syntax_tree) for GraphQL to Cypher has yet to be defined. Some aspects of this builder (e.g. parameters) may be depend on the solution agreed for an AST

## Related work

* [cypher-query-builder](https://github.com/jamesfer/cypher-query-builder)
* [fluent-cypher](https://github.com/ogroppo/fluent-cypher)
* [neo4j-ogm](https://github.com/neo4j/neo4j-ogm)
* [cypher-composer](https://github.com/danstarns/cypher-composer)


## Out of scope
* Feature-completeness is out of scope, the tools should be focused on generating the queries that are required for neo4j/graphql.
* This proposal does **not** include any user-facing features or tools.

## Alternatives considered
### Functions
The current prototype is build as a collection of functions, all returning a unified type that can be composed. Under this interface, a set of functions would be exposed (as now) as well as a `join` function to merge the different results. Ideally, all functions would use similar interfaces as their input data, to simplify usage.

* **`buildNodeStatement`**: Builds expressions of type `(n:Label {key: "value"})`
* **`buildRelationshipStatement`**: Builds expressions of type `(n:Label {key: "value"})-[r:RELATION {key: "value"}]-(m:Label2 {key: "Value"})`
	* This builder uses `buildNodeStatement`  to generate the node sub-statements
* **`buildMergeStatement`**: Builds `MERGE .. ON CREATE` expressions, these expressions may be of the following types:
	* Targeting a single node:
		```
		MERGE (n:Label {key:"value"})
		ON CREATE
		SET
		this.key="value2"
		```
	* Targeting a relationship:
		```
		MERGE (this:MyLabel)-[this_relationship_that]->(that)
		ON CREATE
		SET
		this.age = $this_on_create_age,
		this.name = $this_on_create_name
		this_relationship_that.screentime = $this_relationship_that_on_create_screentime
		```

#### CypherStatement
All the methods in the builder returns a `CypherStatement`, with the following type signature:

```ts
interface NestedRecord<T> extends Record<string | symbol | number, T | NestedRecord<T>> {}
type CypherStatement = [string, NestedRecord<string>];
```

This means that every function will return a string, with the actual Cypher query to be run and an object, with all the parameters that should be passed to the driver.

**joinStatements**
The reasoning behind all methods returning this pair of values, is that these can be easily composed with the `joinStatements` utility function. This makes the composition of queries and parameters trivial, while hiding most of the actual strings and objects handling and allowing to seamlessly pass up any generated resulting parameter.


### Example
```ts
const mergeRelatedNodeStatement = buildMergeStatement({
	sourceNode: {
		node: refNode,
		varName: baseName,
		parameters: whereNodeParameters,
		onCreate: onCreateNode,
	},
	context,
});

const mergeRelationStatement = buildMergeStatement({
	sourceNode: {
		varName: parentVar,
	},
	targetNode: {
		varName: baseName,
	},
	relationship: {
		relationField,
		onCreate: onCreateEdge,
	},
	context,
});

const authStatement = joinStatements(["CALL apoc.util.validate(NOT(", auth, `), "${AUTH_FORBIDDEN_ERROR}", [0])`], "")

return joinStatements([authStatement, mergeRelatedNodeStatement, mergeRelationStatement]);

```
