## Relationship Properties Connect Cypher

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
  screenTime: Int!
}
```

---

### Create movie while connecting a relationship that has properties

**GraphQL input**

```graphql
mutation {
    createMovies(
        input: [
            {
                title: "Forrest Gump"
                actors: { connect: [{ properties: { screenTime: 60 } }] }
            }
        ]
    ) {
        movies {
            title
            actorsConnection {
                edges {
                    screenTime
                    node {
                        name
                    }
                }
            }
        }
    }
}
```

**Expected Cypher output**

```cypher
CALL {
    CREATE (this0:Movie)
    SET this0.title = $this0_title
    WITH this0
    OPTIONAL MATCH (this0_actors_connect0_node:Actor)
    FOREACH(_ IN CASE this0_actors_connect0_node WHEN NULL THEN [] ELSE [1] END |
        MERGE (this0)<-[this0_actors_connect0_relationship:ACTED_IN]-(this0_actors_connect0_node)
        SET this0_actors_connect0_relationship.screenTime = $this0_actors_connect0_relationship_screenTime
    )
    RETURN this0
}
CALL {
    WITH this0
    MATCH (this0)<-[this0_acted_in:ACTED_IN]-(this0_actor:Actor)
    WITH collect({ screenTime: this0_acted_in.screenTime, node: { name: this0_actor.name } }) AS edges
    RETURN { edges: edges } AS actorsConnection
}

RETURN
this0 { .title, actorsConnection } AS this0
```

**Expected Cypher params**

```cypher-params
{
  "this0_title": "Forrest Gump",
  "this0_actors_connect0_relationship_screenTime": {
    "low": 60,
    "high": 0
  }
}
```

---

### Create movie while connecting a relationship that has properties(with where on node)

**GraphQL input**

```graphql
mutation {
    createMovies(
        input: [
            {
                title: "Forrest Gump"
                actors: {
                    connect: [
                        {
                            where: { name: "Tom Hanks" }
                            properties: { screenTime: 60 }
                        }
                    ]
                }
            }
        ]
    ) {
        movies {
            title
            actorsConnection {
                edges {
                    screenTime
                    node {
                        name
                    }
                }
            }
        }
    }
}
```

**Expected Cypher output**

```cypher
CALL {
    CREATE (this0:Movie)
    SET this0.title = $this0_title
    WITH this0
    OPTIONAL MATCH (this0_actors_connect0_node:Actor)
    WHERE this0_actors_connect0_node.name = $this0_actors_connect0_node_name
    FOREACH(_ IN CASE this0_actors_connect0_node WHEN NULL THEN [] ELSE [1] END |
        MERGE (this0)<-[this0_actors_connect0_relationship:ACTED_IN]-(this0_actors_connect0_node)
        SET this0_actors_connect0_relationship.screenTime = $this0_actors_connect0_relationship_screenTime
    )
    RETURN this0
}
CALL {
    WITH this0
    MATCH (this0)<-[this0_acted_in:ACTED_IN]-(this0_actor:Actor)
    WITH collect({ screenTime: this0_acted_in.screenTime, node: { name: this0_actor.name } }) AS edges
    RETURN { edges: edges } AS actorsConnection
}

RETURN
this0 { .title, actorsConnection } AS this0
```

**Expected Cypher params**

```cypher-params
{
  "this0_title": "Forrest Gump",
  "this0_actors_connect0_node_name": "Tom Hanks",
  "this0_actors_connect0_relationship_screenTime": {
    "low": 60,
    "high": 0
  }
}
```

---

### Update a movie while connecting a relationship that has properties(top level-connect)

**GraphQL input**

```graphql
mutation {
    updateMovies(
        where: { title: "Forrest Gump" }
        connect: { actors: { properties: { screenTime: 60 } } }
    ) {
        movies {
            title
            actorsConnection {
                edges {
                    screenTime
                    node {
                        name
                    }
                }
            }
        }
    }
}
```

**Expected Cypher output**

```cypher
MATCH (this:Movie)
WHERE this.title = $this_title
WITH this
OPTIONAL MATCH (this_connect_actors0_node:Actor)
FOREACH(_ IN CASE this_connect_actors0_node WHEN NULL THEN [] ELSE [1] END |
    MERGE (this)<-[this_connect_actors0_relationship:ACTED_IN]-(this_connect_actors0_node)
    SET this_connect_actors0_relationship.screenTime = $this_connect_actors0_relationship_screenTime
)
WITH this
CALL {
    WITH this
    MATCH (this)<-[this_acted_in:ACTED_IN]-(this_actor:Actor)
    WITH collect({ screenTime: this_acted_in.screenTime, node: { name: this_actor.name } }) AS edges
    RETURN { edges: edges } AS actorsConnection
}
RETURN this { .title, actorsConnection } AS this
```

**Expected Cypher params**

```cypher-params
{
  "this_title": "Forrest Gump",
  "this_connect_actors0_relationship_screenTime": {
    "low": 60,
    "high": 0
  }
}
```

---

### Update a movie while connecting a relationship that has properties(top level-connect)(with where on node)

**GraphQL input**

```graphql
mutation {
    updateMovies(
        where: { title: "Forrest Gump" }
        connect: {
            actors: {
                where: { name: "Tom Hanks" }
                properties: { screenTime: 60 }
            }
        }
    ) {
        movies {
            title
            actorsConnection {
                edges {
                    screenTime
                    node {
                        name
                    }
                }
            }
        }
    }
}
```

**Expected Cypher output**

```cypher
MATCH (this:Movie)
WHERE this.title = $this_title
WITH this
OPTIONAL MATCH (this_connect_actors0_node:Actor)
WHERE this_connect_actors0_node.name = $this_connect_actors0_node_name
FOREACH(_ IN CASE this_connect_actors0_node WHEN NULL THEN [] ELSE [1] END |
    MERGE (this)<-[this_connect_actors0_relationship:ACTED_IN]-(this_connect_actors0_node)
    SET this_connect_actors0_relationship.screenTime = $this_connect_actors0_relationship_screenTime
)
WITH this
CALL {
    WITH this
    MATCH (this)<-[this_acted_in:ACTED_IN]-(this_actor:Actor)
    WITH collect({ screenTime: this_acted_in.screenTime, node: { name: this_actor.name } }) AS edges
    RETURN { edges: edges } AS actorsConnection
}
RETURN this { .title, actorsConnection } AS this
```

**Expected Cypher params**

```cypher-params
{
  "this_title": "Forrest Gump",
  "this_connect_actors0_node_name": "Tom Hanks",
  "this_connect_actors0_relationship_screenTime": {
    "low": 60,
    "high": 0
  }
}
```

---
