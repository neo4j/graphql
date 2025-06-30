---
"@neo4j/graphql": patch
---

Fixed mutation input type generation for enum and custom scalar list operations. The `push`, `pop`, and `set` operations in list mutation inputs for enums and custom scalars are now correctly marked as optional instead of required.