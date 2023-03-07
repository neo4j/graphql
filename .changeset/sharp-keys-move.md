---
"@neo4j/graphql": patch
---

Fix: context is now fully populated when using Apollo Federation, therefore, driver is no longer mandatory on construction and can be injected into the context like usual
