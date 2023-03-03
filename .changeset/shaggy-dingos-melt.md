---
"@neo4j/cypher-builder": patch
"@neo4j/graphql": patch
---

`Cypher.plus/Cyper.minus` are becoming respectively a reference to the unary plus and unary minus, while the previous behavior is maintained by `Cypher.add` and `Cypher.subtract`.
Introduced `Cypher.append` to support string concatenation. 
