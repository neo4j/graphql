---
"@neo4j/graphql": major
---

It was possible to define schemas with types that have multiple relationship fields connected by the same type of relationships. Instances of this scenario are now detected during schema generation and an error is thrown so developers are informed to remedy the type definitions.

An example of what is now considered invalid with these checks:

```graphql
type Team {
    player1: Person! @relationship(type: "PLAYS_IN", direction: IN)
    player2: Person! @relationship(type: "PLAYS_IN", direction: IN)
    backupPlayers: [Person!]! @relationship(type: "PLAYS_IN", direction: IN)
}

type Person {
    teams: [Team!]! @relationship(type: "PLAYS_IN", direction: OUT)
}
```

In this example, there are multiple fields in the `Team` type which have the same `Person` type, the same `@relationship` type and ("PLAYS_IN") direction (IN). This is an issue when returning data from the database, as there would be no difference between `player1`, `player2` and `backupPlayers`. Selecting these fields would then return the same data.

To disable checks for duplicate relationship fields, the `noDuplicateRelationshipFields` config option should be used:

```ts
const neoSchema = new Neo4jGraphQL({
    typeDefs,
    config: {
        startupValidation: {
            noDuplicateRelationshipFields: false,
        },
    },
});
```
