---
"@neo4j/graphql": patch
---

Fixed #3437 which caused the `nestedOperations` argument of `@relationship` to generate empty input types if the CONNECT, CREATE or CONNECT_OR_CREATE operations were not generated
