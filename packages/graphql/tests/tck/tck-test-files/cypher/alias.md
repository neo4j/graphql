## Cypher Alias

Tests to ensure when using aliases that the cypher is correct.

Schema:

```schema
type Actor {
    name: String!
}

type Movie {
    id: ID
    releaseDate: DateTime!
    location: Point!
    actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN)
    custom: [Movie!]! @cypher(statement: """
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
    movieId: this.id,
    actors: [ (this)<-[:ACTED_IN]-(this_actors:Actor) | this_actors { aliasActorsName: this_actors.name } ],
    custom: [this_custom IN apoc.cypher.runFirstColumn("MATCH (m:Movie) RETURN m", {this: this, auth: $auth}, true) | this_custom { aliasCustomId: this_custom.id }]
} as this
```

**Expected Cypher params**

```cypher-params
{
    "auth": {
       "isAuthenticated": true,
       "roles": [],
       "jwt": {}
    }
}
```

### Multiple aliases for single field with arguments

**GraphQL input**

```graphql
{
    movies {
        id
        keanu: actors(where: { name: "Keanu" }) {
            name
        }
        carrie: actors(where: { name: "Carrie" }) {
            name
        }
    }
}
```

**Expected Cypher output**

```cypher
MATCH (this:Movie)
RETURN this {
    .id,
    keanu: [ (this)<-[:ACTED_IN]-(this_keanu:Actor)  WHERE this_keanu.name = $this_keanu_name | this_keanu { .name } ],
    carrie: [ (this)<-[:ACTED_IN]-(this_carrie:Actor)  WHERE this_carrie.name = $this_carrie_name | this_carrie { .name } ],
} as this
```

**Expected Cypher params**

```cypher-params
{
    "auth": {
       "isAuthenticated": true,
       "roles": [],
       "jwt": {}
    },
    "this_keanu_name": "Keanu",
    "this_carrie_name": "Carrie"
}
```

### Alias datetime field

**GraphQL input**

```graphql
{
    movies {
        d1: releaseDate
        d2: releaseDate
    }
}
```

**Expected Cypher output**

```cypher
MATCH (this:Movie)
RETURN this {
    d1: apoc.date.convertFormat(toString(this.releaseDate), "iso_zoned_date_time", "iso_offset_date_time"),
    d2: apoc.date.convertFormat(toString(this.releaseDate), "iso_zoned_date_time", "iso_offset_date_time")
} as this
```

**Expected Cypher params**

```cypher-params
{
    "auth": {
       "isAuthenticated": true,
       "roles": [],
       "jwt": {}
    }
}
```

### Alias point field

**GraphQL input**

```graphql
{
    movies {
        p1: location
        p2: location
    }
}
```

**Expected Cypher output**

```cypher
MATCH (this:Movie)
RETURN this {
    p1: { point: this.location },
    p2: { point: this.location }
} as this
```

**Expected Cypher params**

```cypher-params
{
    "auth": {
       "isAuthenticated": true,
       "roles": [],
       "jwt": {}
    }
}
```
