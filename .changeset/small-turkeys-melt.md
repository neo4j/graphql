---
"@neo4j/cypher-builder": minor
---

The type `Cypher.PropertyRef` is now fully exported under `Cypher.Property` for use with utilities such as `instanceof`. However, it maintains the current behaviour of not being directly instantiable.
