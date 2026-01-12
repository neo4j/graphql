---
"@neo4j/graphql": patch
---

Add support for `@cypher` directive in relationship properties

```graphql
type ActedIn @relationshipProperties {
    screenTimeHours: Float
        @cypher(
            statement: """
            RETURN this.screenTimeMinutes / 60 AS c
            """
            columnName: "c"
        )
    screenTimeMinutes: Int
}
```
