---
"@neo4j/graphql": patch
---

Fix: Cypher generation syntax error
Generated cypher statement when executed produces a syntax error, requires white spaces between AND and variable name.
