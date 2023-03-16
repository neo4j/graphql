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

For more information about this change and how to disable this validation please see the [4.0.0 migration guide](https://neo4j.com/docs/graphql-manual/current/guides/v4-migration/)
