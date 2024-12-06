---
"@neo4j/introspector": patch
---

Changed how "@neo4j/introspector" generates list fields that now are generated as a list of non-nullable elements, as a list of nullable elements is not supported by Neo4j.
