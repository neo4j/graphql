---
"@neo4j/graphql": major
---

Change the way how `@node` behaves, `@node` is now required, and GraphQL Object types without the directive `@node` will no longer considered as a Neo4j Nodes representation. 
Queries and Mutations will be generated only for types with the `@node` directive.
