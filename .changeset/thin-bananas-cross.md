---
"@neo4j/graphql": patch
---

Add unique identifier to Cypher queries when combining with `UNION`, to ensure results aren't incorrectly de-duped. Fixes #2820.
