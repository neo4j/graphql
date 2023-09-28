---
"@neo4j/graphql": patch
---

Fix issue 3923, applying multiple predicates on different node implementations using a connection filter resulted in some predicates not being applied.
