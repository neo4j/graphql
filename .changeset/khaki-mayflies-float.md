---
"@neo4j/graphql": major
"@neo4j/graphql-ogm": major
---

The Neo4j GraphQL Library now only accepts a `string`, `DocumentNode` or an array containing these types. A callback function returning these is also accepted. This is a reduction from `TypeSource` which also included types such as `GraphQLSchema` and `DefinitionNode`, which would have resulted in unexpected behaviour if passed in.
