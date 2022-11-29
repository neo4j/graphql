# Cypher Builder

This is a proposal on an internal Cypher query builder tool to improve consistency and reduce complexity in the internal code of the neo4j/graphql library.

## Problem

Currently, our Cypher generation relies on string concatenation on-demand, this is prone to errors and cause several issues:

-   Inconsistency on generated Cypher
-   Typos may cause hard to find bugs
-   Verbosity
-   Duplicate and non-reusable code
-   Hard to test code

## Cypher Builder proposal

This is a proposal on a Cypher builder, the goal of this builder is to be able to generate valid Cypher statements in a flexible and consistent manner with TypeScript as well as handle Cypher parameters. The interface should be clean and usable, as both internal developers and contributors should be able to use it. Having a feature complete Cypher builder, is out of scope.

**Must-have** goals:

-   Provide an unified way of creating valid Cypher.
-   Have an easy interface, abstracting some of the nitty-gritty details of Cypher composition where possible.
-   Ease unit-testing.
-   Reduce code complexity, duplicity, and size by abstracting the Cypher composition layer.
-   Handle parameters in a consistent way.
-   Ensure Cypher Injection is not possible

**Nice-to-have** that may be achieved with this proposal:

-   Improve TypeScript types over using plain string.
-   Decoupled from GraphQL and business logic.
-   Static Cypher validation (i.e. before hitting the database).
-   Cypher Backtracking (i.e. allow to easily modify Cypher statements in a non-sequential fashion).

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

const query = new CypherBuilder.Match(relationship).where(actorNode, { name: "Arthur" }).return(movieNode, ["title"]);

const { cypher, params } = query.build();
cypher; // "MATCH(this1:Actor)...."
params; // { param1: "Arthur" }
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
const actorNode = new CypherBuilder.Node({ labels: ["Actor"] });
const movieNode = new CypherBuilder.Node({ labels: ["Movie"] });
const actedIn = new CypherBuilder.Relationship({ type: "ACTED_IN", source: actorNode, target: movieNode });

const query = new CypherBuilder.Match(actedIn).where(actorNode, { name: "Arthur" }).return([[movieNode, "title"]]);

actorNode.addLabel("MyOtherLabel");
actorNode.setAlias("pepe");

query.print(); // MATCH(pepe:Actor:MyOtherLabel)-[:ACTED_IN]->(m:Movie) ....
```

## Patterns

Writing complex patterns (such as `()-[]->()<-[]-()`) can be tricky in a readable and composable API.

The following cases will create the pattern: `(:Actor {name: "Neo"})-[:ACTED_IN*3 {role: "neo"}]-(:Movie {title: "The Matrix"})`. In all 3 cases all of the parameters are optional and the default direction would be from the first node to the second (`()-[]->()`)

### Proposals

**1. Use a related chain**

This approach is closer to a fluent API, easier to write, and consistent across all nodes and relationships, but have 2 downsides:

-   It is hard to noticed which options are scoped to the relationship and which ones to the node.
-   It may be hard to compose a pattern from variables (i.e. having the relationship outside the fluent interface).

```typescript
new CypherBuilder.Node({ labels: ["Actor"] })
    .withProperties({ title: "The Matrix" })
    .related()
    .undirected()
    .withType("ACTED_IN")
    .length(3)
    .withProperties({ role: "neo " })
    .to(movieNode.withProperties({ title: "The Matrix" }));
```

**2. A nested relationship**

This approach is a bit more verbose, but adds a level of nested field to the relationship, making it easier to separate and compose.

```typescript
new CypherBuilder.Node({ labels: ["Actor"] })
    .withProperties({ title: "The Matrix" })
    .related(new Relationship().undirected().withType("ACTED_IN").length(3).withProperties({ role: "neo " }))
    .to(movieNode.withProperties({ title: "The Matrix" }));
```

**3. A nested relationship in a callback**

Similar to before, but using a callback for the nested relationship instead of directly. This makes it slightly easier to enforce the type at runtime, but adds the added complexity of a callback and slightly harder to compose with existing relationships.

```typescript
new CypherBuilder.Node({ labels: ["Actor"] })
    .withProperties({ title: "The Matrix" })
    .related((relationship) =>
        relationship.undirected().withType("ACTED_IN").length(3).withProperties({ role: "neo " })
    )
    .to(movieNode.withProperties({ title: "The Matrix" }));
```

## Cypher Builder Domain

The domain of the CypherBuilder is a subset of [Cypher syntax](https://neo4j.com/docs/cypher-manual/current/syntax/). Only the minimum required abstraction for query composition for the library will be taken into account.

An abstract class **CypherASTNode** will define the required interface to construct and traverse the generated Cypher tree. All classes defined in the following pseudo-grammar will be implemented as subclasses or **CypherASTNode**:

-   **Clause**: A statement that can be built into a Cypher query (string + Params) standalone.
-   **Subclause**: A statement that can only be built as part of a top-level statement.
    -   Subclauses are not exposed directly to the user, and are generated through a builder pattern (e.g. `Match().where()`
-   **Variable**: Reference to a Cypher variable.
-   **PropertyRef**: A reference to a property of a variable (e.g. `this.name`)
-   **Operations**: Different kinds of operations are valid as part of a clause, and usually support recursive expressions.

The pseudo-grammar is as follows:

```yaml
Clause: <Match> | <Return> | <Call> | <With>
-- Match: MATCH <Pattern> (<Where> | <Set>)
-- Return: RETURN <Projection> <OrderBy>?
-- Call: CALL { <Clause> }
-- With: WITH <Projection> # May act as a subclause in some cases


SubClause: <Where> | OrderBy # Subclauses cannot exists by themselves, and are always linked to a clause
-- Where: WHERE (<BooleanOp> | <ComparisonOp>)
-- Set: SET <PropertyRef> = <Expr>
-- OrderBy: <PropertyRef> (ASC | DESC)?


Variable: <Param> | <NodeRef> | <RelationshipRef> | <Literal>
-- NodeRef: A variable created from a node reference # new CypherBuilder.Node()
-- RelationshipRef: A variable created from a Relationship reference
-- Literal: A variable created from a raw literal
-- Param # param0

PropertyRef: <Variable>.<PropertyPath> # Example: this.name, this.node.potato

Operations:
-- BooleanOp: (<BooleanOp> | <ComparisonOp>)? + (AND | OR | NOT) (<BooleanOp> | <ComparisonOp>)
-- ComparisonOp: <Expr> (IS NOT, =, <, IS NULL, STARTS WITH...) <Expr>
-- MathOp: <Expr> (+|-|/|*) <Expr>

Pattern
-- NodePattern: (NodeRef?:Labels? <Map>)
-- RelationshipPattern: <NodePattern>-[RelationshipRef?:Type? <Map>]-<NodePattern>

Projection: (Expr (as <Variable>)?)+

Function: <name>(Expr)

List: [1,2..] | <ListComprehension> | <PatternComprehension>
-- ListComprehension: [<Variable> IN <List | Function> WHERE (<BooleanOp> | <ComparisonOp>) | <Expr> ] # [x IN range(0,10) WHERE x % 2 = 0 | x^3 ]
-- PatternComprehension: [<Pattern> WHERE (<BooleanOp> | <ComparisonOp>) | <Expr>] # [(a)-->(b:Movie) WHERE b.title CONTAINS 'Matrix' | b.released]
Map # Similar to a javascript object


Expr: PropertyRef | Variable | Function | Operations | Literals | List | Map
```

### CypherEnvironment

The environment takes care of variable naming and parameters generation at built time. The environment is **not** exposed to the user.

## Lifecycle

Lazy building of the queries allow for a more flexible query composition. Building a query is done in 2 steps:

1. The AST is built by composing all the different pieces of it, with a root clause statement. All variables and parameters are passed as references (e.g. CypherBuilder.Node)
2. Call the method `.build` to generate the cypher and paramenters of the full AST. This process is as follows (hidden to the user):
    1. A new `CypherEnvironment` is created, empty.
    2. The method `getCypher` from the root node is called, passing the Environment.
    3. All the children nodes `getCypher` method are called (recursively)
    4. (per node) All variable references are translated to unique identifiers through the environment
    5. (per node) The cypher string is generated (`cypher` method). By creating the string of the current node and composing all the children's cyphers
    6. The cypher string is returned, the environment generates all the parameters object

## Extending with RawCypherQuery

To support compatibility with plain strings. The class `RawCypherQuery` can be used to create custom AST nodes:

```typescript
const myQuery = new CypherBuilder.RawCypherQuery((cypherEnv, childrenCypher) => {
    // This callback is executed within the build process
    const node = new CypherBuilder.Node();
    const query = `MATCH (${cypherEnv.getReferenceId(node)} {name: $myCustomParam}) ${childrenCypher}`;

    return [query, { myCustomParam: "MyName" }];
});
parentQuery.concat(myQuery).build(); // Generates the full query
```

## Risks & Unknowns

-   An [AST](https://en.wikipedia.org/wiki/Abstract_syntax_tree) for GraphQL to Cypher has yet to be defined. Some aspects of this builder (e.g. parameters) may be depend on the solution agreed for an AST

## Related work

-   [cypher-query-builder](https://github.com/jamesfer/cypher-query-builder)
-   [fluent-cypher](https://github.com/ogroppo/fluent-cypher)
-   [neo4j-ogm](https://github.com/neo4j/neo4j-ogm)
-   [cypher-composer](https://github.com/danstarns/cypher-composer)

## Out of scope

-   Feature-completeness is out of scope, the tools should be focused on generating the queries that are required for neo4j/graphql.
-   This proposal does **not** include any user-facing features or tools.

## Alternatives considered

### Functions

The current prototype is build as a collection of functions, all returning a unified type that can be composed. Under this interface, a set of functions would be exposed (as now) as well as a `join` function to merge the different results. Ideally, all functions would use similar interfaces as their input data, to simplify usage.

-   **`buildNodeStatement`**: Builds expressions of type `(n:Label {key: "value"})`
-   **`buildRelationshipStatement`**: Builds expressions of type `(n:Label {key: "value"})-[r:RELATION {key: "value"}]-(m:Label2 {key: "Value"})`
    -   This builder uses `buildNodeStatement` to generate the node sub-statements
-   **`buildMergeStatement`**: Builds `MERGE .. ON CREATE` expressions, these expressions may be of the following types:
    -   Targeting a single node:
        ```
        MERGE (n:Label {key:"value"})
        ON CREATE
        SET
        this.key="value2"
        ```
    -   Targeting a relationship:
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

const authStatement = joinStatements(["CALL apoc.util.validate(NOT (", auth, `), "${AUTH_FORBIDDEN_ERROR}", [0])`], "");

return joinStatements([authStatement, mergeRelatedNodeStatement, mergeRelationStatement]);
```
