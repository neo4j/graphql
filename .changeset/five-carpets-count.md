---
"@neo4j/graphql": patch
---

Fixes the case where Connection queries with `@limit` in the type would generate unnecessary cypher with extra node/edge projection.
