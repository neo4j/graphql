---
"@neo4j/graphql": major
---

Removal of the following exports: `Neo4jGraphQLAuthenticationError`, `Neo4jGraphQLForbiddenError`, `EventMeta`, `Neo4jGraphQLAuthPlugin` and `RelationField`. This are either redundant, or internals which shouldn't have been exported.
