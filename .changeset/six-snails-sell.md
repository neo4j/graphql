---
"@neo4j/graphql": patch
---

Fixed bug that caused an empty string and false boolean argument being evaluated as `NULL` when passed as an argument of a `@cypher` field.
