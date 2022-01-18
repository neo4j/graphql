# Undirected Relationship Queries

## Problem

Currently, all queries with relationships are translated with direction:

```cypher
MATCH(u:User)-[:ASSOCIATES_WITH]->(a:User)
```

However, we don't have a way for users to specify an undirected relationship in a query:

```cypher
MATCH(u:User)-[:ASSOCIATES_WITH]-(a:User)
```

This is reported in [issue 142](https://github.com/neo4j/graphql/issues/142) as well as in [Discord](https://discord.com/channels/787399249741479977/818578492723036210/831551053379797074).

## Proposed Solution

This solution involves providing an opt-in way for performing a query without defining relationship direction, by adding a parameter in the **query** field defining the direction:

```graphql
type User {
    name: String!
    friends: [User!]! @relationship(type: "FRIENDS_WITH", direction: OUT)
}
```

This way, the following query:

```graphql
query {
    users {
        name
        friends: friends(directed: false) {
            name
        }
        directedFriends: friends {
            name
        }
    }
}
```

Results in the Cypher:

```cypher
MATCH (this:User)
RETURN this { .name,
	   friends: [ (this)-[:FRIENDS_WITH]-(this_friends:User)   | this_friends1 { .name } ],
	   directedFriends: [ (this)-[:FRIENDS_WITH]->(this_directedFriends:User)   | this_friends2 { .name } ]
} as this
```

### `queryDirection` option

`queryDirection` is an optional parameter in the type definitions should define the default and allowed behaviours of query direction, for example:

```graphql
type User {
    name: String!
    friends: [User!]! @relationship(type: "FRIENDS_WITH", direction: OUT, queryDirection: DEFAULT_DIRECTED)
}
```

`queryDirection` is an enum that can be:

-   `DEFAULT_DIRECTED` (_default_) - All queries are directed by default, but `directed: false` option is available in queries.
-   `DEFAULT_UNDIRECTED` - All queries are undirected by default, but `directed: true` option is available in queries.
-   `DIRECTED_ONLY` - All queries are directed (as of `2.5.3`, this is the default behaviour).
-   `UNDIRECTED_ONLY` - All queries are undirected.

## Risks

-   New security considerations for users, as undirected relationship queries will now be possible.
-   We use relationship direction in a lot of different places in the code - risk that we change or remove the direction where we shouldn't.

## Technical considerations

-   Any undirected queries should be opt-in.
-   `queryDirection` default value (`DEFAULT_DIRECTED` vs `DIRECTED_ONLY`).
-   `directed` vs `undirected` parameter.

## Out of Scope

-   **undirected mutations**: A direction needs to be specified and used for mutation.

## Discarded Solutions

### Both direction

Allow the use of `BOTH` or `NONE` for no relationship direction.

```graphql
type User {
    name: String!
    friends: [User!]! @relationship(type: "FRIENDS_WITH", direction: BOTH)
}
```

The following query:

```graphql
query {
    users {
        name
        friends {
            name
        }
    }
}
```

Produces the Cypher:

```cypher
MATCH (this:User)
RETURN this { .name, friends: [ (this)-[:FRIENDS_WITH]-(this_friends:User)   | this_friends { .name } ] } as this
```

In this example, mutations are not available for `User.friends` , creating or updating this relation requires a separate relation with the same name and direction defined in the types with the same type:

```graphql
type User {
    name: String!
    friends: [User!]! @relationship(type: "FRIENDS_WITH", direction: BOTH)
    friendsDirected: [User!]! @relationship(type: "FRIENDS_WITH", direction: OUT)
}
```

### Undirected by default

Do not define a direction to create an undirected relationship:

```graphql
type User {
    name: String!
    associates: [User!]! @relationship(name: "ASSOCIATES_WITH")
}
```

This solution behaves exactly like solution 1, but only when no direction is defined.

> This solution is **not** breaking, but being the default value may lead to unexpected behaviour by our users.

### `undirectedQueryField` parameter in typedefs

Add an argument `undirectedQueryField` to use undirected query in this field:

```graphql
type User {
    name: String!
    friends: [User!]! @relationship(type: "FRIENDS_WITH", direction: OUT, undirectedQueryField: true)
}
```

In this solution, all mutations behave as previously (using the direction defined), but all queries to friends will ignore direction:

**Mutation**

The following mutation:

```graphql
mutation {
    createUsers(input: { name: "Ford", friends: { connect: { where: { node: { name: "Ford" } } } } }) {
        info {
            nodesCreated
        }
    }
}
```

Produces the Cypher:

```cypher
# ...
MERGE (this0)-[:FRIENDS_WITH]->(this0_friends_connect0_node)
# ...
```

**Query**

The following query:

```graphql
query {
    users {
        name
        friends {
            name
        }
    }
}
```

Produces the Cypher:

```cypher
MATCH (this:User)
RETURN this { .name, friends: [ (this)-[:FRIENDS_WITH]-(this_friends:User)   | this_friends { .name } ] } as this
```
