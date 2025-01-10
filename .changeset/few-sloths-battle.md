---
"@neo4j/graphql": major
---

Changes the result projection where there are multiple relationships between two nodes.

In the case of using the connection API then multiple relationships will still be represented, as there is the ability to select the relationship properties. In the non-connection API case, the duplicate results will only return distinct results.
