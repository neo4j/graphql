---
"@neo4j/graphql": patch
---

Fix: authorization checks are no longer added for the source nodes of connect operations, when the operation started with a create. The connect operation is likely required to complete before the authorization rules will be satisfied.
