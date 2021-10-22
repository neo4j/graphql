# Interface Relationships - Update connect

Tests Cypher output for interface relationship fields

Schema:

```graphql
interface Production {
    title: String!
    actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN, properties: "ActedIn")
}

type Movie implements Production {
    title: String!
    runtime: Int!
    actors: [Actor!]!
}

type Series implements Production {
    title: String!
    episodes: Int!
    actors: [Actor!]!
}

interface ActedIn @relationshipProperties {
    screenTime: Int!
}

type Actor {
    name: String!
    actedIn: [Production!]! @relationship(type: "ACTED_IN", direction: OUT, properties: "ActedIn")
}
```

---

## Update connect to an interface relationship

### GraphQL Input

```graphql
mutation {
    updateActors(connect: { actedIn: { edge: { screenTime: 90 }, where: { node: { title_STARTS_WITH: "The " } } } }) {
        actors {
            name
        }
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Actor)
WITH this
CALL {
    WITH this
    OPTIONAL MATCH (this_connect_actedIn0_node:Movie)
    WHERE this_connect_actedIn0_node.title STARTS WITH $this_connect_actedIn0_node_title_STARTS_WITH
    FOREACH(_ IN CASE this WHEN NULL THEN [] ELSE [1] END |
        FOREACH(_ IN CASE this_connect_actedIn0_node WHEN NULL THEN [] ELSE [1] END |
            MERGE (this)-[this_connect_actedIn0_relationship:ACTED_IN]->(this_connect_actedIn0_node)
            SET this_connect_actedIn0_relationship.screenTime = $this_connect_actedIn0_relationship_screenTime
        )
    )
    RETURN count(*)
UNION
    WITH this
    OPTIONAL MATCH (this_connect_actedIn0_node:Series)
    WHERE this_connect_actedIn0_node.title STARTS WITH $this_connect_actedIn0_node_title_STARTS_WITH
    FOREACH(_ IN CASE this WHEN NULL THEN [] ELSE [1] END |
        FOREACH(_ IN CASE this_connect_actedIn0_node WHEN NULL THEN [] ELSE [1] END |
            MERGE (this)-[this_connect_actedIn0_relationship:ACTED_IN]->(this_connect_actedIn0_node)
            SET this_connect_actedIn0_relationship.screenTime = $this_connect_actedIn0_relationship_screenTime
        )
    )
    RETURN count(*)
}
RETURN this { .name } AS this
```

### Expected Cypher Params

```json
{
    "this_connect_actedIn0_node_title_STARTS_WITH": "The ",
    "this_connect_actedIn0_relationship_screenTime": {
        "high": 0,
        "low": 90
    }
}
```

---

## Update connect to an interface relationship and nested connect

### GraphQL Input

```graphql
mutation {
    updateActors(
        connect: {
            actedIn: {
                edge: { screenTime: 90 }
                where: { node: { title_STARTS_WITH: "The " } }
                connect: { actors: { edge: { screenTime: 90 }, where: { node: { name: "Actor" } } } }
            }
        }
    ) {
        actors {
            name
        }
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Actor)
WITH this
CALL {
    WITH this
    OPTIONAL MATCH (this_connect_actedIn0_node:Movie)
    WHERE this_connect_actedIn0_node.title STARTS WITH $this_connect_actedIn0_node_title_STARTS_WITH
    FOREACH(_ IN CASE this WHEN NULL THEN [] ELSE [1] END |
        FOREACH(_ IN CASE this_connect_actedIn0_node WHEN NULL THEN [] ELSE [1] END |
            MERGE (this)-[this_connect_actedIn0_relationship:ACTED_IN]->(this_connect_actedIn0_node)
            SET this_connect_actedIn0_relationship.screenTime = $this_connect_actedIn0_relationship_screenTime
        )
    )
    WITH this, this_connect_actedIn0_node
    CALL {
        WITH this, this_connect_actedIn0_node
        OPTIONAL MATCH (this_connect_actedIn0_node_actors0_node:Actor)
        WHERE this_connect_actedIn0_node_actors0_node.name = $this_connect_actedIn0_node_actors0_node_name
        FOREACH(_ IN CASE this_connect_actedIn0_node WHEN NULL THEN [] ELSE [1] END |
            FOREACH(_ IN CASE this_connect_actedIn0_node_actors0_node WHEN NULL THEN [] ELSE [1] END |
                MERGE (this_connect_actedIn0_node)<-[this_connect_actedIn0_node_actors0_relationship:ACTED_IN]-(this_connect_actedIn0_node_actors0_node)
                SET this_connect_actedIn0_node_actors0_relationship.screenTime = $this_connect_actedIn0_node_actors0_relationship_screenTime
            )
        )
        RETURN count(*)
    }
    RETURN count(*)
UNION
    WITH this
    OPTIONAL MATCH (this_connect_actedIn0_node:Series)
    WHERE this_connect_actedIn0_node.title STARTS WITH $this_connect_actedIn0_node_title_STARTS_WITH
    FOREACH(_ IN CASE this WHEN NULL THEN [] ELSE [1] END |
        FOREACH(_ IN CASE this_connect_actedIn0_node WHEN NULL THEN [] ELSE [1] END |
            MERGE (this)-[this_connect_actedIn0_relationship:ACTED_IN]->(this_connect_actedIn0_node)
            SET this_connect_actedIn0_relationship.screenTime = $this_connect_actedIn0_relationship_screenTime
        )
    )
    WITH this, this_connect_actedIn0_node
    CALL {
        WITH this, this_connect_actedIn0_node
        OPTIONAL MATCH (this_connect_actedIn0_node_actors0_node:Actor)
        WHERE this_connect_actedIn0_node_actors0_node.name = $this_connect_actedIn0_node_actors0_node_name
        FOREACH(_ IN CASE this_connect_actedIn0_node WHEN NULL THEN [] ELSE [1] END |
            FOREACH(_ IN CASE this_connect_actedIn0_node_actors0_node WHEN NULL THEN [] ELSE [1] END |
                MERGE (this_connect_actedIn0_node)<-[this_connect_actedIn0_node_actors0_relationship:ACTED_IN]-(this_connect_actedIn0_node_actors0_node)
                SET this_connect_actedIn0_node_actors0_relationship.screenTime = $this_connect_actedIn0_node_actors0_relationship_screenTime
            )
        )
        RETURN count(*)
    }
    RETURN count(*)
}
RETURN this { .name } AS this
```

### Expected Cypher Params

```json
{
    "this_connect_actedIn0_node_title_STARTS_WITH": "The ",
    "this_connect_actedIn0_relationship_screenTime": {
        "high": 0,
        "low": 90
    },
    "this_connect_actedIn0_node_actors0_node_name": "Actor",
    "this_connect_actedIn0_node_actors0_relationship_screenTime": {
        "high": 0,
        "low": 90
    }
}
```

---

## Update connect to an interface relationship and nested connect using \_on to connect only one implementation

### GraphQL Input

```graphql
mutation {
    updateActors(
        connect: {
            actedIn: {
                edge: { screenTime: 90 }
                where: { node: { title_STARTS_WITH: "The " } }
                connect: {
                    _on: { Movie: { actors: { edge: { screenTime: 90 }, where: { node: { name: "Actor" } } } } }
                }
            }
        }
    ) {
        actors {
            name
        }
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Actor)
WITH this
CALL {
    WITH this
    OPTIONAL MATCH (this_connect_actedIn0_node:Movie)
    WHERE this_connect_actedIn0_node.title STARTS WITH $this_connect_actedIn0_node_title_STARTS_WITH
    FOREACH(_ IN CASE this WHEN NULL THEN [] ELSE [1] END |
        FOREACH(_ IN CASE this_connect_actedIn0_node WHEN NULL THEN [] ELSE [1] END |
            MERGE (this)-[this_connect_actedIn0_relationship:ACTED_IN]->(this_connect_actedIn0_node)
            SET this_connect_actedIn0_relationship.screenTime = $this_connect_actedIn0_relationship_screenTime
        )
    )
    WITH this, this_connect_actedIn0_node
    CALL {
        WITH this, this_connect_actedIn0_node
        OPTIONAL MATCH (this_connect_actedIn0_node_on_Movie0_actors0_node:Actor)
        WHERE this_connect_actedIn0_node_on_Movie0_actors0_node.name = $this_connect_actedIn0_node_on_Movie0_actors0_node_name
        FOREACH(_ IN CASE this_connect_actedIn0_node WHEN NULL THEN [] ELSE [1] END |
            FOREACH(_ IN CASE this_connect_actedIn0_node_on_Movie0_actors0_node WHEN NULL THEN [] ELSE [1] END |
                MERGE (this_connect_actedIn0_node)<-[this_connect_actedIn0_node_on_Movie0_actors0_relationship:ACTED_IN]-(this_connect_actedIn0_node_on_Movie0_actors0_node)
                SET this_connect_actedIn0_node_on_Movie0_actors0_relationship.screenTime = $this_connect_actedIn0_node_on_Movie0_actors0_relationship_screenTime
            )
        )
        RETURN count(*)
    }
    RETURN count(*)
UNION
    WITH this
    OPTIONAL MATCH (this_connect_actedIn0_node:Series)
    WHERE this_connect_actedIn0_node.title STARTS WITH $this_connect_actedIn0_node_title_STARTS_WITH
    FOREACH(_ IN CASE this WHEN NULL THEN [] ELSE [1] END |
        FOREACH(_ IN CASE this_connect_actedIn0_node WHEN NULL THEN [] ELSE [1] END |
            MERGE (this)-[this_connect_actedIn0_relationship:ACTED_IN]->(this_connect_actedIn0_node)
            SET this_connect_actedIn0_relationship.screenTime = $this_connect_actedIn0_relationship_screenTime
        )
    )
    RETURN count(*)
}
RETURN this { .name } AS this
```

### Expected Cypher Params

```json
{
    "this_connect_actedIn0_node_title_STARTS_WITH": "The ",
    "this_connect_actedIn0_relationship_screenTime": {
        "high": 0,
        "low": 90
    },
    "this_connect_actedIn0_node_on_Movie0_actors0_node_name": "Actor",
    "this_connect_actedIn0_node_on_Movie0_actors0_relationship_screenTime": {
        "high": 0,
        "low": 90
    }
}
```

---

## Update connect to an interface relationship and nested connect using \_on to override connection

### GraphQL Input

```graphql
mutation {
    updateActors(
        connect: {
            actedIn: {
                edge: { screenTime: 90 }
                where: { node: { title_STARTS_WITH: "The " } }
                connect: {
                    actors: { edge: { screenTime: 90 }, where: { node: { name: "Actor" } } }
                    _on: {
                        Movie: { actors: { edge: { screenTime: 90 }, where: { node: { name: "Different Actor" } } } }
                    }
                }
            }
        }
    ) {
        actors {
            name
        }
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Actor)
WITH this
CALL {
    WITH this
    OPTIONAL MATCH (this_connect_actedIn0_node:Movie)
    WHERE this_connect_actedIn0_node.title STARTS WITH $this_connect_actedIn0_node_title_STARTS_WITH
    FOREACH(_ IN CASE this WHEN NULL THEN [] ELSE [1] END |
        FOREACH(_ IN CASE this_connect_actedIn0_node WHEN NULL THEN [] ELSE [1] END |
            MERGE (this)-[this_connect_actedIn0_relationship:ACTED_IN]->(this_connect_actedIn0_node)
            SET this_connect_actedIn0_relationship.screenTime = $this_connect_actedIn0_relationship_screenTime
        )
    )
    WITH this, this_connect_actedIn0_node
    CALL {
        WITH this, this_connect_actedIn0_node
        OPTIONAL MATCH (this_connect_actedIn0_node_on_Movie0_actors0_node:Actor)
        WHERE this_connect_actedIn0_node_on_Movie0_actors0_node.name = $this_connect_actedIn0_node_on_Movie0_actors0_node_name
        FOREACH(_ IN CASE this_connect_actedIn0_node WHEN NULL THEN [] ELSE [1] END |
            FOREACH(_ IN CASE this_connect_actedIn0_node_on_Movie0_actors0_node WHEN NULL THEN [] ELSE [1] END |
                MERGE (this_connect_actedIn0_node)<-[this_connect_actedIn0_node_on_Movie0_actors0_relationship:ACTED_IN]-(this_connect_actedIn0_node_on_Movie0_actors0_node)
                SET this_connect_actedIn0_node_on_Movie0_actors0_relationship.screenTime = $this_connect_actedIn0_node_on_Movie0_actors0_relationship_screenTime
            )
        )
        RETURN count(*)
    }
    RETURN count(*)
UNION
    WITH this
    OPTIONAL MATCH (this_connect_actedIn0_node:Series)
    WHERE this_connect_actedIn0_node.title STARTS WITH $this_connect_actedIn0_node_title_STARTS_WITH
    FOREACH(_ IN CASE this WHEN NULL THEN [] ELSE [1] END |
        FOREACH(_ IN CASE this_connect_actedIn0_node WHEN NULL THEN [] ELSE [1] END |
            MERGE (this)-[this_connect_actedIn0_relationship:ACTED_IN]->(this_connect_actedIn0_node)
            SET this_connect_actedIn0_relationship.screenTime = $this_connect_actedIn0_relationship_screenTime
        )
    )
    WITH this, this_connect_actedIn0_node
    CALL {
        WITH this, this_connect_actedIn0_node
        OPTIONAL MATCH (this_connect_actedIn0_node_actors0_node:Actor)
        WHERE this_connect_actedIn0_node_actors0_node.name = $this_connect_actedIn0_node_actors0_node_name
        FOREACH(_ IN CASE this_connect_actedIn0_node WHEN NULL THEN [] ELSE [1] END |
            FOREACH(_ IN CASE this_connect_actedIn0_node_actors0_node WHEN NULL THEN [] ELSE [1] END |
                MERGE (this_connect_actedIn0_node)<-[this_connect_actedIn0_node_actors0_relationship:ACTED_IN]-(this_connect_actedIn0_node_actors0_node)
                SET this_connect_actedIn0_node_actors0_relationship.screenTime = $this_connect_actedIn0_node_actors0_relationship_screenTime
            )
        )
        RETURN count(*)
    }
    RETURN count(*)
}
RETURN this { .name } AS this
```

### Expected Cypher Params

```json
{
    "this_connect_actedIn0_node_actors0_node_name": "Actor",
    "this_connect_actedIn0_node_actors0_relationship_screenTime": {
        "high": 0,
        "low": 90
    },
    "this_connect_actedIn0_node_on_Movie0_actors0_node_name": "Different Actor",
    "this_connect_actedIn0_node_on_Movie0_actors0_relationship_screenTime": {
        "high": 0,
        "low": 90
    },
    "this_connect_actedIn0_node_title_STARTS_WITH": "The ",
    "this_connect_actedIn0_relationship_screenTime": {
        "high": 0,
        "low": 90
    }
}
```
