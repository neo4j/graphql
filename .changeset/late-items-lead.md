---
"@neo4j/graphql": patch
---

Backport fix #6243: Handles Neo4j error "52N29" on CDC polling by refreshing the cursor. This error could be triggered in some cases by an outdated cursor.
