# Cypher Based Hooks

## Problem

Due to the fact that Neo4j GraphQL generates a single Cypher statement, it’s difficult for users to ‘inject’ custom logic before or after an interaction with either a node or relationship. Injecting custom logic is common, and for example: ‘Audit Logs’ - Users may want to efficiently store a trail of events produced by their API consumers.

Not only is it difficult for users to inject custom logic but the logic that they do inject can never be 100% deterministic, and this is because, again, we generate a single Cypher statement! All the interactions with the database happen in one transaction, defined in one statement, and so any hook or plugin made will always execute outside of that transaction.

I believe, demonstrated in this RFC, we could use Cypher Hooks to not only; enforce and create relationships, validate properties, extend authentication, but also enable sophisticated patterns such as subscriptions.

## Proposed Solution

Expose two directives `pre` and `post` that enables users to declare custom Cypher, similar to how they would use the `@cypher` directive, and then a list of operations where that Cypher should be called.

1. pre
2. post

```gql
directive @pre(
    cypher: String!
    operations: [Operations!]! = [CREATE, READ, UPDATE, DELETE, DISCONNECT, CONNECT]
) on OBJECT

directive @post(
    cypher: String!
    operations: [Operations!]! = [CREATE, READ, UPDATE, DELETE, DISCONNECT, CONNECT]
) on OBJECT
```

### Usage Examples

#### Audit Logs

This is a real-world example! Most applications will at some point want to store a trail of events, and given that we have established that we don’t have a deterministic way of knowing if a node or relationship has been updated... The only logical and safe way would be to use a Cypher Hook. Given the schema below, there is a user and an audit node declared, with a relationship between them. The audit node is excluded from upserts and only created in the Hook.

```gql
type User
    @post(
        cypher: """
        CREATE (this)-[:HAS_AUDIT]->(a:Audit)
        SET a += {
            id: randomUUID(),
            createdAt: datetime(),
            msg: 'User updated',
            jwt: $auth.jwt.sub
        }
        """
        operations: [UPDATE]
    ) {
    id: ID! @id
    name: String!
    email: String!
    audits: [Audit!]! @relationship(type: "HAS_AUDIT", direction: OUT) @readonly
}

type Audit @exclude(operations: [CREATE, UPDATE, DELETE, CONNECT, DISCONNECT]) {
    id: ID!
    createdAt: DateTime!
    msg: String!
    jwt: String!
}
```

Notice two things:

1. The usage of `this` in the hook
2. The usage of the `$jwt` and implies `$context` variables.

Given that a user goes and preforms a GraphQL update mutation:

```gql
mutation {
    updateUsers(where: { name: "cat" }, update: { email: "cat@cat.com" }) {
        users {
            name
            email
        }
    }
}
```

The cypher produced using APOC would be along the lines of:

```gql
CALL {
    MATCH (u:User)
    WHERE u.name = "cat"
    SET u.email = "cat@cat.com"
    CALL apoc.cypher.runFirstColumn("
        CREATE (this)-[:HAS_AUDIT]->(a:Audit)
        SET a += {
            id: randomUUID(),
            createdAt: datetime(),
            msg: 'User updated',
            jwt: $auth.jwt.sub
        }
    ", { this: u, $auth: auth }, false)
    RETURN u
}
RETURN u { .name, .email } AS u
```

If we can get it to work without APOC even better:

```gql
CALL {
    MATCH (u:User)
    WHERE u.name = "cat"
    SET u.email = "cat@cat.com"
    CALL {
        WITH u AS this
        CREATE (this)-[:HAS_AUDIT]->(a:Audit)
        SET a += {
            id: randomUUID(),
            createdAt: datetime(),
            msg: 'User updated',
            jwt: $auth.jwt.sub
        }
        RETURN count(*)
    }
    RETURN u
}
RETURN u { .name, .email } AS u
```

#### Subscriptions

Once again because we produce a single Cypher statement and that Cypher statement could be 100's of lines in length, for example nested mutations, then making a plugin that can both read that Cypher and then deterministically publish events based on that Cypher is in my opinion not a production worthy solution! The only place you can guarantee something happened is from within the database itself, that's of course if you don't want to ask your users, or have the library, to poll for changes causing all sorts of complexity problems!

You can use a APOC method called [`jsonParams`](https://neo4j.com/labs/apoc/4.2/overview/apoc.load/apoc.load.jsonParams/) that enables you to make a HTTP call to a given endpoint from within Cypher. Below I use a Hook and then inside the custom Cypher I use the APOC method to trigger a callback to my GraphQL API. The endpoint that is triggered on that callback simply publishes to my PubSub instance feeding any GraphQL subscribers.

**typeDefs**

```gql
type User
    @post(
        cypher: """
        WITH
        'http://MY_PUBSUB_API/subscription-callback/'+ apoc.text.urlencode(this.id) AS callback
        {} AS headers,
        "" AS payload,
        "" AS path

        CALL apoc.load.jsonParams(
            callback,
            headers,
            payload,
            path
        ) YIELD value AS _
        """
        operations: [UPDATE]
    ) {
    id: ID! @id
    name: String!
    email: String!
    audits: [Audit!]! @relationship(type: "HAS_AUDIT", direction: OUT) @readonly
}

type Audit @exclude(operations: [CREATE, UPDATE, DELETE, CONNECT, DISCONNECT]) {
    id: ID!
    createdAt: DateTime!
    msg: String!
    jwt: String!
}

type Subscription {
    userUpdated: ID
}
```

API code

```js
const express = require("express");
const { Neo4jGraphQL } = require("@neo4j/graphql");
const { PubSub } = require("apollo-server");

const pubSub = new PubSub();

const userUpdated = {
    subscribe() {
        return pubSub.subscribe("USER:UPDATE");
    },
};

const neoSchema = new Neo4jGraphQL({
    typeDefs: ``,
    resolvers: {
        Subscription: {
            userUpdated,
        },
    },
});

const app = express();
app.registerGraphQL(neoSchema.schema);
app.post("/subscription-callback/:id", (req, res) => {
    pubSub.publish("USER:UPDATE", req.query.id);
});
app.listen();
```

Given then that someone updates a user node:

```gql
mutation {
    updateUsers(where: { name: "cat" }, update: { email: "cat@cat.com" }) {
        users {
            name
            email
        }
    }
}
```

The cypher would be along the lines of:

```gql
CALL {
    MATCH (u:User)
    WHERE u.name = "cat"
    SET u.email = "cat@cat.com"
    CALL apoc.cypher.runFirstColumn("
        WITH
        'http://MY_PUBSUB_API/subscription-callback/'+ apoc.text.urlencode(this.id) AS callback
        {} AS headers,
        "" AS payload,
        "" AS path

        CALL apoc.load.jsonParams(
            callback,
            headers,
            payload,
            path
        ) YIELD value AS _
    ", { this: u, $auth: auth }, false)
    RETURN u
}
RETURN u { .name, .email } AS u
```

Triggering a HTTP call to our server and feeding the subscribers.

## Extending Auth

Finally, I would like to point out that our `@auth` directive cannot cover all complexities related to auth and that Cypher Hooks would enable users to enforce sophisticated auth patterns before or after a Cypher operation.

## Out of scope

1. Filtering on `post`
