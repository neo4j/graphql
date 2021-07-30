# Connections Alias

Schema:

```graphql
type Movie {
    title: String!
    actors: [Actor!]!
        @relationship(type: "ACTED_IN", properties: "ActedIn", direction: IN)
}

type Actor {
    name: String!
    movies: [Movie!]!
        @relationship(type: "ACTED_IN", properties: "ActedIn", direction: OUT)
}

interface ActedIn {
    screenTime: Int!
}
```

---

## Alias Top Level Connection Field

### GraphQL Input

```graphql
{
    movies {
        actors: actorsConnection {
            totalCount
        }
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Movie)
CALL {
    WITH this
    MATCH (this)<-[this_acted_in:ACTED_IN]-(this_actor:Actor)
    WITH collect({ }) AS edges
    RETURN {
        totalCount: size(edges)
    } AS actors
}
RETURN this { actors } as this
```

### Expected Cypher Params

```json
{}
```

---
