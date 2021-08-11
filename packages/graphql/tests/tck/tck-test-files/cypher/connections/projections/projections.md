# Relay Cursor Connection projections

Ensure that `totalCount` and `edges` are always returned so that `pageInfo` can be calculated. `edges` should always be minimal if not specifically requested.

Schema:

```graphql
union Production = Movie | Series

type Movie {
    title: String!
    actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN)
}

type Series {
    title: String!
    actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN)
}

type Actor {
    name: String!
    productions: [Production!]! @relationship(type: "ACTED_IN", direction: OUT)
}
```

---

## edges not returned if not asked for

### GraphQL Input

```graphql
query {
    movies(where: { title: "Forrest Gump" }) {
        title
        actorsConnection {
            totalCount
        }
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Movie)
WHERE this.title = $this_title
CALL {
    WITH this
    MATCH (this)<-[this_acted_in:ACTED_IN]-(this_actor:Actor)
    WITH collect({ }) AS edges
    RETURN { totalCount: size(edges) } AS actorsConnection
}
RETURN this { .title, actorsConnection } as this
```

### Expected Cypher Params

```json
{
    "this_title": "Forrest Gump"
}
```

---

## edges and totalCount returned if pageInfo asked for

### GraphQL Input

```graphql
query {
    movies(where: { title: "Forrest Gump" }) {
        title
        actorsConnection {
            pageInfo {
                startCursor
                endCursor
                hasNextPage
                hasPreviousPage
            }
        }
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Movie)
WHERE this.title = $this_title
CALL {
    WITH this
    MATCH (this)<-[this_acted_in:ACTED_IN]-(this_actor:Actor)
    WITH collect({ }) AS edges
    RETURN { edges: edges, totalCount: size(edges) } AS actorsConnection
}
RETURN this { .title, actorsConnection } as this
```

### Expected Cypher Params

```json
{
    "this_title": "Forrest Gump"
}
```

---

## Minimal edges returned if not asked for with pagination arguments

### GraphQL Input

```graphql
query {
    movies(where: { title: "Forrest Gump" }) {
        title
        actorsConnection(first: 5) {
            totalCount
        }
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Movie)
WHERE this.title = $this_title
CALL {
    WITH this
    MATCH (this)<-[this_acted_in:ACTED_IN]-(this_actor:Actor)
    WITH collect({ }) AS edges
    WITH size(edges) AS totalCount, edges[..5] AS limitedSelection
    RETURN { edges: limitedSelection, totalCount: totalCount } AS actorsConnection
}
RETURN this { .title, actorsConnection } as this
```

### Expected Cypher Params

```json
{
    "this_title": "Forrest Gump"
}
```

---

## edges not returned if not asked for on a union

### GraphQL Input

```graphql
query {
    actors(where: { name: "Tom Hanks" }) {
        name
        productionsConnection {
            totalCount
        }
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Actor)
WHERE this.name = $this_name
CALL {
    WITH this
    CALL {
        WITH this
        OPTIONAL MATCH (this)-[this_acted_in:ACTED_IN]->(this_Movie:Movie)
        WITH { node: { __resolveType: "Movie" } } AS edge
        RETURN edge
        UNION
        WITH this
        OPTIONAL MATCH (this)-[this_acted_in:ACTED_IN]->(this_Series:Series)
        WITH { node: { __resolveType: "Series" } } AS edge
        RETURN edge
    }
    WITH count(edge) as totalCount
    RETURN { totalCount: totalCount } AS productionsConnection
}
RETURN this { .name, productionsConnection } as this
```

### Expected Cypher Params

```json
{
    "this_name": "Tom Hanks"
}
```

---

## edges and totalCount returned if pageInfo asked for on a union

### GraphQL Input

```graphql
query {
    actors(where: { name: "Tom Hanks" }) {
        name
        productionsConnection {
            pageInfo {
                startCursor
                endCursor
                hasNextPage
                hasPreviousPage
            }
        }
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Actor)
WHERE this.name = $this_name
CALL {
    WITH this
    CALL {
        WITH this
        OPTIONAL MATCH (this)-[this_acted_in:ACTED_IN]->(this_Movie:Movie)
        WITH { node: { __resolveType: "Movie" } } AS edge
        RETURN edge
        UNION
        WITH this
        OPTIONAL MATCH (this)-[this_acted_in:ACTED_IN]->(this_Series:Series)
        WITH { node: { __resolveType: "Series" } } AS edge
        RETURN edge
    }
    WITH collect(edge) as edges, count(edge) as totalCount
    RETURN { edges: edges, totalCount: totalCount } AS productionsConnection
}
RETURN this { .name, productionsConnection } as this
```

### Expected Cypher Params

```json
{
    "this_name": "Tom Hanks"
}
```

---

## totalCount is calculated and returned if asked for with edges

### GraphQL Input

```graphql
query {
    movies(where: { title: "Forrest Gump" }) {
        title
        actorsConnection {
            totalCount
            edges {
                node {
                    name
                }
            }
        }
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Movie)
WHERE this.title = $this_title
CALL {
    WITH this
    MATCH (this)<-[this_acted_in:ACTED_IN]-(this_actor:Actor)
    WITH collect({ node: { name: this_actor.name } }) AS edges
    RETURN { edges: edges, totalCount: size(edges) } AS actorsConnection
}
RETURN this { .title, actorsConnection } as this
```

### Expected Cypher Params

```json
{
    "this_title": "Forrest Gump"
}
```

---

## totalCount is calculated and returned if asked for with edges with pagination arguments

### GraphQL Input

```graphql
query {
    movies(where: { title: "Forrest Gump" }) {
        title
        actorsConnection(first: 5) {
            totalCount
            edges {
                node {
                    name
                }
            }
        }
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Movie)
WHERE this.title = $this_title
CALL {
    WITH this
    MATCH (this)<-[this_acted_in:ACTED_IN]-(this_actor:Actor)
    WITH collect({ node: { name: this_actor.name } }) AS edges
    WITH size(edges) AS totalCount, edges[..5] AS limitedSelection
    RETURN { edges: limitedSelection, totalCount: totalCount } AS actorsConnection
}
RETURN this { .title, actorsConnection } as this
```

### Expected Cypher Params

```json
{
    "this_title": "Forrest Gump"
}
```
