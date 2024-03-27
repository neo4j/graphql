---
"@neo4j/graphql": patch
---

Use isInt for checking if type is of type neo4j-driver.Integer. This is the recommended way of performing this check and can remove some flakiness
