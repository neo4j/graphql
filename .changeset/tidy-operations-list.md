---
"@neo4j/graphql": patch
---

Fix bug where non-list `@authentication` operations, e.g. `@authentication(operations: CREATE)` are ignored, by throwing an error when a non-list operation is provided.
