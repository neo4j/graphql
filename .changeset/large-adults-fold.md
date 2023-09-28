---
"@neo4j/graphql": patch
---

Fix issue 4015, selecting the node field twice with a different selection set resulted in one selection set being ignored.
