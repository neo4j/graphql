---
"@neo4j/graphql": major
---

Makes aggregation types nullable, even if the original property is non-nullable.

This is because, in case of no nodes existing in the database, a null value will be returned by the aggregation
