---
"@neo4j/graphql": major
"@neo4j/graphql-ogm": major
---

Remove deprecated relationship filters without suffix. Queries which previously used these should migrate over to `_SOME` filters.
