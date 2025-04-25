---
"@neo4j/graphql": patch
---

Fix bug with `@populatedBy`. Callback wouldn't be triggered by nested create operations for relationship fields.
