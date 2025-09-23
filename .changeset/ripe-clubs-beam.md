---
"@neo4j/graphql": patch
---

Fixed a case where selecting pageInfo on a connection would only return totalCount. It now correctly returns the full pageInfo object.
