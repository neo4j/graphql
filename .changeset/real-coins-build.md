---
"@neo4j/graphql": minor
---

Adds database version detection so that Cypher can be generated in a dynamic manner. Uses this new logic to switch between `point.distance()` and `distance()` as needed. This PR also switches over to use the Cypher index management API.
