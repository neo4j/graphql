# Connect on Update

## Problem

Connect in update mutation always merges existing relationship between current and connected node. There should be a possibility to create a new relationship (of the same type).

### Existing Solution

For the following type defs:

```gql
type Client {
    id: String!
    login: String!
    sponsor: [Client] @relationship(type: "HAS_SPONSOR", properties: "HasSponsor", direction: OUT)
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
    updateClients(where: { login: "x5" }, 
        update: {
            type: "Ambassador", 
            sponsor: {
                connect: {
                    where: {
                        node: { login: "x2" }
                    },
                    edge: {
                        type: "Ambassador",
                        startDate: "2022-04-15"
                    }
                }
            }
        }
    ) {
        clients {
            id
        }
    }
}
```

Would merge an existing "HAS_SPONSOR" relation, overwriting the old relation with the properties provided in the `edge` input.

### Questions

* What should be the default behaviour? Existing MERGE behaviour? Or always create a new relationship?
* How would this be presented in query results? One of each, or list all of the individual related nodes?
* How would disconnect work? Disconnect one or disconnect all?
* How do aggregations work? Do we aggregate across all relationships, or just one?

## Proposed Solution

* Add the possibility to create new connections, instead of always overwriting existing relationships.
* The existing default behaviour should be kept the same for now to avoid a breaking change.
* It should be possible to overwrite the default behaviour when specifying the `@relationship` directive. This can be achieved with a `defaultUpdateOperation` argument that accepts either CREATE or UPDATE. This should be defaulted to UPDATE to avoid breaking changes.
* Provide the option to the user to make use of either behaviour at query time. This can be achieved with an `operation` argument on to the `connect` input that accepts either CREATE or UPDATE. If this argument is not provided, maintain the default behaviour defined by `defaultUpdateOperation`.
* If there are several connections of the same type, to the same nodes, these should be represented with the nodes being returned multiple times in the response.
* To maintain consistency with returning duplicate nodes if multiple relationships, aggregetions should be accross all relationships.
* Disconnect should disconnect as relations that meet the query filters (e.g. could use limit 1 to make it delete only a single relationship).

### Usage Examples

Using the new `operation` argument:

```gql
mutation {
    updateClients(where: { login: "x5" }, 
        update: {
            type: "Ambassador", 
            sponsor: {
                connect: {
                    operation: "CREATE", # The new operation input argument that accepts either CREATE or UPDATE
                    where: {
                        node: { login: "x2" }
                    },
                    edge: {
                        type: "Ambassador",
                        startDate: "2022-04-15"
                    }
                }
            }
        }
    ) {
        clients {
            id
        }
    }
}
```

Specifying the `defaultUpdateOperation` on the `@relationship` directive:

```gql
type Client {
    id: String!
    login: String!
    sponsor: [Client] @relationship(type: "HAS_SPONSOR", properties: "HasSponsor", direction: OUT, defaultUpdateOperation: "CREATE")
}

interface HasSponsor @relationshipProperties {
    type: String!
    startDate: Date!
    endDate: Date
}
```

## Risks

* Adding extra complexity to our API.
* Unclear to users what behaviour to expect/how to use these new features - will need good documentation and examples.

### Security consideration

Please take some time to think about potential security issues/considerations for the proposed solution.
For example: How can a malicious user abuse this? How can we prevent that in such case?

## Out of Scope

* Changing the default behaviour - the initial version of these changes should avoid anything breaking.
