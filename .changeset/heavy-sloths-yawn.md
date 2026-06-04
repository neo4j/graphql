---
"@neo4j/graphql": patch
---

Context.cypherParams properties no longer override resolver generated one.
In case of a conflict an error is now thrown.
