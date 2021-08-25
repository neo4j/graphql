# Cypher alias directive

Tests for queries on relationships.

Schema:

```graphql
type Actor {
    name: String!
    city: String @alias(property: "cityPropInDb")
    actedIn: [Movie]
        @relationship(
            direction: OUT
            type: "ACTED_IN"
            properties: "ActorActedInProps"
        )
}

type Movie {
    title: String!
    rating: Float @alias(property: "ratingPropInDb")
}

interface ActorActedInProps {
    character: String! @alias(property: "characterPropInDb")
    screenTime: Int
}
```

---

## Simple relation

### GraphQL Input

```graphql
{
    actors {
        name
        city
        actedIn {
            title
            rating
        }
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Actor)
RETURN this { .name, city: this.cityPropInDb, actedIn: [ (this)-[:ACTED_IN]->(this_actedIn:Movie) | this_actedIn { .title, rating: this_actedIn.ratingPropInDb } ] } as this
```

### Expected Cypher Params

```json
{}
```

---

## With relationship properties

### GraphQL Input

```graphql
{
    actors {
        name
        city
        actedInConnection {
            edges {
                character
                screenTime
                node {
                    title
                    rating
                }
            }
        }
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Actor)
CALL {
    WITH this MATCH (this)-[this_acted_in_relationship:ACTED_IN]->(this_movie:Movie)
    WITH collect({ character: this_acted_in_relationship.characterPropInDb, screenTime: this_acted_in_relationship.screenTime, node: { title: this_movie.title, rating: this_movie.ratingPropInDb } }) AS edges
    RETURN { edges: edges, totalCount: size(edges) } AS actedInConnection
    }
RETURN this { .name, city: this.cityPropInDb, actedInConnection } as this
```

### Expected Cypher Params

```json
{}
```

---

## Create mutation

### GraphQL Input

```graphql
mutation {
    createActors(input: [{ name: "Molly", city: "Sjömarken" }]) {
        actors {
            name
            city
        }
    }
}
```

### Expected Cypher Output

```cypher
CALL {
        CREATE (this0:Actor)
        SET this0.name = $this0_name
        SET this0.cityPropInDb = $this0_city
        RETURN this0
    }
RETURN this0 { .name, city: this0.cityPropInDb } AS this0
```

### Expected Cypher Params

```json
{
    "this0_city": "Sjömarken",
    "this0_name": "Molly"
}
```
