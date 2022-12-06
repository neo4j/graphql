# Cypher Builder - Beta

The Cypher builder is a library for building [Cypher](https://neo4j.com/docs/cypher-manual/current/) for [Neo4j](https://neo4j.com/) queries with a programmatic API.

> Note that this library is still under development.

Try it live on [CodePen](https://codepen.io/angrykoala/pen/dyKmpzP).

# Getting Started

```typescript
import Cypher from "@neo4j/cypher-builder";

const movieNode = new Cypher.Node({
    labels: ["Movie"],
});

const matchQuery = new Cypher.Match(movieNode)
    .where(movieNode, {
        title: new Cypher.Param("The Matrix"),
    })
    .return(movieNode.property("title"));

const { cypher, params } = matchQuery.build();

console.log(cypher);
console.log(params);
```

In this example, `cypher` will be a string containing the following:

```cypher
MATCH (this0:`Movie`)
WHERE this0.title = $param0
RETURN this0.title
```

`params` will contain the parameters used in that query as an object:

```typescript
{
    "param0": "The Matrix",
}
```

# Examples

You can find usage examples in the [examples](https://github.com/neo4j/graphql/tree/dev/packages/cypher-builder/examples) folder and in [CodePen](https://codepen.io/collection/waPbzd).

# Development

-   `yarn test` to run cypher builder tests
-   `yarn build` to compile cypher builder library
-   `yarn docs` to generate the API reference docs
