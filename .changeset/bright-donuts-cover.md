---
"@neo4j/graphql": patch
---

Fix a case where we were using .flatMap on an Iterable which works in node 22 but not in node 20. We currently support node 20.
