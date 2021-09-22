# Interface Relationships - Update create

Tests Cypher output for interface relationship fields

Schema:

```graphql
interface Production {
    title: String!
}

type Movie implements Production {
    title: String!
    runtime: Int!
}

type Series implements Production {
    title: String!
    episodes: Int!
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

## Update update an interface relationship

### GraphQL Input

```graphql
mutation {
    updateActors(
        update: { actedIn: { where: { node: { title: "Old Title" } }, update: { node: { title: "New Title" } } } }
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
    OPTIONAL MATCH (this)-[this_acted_in0_relationship:ACTED_IN]->(this_actedIn0:Movie)
    WHERE this_actedIn0.title = $updateActors.args.update.actedIn[0].where.node.title
    CALL apoc.do.when(this_actedIn0 IS NOT NULL, " SET this_actedIn0.title = $this_update_actedIn0_title RETURN count(*) ", "", {this:this, updateActors: $updateActors, this_actedIn0:this_actedIn0, auth:$auth,this_update_actedIn0_title:$this_update_actedIn0_title}) YIELD value as _
    RETURN count(*)
UNION
    WITH this
    OPTIONAL MATCH (this)-[this_acted_in0_relationship:ACTED_IN]->(this_actedIn0:Series) WHERE this_actedIn0.title = $updateActors.args.update.actedIn[0].where.node.title
    CALL apoc.do.when(this_actedIn0 IS NOT NULL, " SET this_actedIn0.title = $this_update_actedIn0_title RETURN count(*) ", "", {this:this, updateActors: $updateActors, this_actedIn0:this_actedIn0, auth:$auth,this_update_actedIn0_title:$this_update_actedIn0_title}) YIELD value as _
    RETURN count(*)
}
RETURN this { .name } AS this
```

### Expected Cypher Params

```json
{
    "auth": {
        "isAuthenticated": true,
        "jwt": {},
        "roles": []
    },
    "this_update_actedIn0_title": "New Title",
    "updateActors": {
        "args": {
            "update": {
                "actedIn": [
                    {
                        "update": {
                            "node": {
                                "title": "New Title"
                            }
                        },
                        "where": {
                            "node": {
                                "title": "Old Title"
                            }
                        }
                    }
                ]
            }
        }
    }
}
```

---

'MATCH (this:Actor)\n
WHERE this.name = \$this_name\n

CREATE (this_create_actedIn0_node_Movie:Movie)\nSET this_create_actedIn0_node_Movie.title = $this_create_actedIn0_node_Movie_title\nSET this_create_actedIn0_node_Movie.runtime = $this_create_actedIn0_node_Movie_runtime\nMERGE (this)-[this_create_actedIn0_relationship:ACTED_IN]->(this_create_actedIn0_node_Movie)\nSET this_create_actedIn0_relationship.screenTime = \$this_create_actedIn0_relationship_screenTime\n

CREATE (this_create_actedIn0_node_Series:Ser…ies)\nSET this_create_actedIn0_relationship.screenTime = \$this_create_actedIn0_relationship_screenTime\nWITH this\nCALL {\nWITH this\nMATCH (this)-[:ACTED_IN]->(this_Movie:Movie)\nRETURN { **resolveType: "Movie", title: this_Movie.title, runtime: this_Movie.runtime } AS actedIn\nUNION\nWITH this\nMATCH (this)-[:ACTED_IN]->(this_Series:Series)\nRETURN { **resolveType: "Series", title: this_Series.title, episodes: this_Series.episodes } AS actedIn\n}\nRETURN this { .name, actedIn: collect(actedIn) } AS this'
