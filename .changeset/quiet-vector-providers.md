---
"@neo4j/graphql": patch
---

Fail schema validation when a `@vector` provider's settings are `undefined` or `null` in `features.vector`, instead of failing on the first phrase query
