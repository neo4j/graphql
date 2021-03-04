## Cypher Alias

Tests to ensure when using aliases that the cypher is correct.

Schema:

```schema
type Actor {
    name: String
}

type Movie {
    id: ID
    actors: [Actor] @relationship(type: "ACTED_IN", direction: "IN")
    custom: [Movie] @cypher(statement: """
        MATCH (m:Movie)
        RETURN m
    """)
}
```

---

### Alias

**GraphQL input**

```graphql
{
    movies {
        movieId: id
        actors {
            aliasActorsName: name
        }
        custom {
            aliasCustomId: id
        }
    }
}
```

**Expected Cypher output**

```cypher
MATCH (this:Movie)
RETURN this {
    .id,
    actors: [ (this)<-[:ACTED_IN]-(this_actors:Actor) | this_actors { .name } ],
    custom: [this_custom IN apoc.cypher.runFirstColumn("MATCH (m:Movie) RETURN m", {this: this, params: $params, auth: $params.auth}, true) | this_custom { .id }]
} as this
```

**Expected Cypher params**

```cypher-params
{
    "params": {
        "auth": {
            "isAuthenticated": true,
            "roles": ["admin"],
            "jwt": {
                 "roles": [
                     "admin"
                 ],
                 "sub": "super_admin"
             }
        }
    }
}
```

**JWT Object**

```jwt
{
    "sub": "super_admin",
    "roles": ["admin"]
}
```

---
