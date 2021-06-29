## Cypher -> Connections -> Filtering -> Relationship -> String

Schema:

```schema
type Movie {
  title: String!
  actors: [Actor!]! @relationship(type: "ACTED_IN", properties: "ActedIn", direction: IN)
}

type Actor {
  name: String!
  movies: [Movie!]! @relationship(type: "ACTED_IN", properties: "ActedIn", direction: OUT)
}

interface ActedIn {
  role: String!
  screenTime: Int!
}
```

```env
NEO4J_GRAPHQL_ENABLE_REGEX=1
```

---

### CONTAINS

**GraphQL input**

```graphql
query {
    movies {
        title
        actorsConnection(
            where: { relationship: { role_CONTAINS: "Forrest" } }
        ) {
            edges {
                role
                node {
                    name
                }
            }
        }
    }
}
```

**Expected Cypher output**

```cypher
MATCH (this:Movie)
CALL {
    WITH this
    MATCH (this)<-[this_acted_in:ACTED_IN]-(this_actor:Actor)
    WHERE this_acted_in.role CONTAINS $this_actorsConnection.args.where.relationship.role_CONTAINS
    WITH collect({ role: this_acted_in.role, node: { name: this_actor.name } }) AS edges
    RETURN { edges: edges } AS actorsConnection
}
RETURN this { .title, actorsConnection } as this
```

**Expected Cypher params**

```cypher-params
{
    "this_actorsConnection": {
        "args": {
            "where": {
                "relationship": {
                    "role_CONTAINS": "Forrest"
                }
            }
        }
    }
}
```

---

### NOT_CONTAINS

**GraphQL input**

```graphql
query {
    movies {
        title
        actorsConnection(
            where: { relationship: { role_NOT_CONTAINS: "Forrest" } }
        ) {
            edges {
                role
                node {
                    name
                }
            }
        }
    }
}
```

**Expected Cypher output**

```cypher
MATCH (this:Movie)
CALL {
    WITH this
    MATCH (this)<-[this_acted_in:ACTED_IN]-(this_actor:Actor)
    WHERE (NOT this_acted_in.role CONTAINS $this_actorsConnection.args.where.relationship.role_NOT_CONTAINS)
    WITH collect({ role: this_acted_in.role, node: { name: this_actor.name } }) AS edges
    RETURN { edges: edges } AS actorsConnection
}
RETURN this { .title, actorsConnection } as this
```

**Expected Cypher params**

```cypher-params
{
    "this_actorsConnection": {
        "args": {
            "where": {
                "relationship": {
                    "role_NOT_CONTAINS": "Forrest"
                }
            }
        }
    }
}
```

---

### STARTS_WITH

**GraphQL input**

```graphql
query {
    movies {
        title
        actorsConnection(
            where: { relationship: { role_STARTS_WITH: "Forrest" } }
        ) {
            edges {
                role
                node {
                    name
                }
            }
        }
    }
}
```

**Expected Cypher output**

```cypher
MATCH (this:Movie)
CALL {
    WITH this
    MATCH (this)<-[this_acted_in:ACTED_IN]-(this_actor:Actor)
    WHERE this_acted_in.role STARTS WITH $this_actorsConnection.args.where.relationship.role_STARTS_WITH
    WITH collect({ role: this_acted_in.role, node: { name: this_actor.name } }) AS edges
    RETURN { edges: edges } AS actorsConnection
}
RETURN this { .title, actorsConnection } as this
```

**Expected Cypher params**

```cypher-params
{
    "this_actorsConnection": {
        "args": {
            "where": {
                "relationship": {
                    "role_STARTS_WITH": "Forrest"
                }
            }
        }
    }
}
```

---

### NOT_STARTS_WITH

**GraphQL input**

```graphql
query {
    movies {
        title
        actorsConnection(
            where: { relationship: { role_NOT_STARTS_WITH: "Forrest" } }
        ) {
            edges {
                role
                node {
                    name
                }
            }
        }
    }
}
```

**Expected Cypher output**

```cypher
MATCH (this:Movie)
CALL {
    WITH this
    MATCH (this)<-[this_acted_in:ACTED_IN]-(this_actor:Actor)
    WHERE (NOT this_acted_in.role STARTS WITH $this_actorsConnection.args.where.relationship.role_NOT_STARTS_WITH)
    WITH collect({ role: this_acted_in.role, node: { name: this_actor.name } }) AS edges
    RETURN { edges: edges } AS actorsConnection
}
RETURN this { .title, actorsConnection } as this
```

**Expected Cypher params**

```cypher-params
{
    "this_actorsConnection": {
        "args": {
            "where": {
                "relationship": {
                    "role_NOT_STARTS_WITH": "Forrest"
                }
            }
        }
    }
}
```

---

### ENDS_WITH

**GraphQL input**

```graphql
query {
    movies {
        title
        actorsConnection(where: { relationship: { role_ENDS_WITH: "Gump" } }) {
            edges {
                role
                node {
                    name
                }
            }
        }
    }
}
```

**Expected Cypher output**

```cypher
MATCH (this:Movie)
CALL {
    WITH this
    MATCH (this)<-[this_acted_in:ACTED_IN]-(this_actor:Actor)
    WHERE this_acted_in.role ENDS WITH $this_actorsConnection.args.where.relationship.role_ENDS_WITH
    WITH collect({ role: this_acted_in.role, node: { name: this_actor.name } }) AS edges
    RETURN { edges: edges } AS actorsConnection
}
RETURN this { .title, actorsConnection } as this
```

**Expected Cypher params**

```cypher-params
{
    "this_actorsConnection": {
        "args": {
            "where": {
                "relationship": {
                    "role_ENDS_WITH": "Gump"
                }
            }
        }
    }
}
```

---

### NOT_ENDS_WITH

**GraphQL input**

```graphql
query {
    movies {
        title
        actorsConnection(
            where: { relationship: { role_NOT_ENDS_WITH: "Gump" } }
        ) {
            edges {
                role
                node {
                    name
                }
            }
        }
    }
}
```

**Expected Cypher output**

```cypher
MATCH (this:Movie)
CALL {
    WITH this
    MATCH (this)<-[this_acted_in:ACTED_IN]-(this_actor:Actor)
    WHERE (NOT this_acted_in.role ENDS WITH $this_actorsConnection.args.where.relationship.role_NOT_ENDS_WITH)
    WITH collect({ role: this_acted_in.role, node: { name: this_actor.name } }) AS edges
    RETURN { edges: edges } AS actorsConnection
}
RETURN this { .title, actorsConnection } as this
```

**Expected Cypher params**

```cypher-params
{
    "this_actorsConnection": {
        "args": {
            "where": {
                "relationship": {
                    "role_NOT_ENDS_WITH": "Gump"
                }
            }
        }
    }
}
```

---

### MATCHES

**GraphQL input**

```graphql
query {
    movies {
        title
        actorsConnection(
            where: { relationship: { role_MATCHES: "Forrest.+" } }
        ) {
            edges {
                role
                node {
                    name
                }
            }
        }
    }
}
```

**Expected Cypher output**

```cypher
MATCH (this:Movie)
CALL {
    WITH this
    MATCH (this)<-[this_acted_in:ACTED_IN]-(this_actor:Actor)
    WHERE this_acted_in.role =~ $this_actorsConnection.args.where.relationship.role_MATCHES
    WITH collect({ role: this_acted_in.role, node: { name: this_actor.name } }) AS edges
    RETURN { edges: edges } AS actorsConnection
}
RETURN this { .title, actorsConnection } as this
```

**Expected Cypher params**

```cypher-params
{
    "this_actorsConnection": {
        "args": {
            "where": {
                "relationship": {
                    "role_MATCHES": "Forrest.+"
                }
            }
        }
    }
}
```

---
