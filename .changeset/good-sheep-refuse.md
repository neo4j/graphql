---
"@neo4j/graphql": major
---

`DateTime` and `Time` values are now converted from strings into temporal types in the generated Cypher instead of in server code using the driver. This could result in different values when the database is in a different timezone to the GraphQL server.
