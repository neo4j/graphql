---
"@neo4j/graphql": major
---

`@cypher` directive now requires the parameter `columnName`.

This requires all cypher queries to be made with a valid alias that must be referred in this new parameter.

For Example:

**@neo4j/graphql@3**

```
@cypher(statement: "MATCH (i:Item) WHERE i.public=true RETURN i.name")
```

**@neo4j/graphql@4**

```
@cypher(statement: "MATCH (i:Item) WHERE i.public=true RETURN i.name as result", columnName: "result")
```
