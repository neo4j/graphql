# Create new relationship on update mutations if relationship already exists

## Problem

Connect in update mutation always merges existing relationship between current and connected node. There should be a possibility to create a new relationship (of the same type).

### Existing Solution

For the following type defs:

```gql
type Client {
    id: String!
    login: String!
    sponsor: [Client!]! @relationship(type: "HAS_SPONSOR", properties: "HasSponsor", direction: OUT)
}

interface HasSponsor @relationshipProperties {
    type: String!
    startDate: Date!
    endDate: Date
}
```

The following query:

```gql
mutation {
    updateClients(
        where: {
            id: "1",
        },
        connect: {
            sponsor: [
                {
                    where: {
                        node: {
                            id: "2"
                        }
                    },
                    edge: {
                        type: "newType",
                        startDate: "123"
                    }
                }
            ]
        }
    ) {
        clients {
            id
        }
    }
}
```

Would produce the following cypher:

```cypher
MATCH (this:Client)
WHERE this.id = "1"
WITH this
CALL {
    WITH this
    OPTIONAL MATCH (this_connect_sponsor0_node:Client)
    WHERE this_connect_sponsor0_node.id = "2"
    CALL {
        WITH *
        WITH collect(this_connect_sponsor0_node) as connectedNodes, collect(this) as parentNodes
        UNWIND parentNodes as this
        UNWIND connectedNodes as this_connect_sponsor0_node
        MERGE (this)-[this_connect_sponsor0_relationship:HAS_SPONSOR]->(this_connect_sponsor0_node) # This is the line that causes the relationship to be overwritten instead of a new one being created
        SET this_connect_sponsor0_relationship.type = "newType"
        SET this_connect_sponsor0_relationship.startDate = "0123-01-01"
        RETURN count(*) AS _
    }
    RETURN count(*) AS connect_this_connect_sponsor_Client
}
WITH *
RETURN collect(DISTINCT this { .id }) AS data
```

This would merge an existing "HAS_SPONSOR" relation, overwriting the old relation with the properties provided in the `edge` input.

### Questions

* What should be the default behaviour? Existing MERGE behaviour? Or always create a new relationship?
* How would this be presented in query results? One of each, or list all of the individual related nodes?
* How would disconnect work? Disconnect one or disconnect all?
* How do aggregations work? Do we aggregate across all relationships, or just one?

## Proposed Solution

* Add the possibility to create new connections, instead of always overwriting existing relationships.
* The existing default behaviour should be kept the same for now to avoid a breaking change.
* It should be possible to overwrite the default behaviour when specifying the `@relationship` directive. This can be achieved with a `allowDuplicates` argument that accepts a boolean. This should be defaulted to `false` to avoid breaking changes.
* Provide the option to the user to make use of either behaviour at query time. This can be achieved with an `allowDuplicates` argument on each item of the `connect` input that accepts a boolean. If this argument is not provided, maintain the default behaviour defined on the directive.
* If there are several connections of the same type, to the same nodes, these should be represented with the nodes being returned multiple times in the response. This is already the current behaviour.
* To maintain consistency with returning duplicate nodes if multiple relationships, aggregations should be across all relationships. This is already the current behaviour.
* Disconnect should disconnect all relations that meet the query filters (e.g. could use limit 1 to make it delete only a single relationship). This is already the current behaviour.

### Usage Examples

#### `@relationship` definition

Specifying the `defaultUpdateOperation` on the `@relationship` directive:

```gql
type Client {
    id: String!
    login: String!
    sponsor: [Client!]! @relationship(type: "HAS_SPONSOR", properties: "HasSponsor", direction: OUT, allowDuplicates: true)
}

interface HasSponsor @relationshipProperties {
    type: String!
    startDate: Date!
    endDate: Date
}
```

#### New update mutation

Using the new `operation` argument:

```gql
mutation {
    updateClients(
        where: {
            id: "1",
        },
        connect: {
            sponsor: [
                {
                    where: {
                        node: {
                            id: "2"
                        }
                    },
                    edge: {
                        type: "newType2",
                        startDate: "123"
                    },
                    allowDuplicates: true, # The new argument
                },
                                {
                    where: {
                        node: {
                            id: "2"
                        }
                    },
                    edge: {
                        type: "newType2",
                        startDate: "123"
                    },
                    allowDuplicates: false, # The new argument
                }
            ]
        }
    ) {
        clients {
            id
        }
    }
}
```

For this query the following cypher would be produced:

```cypher
MATCH (this:Client)
WHERE this.id = "1"
WITH this
CALL {
    WITH this
    OPTIONAL MATCH (this_connect_sponsor0_node:Client)
    WHERE this_connect_sponsor0_node.id = "2"
    CALL {
        WITH *
        WITH collect(this_connect_sponsor0_node) as connectedNodes, collect(this) as parentNodes
        UNWIND parentNodes as this
        UNWIND connectedNodes as this_connect_sponsor0_node
        CREATE (this)-[this_connect_sponsor0_relationship:HAS_SPONSOR]->(this_connect_sponsor0_node) # Note: this is now a CREATE, instead of a MERGE as it was previously
        SET this_connect_sponsor0_relationship.type = "newType2"
        SET this_connect_sponsor0_relationship.startDate = "0123-01-01"
        RETURN count(*) AS _
    }
    RETURN count(*) AS connect_this_connect_sponsor_Client
}
WITH *
RETURN collect(DISTINCT this { .id }) AS data
```

#### New query behaviour

**Note:** this is already the behaviour of the library, these examples are just to document this is now the expected behaviour.

Assuming there was an existing HAS_SPONSOR relation between the clients with id = 1 and id = 2. The following query:

```gql
query {
    clients(where: { id: "1" }) {
        id
        sponsorConnection {
            edges {
                type
                node {
                    id
                }
            }
        }
    }
}
```

Would now produce the following results:

```json
{
    "data": {
        "clients": [
            {
                "id": "123",
                "sponsorConnection": {
                    "edges": [
                        {
                            "type": "newType2",
                            "node": {
                                "id": "2"
                            }
                        },
                        {
                            "type": "newType",
                            "node": {
                                "id": "2"
                            }
                        },
                    ]
                }
            }
        ]
    }
}
```

Additionally, the following query:

```gql
query {
  clients(where: { id: "1" }) {
    sponsor {
      id
    }
    id
  }
}
```

Would produce the following results:

```json
{
    "data": {
        "clients": [
            {
                "sponsor": [
                    {
                        "id": "2"
                    },
                    {
                        "id": "2"
                    },
                ],
                "id": "1"
            }
        ]
    }
}
```

## Risks

* Adding extra complexity to our API.
* Unclear to users what behaviour to expect/how to use these new features - will need good documentation and examples.

### Security consideration

* Injection on new inputs - these should be enums and not passed directly to cypher.
* How does this play with `@auth`? - include tests to ensure auth checks still work?
* DoS - spamming many relationships. This kind of attack is not unique to creating new relationships and needs considerations at the library level.

## Out of Scope

* Changing the default behaviour - the initial version of these changes should avoid anything breaking. If we decide creating new connections is the desired behaviour, that change should be made as part of 4.0.
