---
"@neo4j/graphql": patch
---

The Authorization validation has moved to use the procedure `apoc.util.validate` outside filtering to avoid flakiness caused by the order of evaluation in Cypher.
