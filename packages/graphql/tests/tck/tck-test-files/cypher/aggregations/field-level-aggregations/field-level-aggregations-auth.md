# Field Level Aggregations

Field level aggregations auth

Schema:

```graphql
type Movie @auth(rules: [{ isAuthenticated: true }]) {
    title: String
    actors: [Actor] @relationship(type: "ACTED_IN", direction: IN)
}

type Actor {
    name: String
    age: Int
    movies: [Movie] @relationship(type: "ACTED_IN", direction: OUT)
}
```

---

## Count aggregation with parent node auth

### GraphQL Input

```graphql
query {
    movies {
        title
        actorsAggregate {
            count
        }
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Movie)
CALL apoc.util.validate(NOT(apoc.util.validatePredicate(NOT($auth.isAuthenticated = true), "@neo4j/graphql/UNAUTHENTICATED", [0])), "@neo4j/graphql/FORBIDDEN", [0])
RETURN this { .title,
        actorsAggregate: {
            count: head(apoc.cypher.runFirstColumn("
            MATCH (this)<-[r:ACTED_IN]-(n:Actor) RETURN COUNT(n)
            ", { this: this }))
        }
} as this
```

### Expected Cypher Params

```json
{
    "auth": {
        "isAuthenticated": true,
        "jwt": {
            "sub": "super_admin"
        },
        "roles": []
    }
}
```

### JWT Object

```json
{
    "sub": "super_admin"
}
```

---

## Count aggregation with auth in aggregated node

### GraphQL Input

```graphql
query {
    actors {
        name
        moviesAggregate {
            count
        }
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Actor)
RETURN this { .name,
        moviesAggregate: {
            count: head(apoc.cypher.runFirstColumn("
            MATCH (this)-[r:ACTED_IN]->(n:Movie)
            CALL apoc.util.validate(NOT(apoc.util.validatePredicate(NOT($auth.isAuthenticated = true), \"@neo4j/graphql/UNAUTHENTICATED\", [0])), \"@neo4j/graphql/FORBIDDEN\", [0])
            RETURN COUNT(n) ", { auth: $auth, this: this  }))
        }
} as this
```

### Expected Cypher Params

```json
{
    "auth": {
        "isAuthenticated": true,
        "jwt": {
            "sub": "super_admin"
        },
        "roles": []
    }
}
```

### JWT Object

```json
{
    "sub": "super_admin"
}
```
