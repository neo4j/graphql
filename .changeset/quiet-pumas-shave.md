---
"@neo4j/graphql": patch
---

Fix `@authentication` JWT `where` filters only evaluating the first condition.
All conditions are now evaluated and combined with `AND` as documented.
