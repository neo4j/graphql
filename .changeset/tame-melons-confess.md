---
"@neo4j/graphql": patch
---

Added a validation rule to avoid defining fields as lists of nullable elements, as Neo4j does not support this.