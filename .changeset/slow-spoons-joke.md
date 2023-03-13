---
"@neo4j/graphql": patch
---

Fixed a bug that generates a relationship field of a union type as a List, in some inputs, even if defined as a 1 to 1 relationship field by the user.
