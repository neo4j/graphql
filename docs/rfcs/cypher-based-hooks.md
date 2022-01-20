# Cypher Based Hooks

## Problem

Due to the fact that Neo4j GraphQL generates a single Cypher statement, it’s difficult for users to ‘inject’ custom logic before or after an interaction with either a node or relationship. Injecting custom logic is common, and for example: ‘Audit Logs’ - Users may want to efficiently store a trail of events produced by their API consumers.

Not only is it difficult for users to inject custom logic but the logic that they do inject can never be 100% deterministic, and this is because, again, we generate a single Cypher statement! All the interactions with the database happen in one transaction, defined in one statement, and so any hook or plugin made will always execute outside of that transaction.

I believe, demonstrated in this RFC, we could use Cypher Hooks to not only; enforce and create patterns, validate properties, extend authentication, but also enable sophisticated patterns such as subscriptions.

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

This is a real-world example! Most applications will at some point want to store a trail of events, and given that we have established that we don’t have a deterministic way of knowing if a node or relationship has been updated the only logical and safe way would be to use a Cypher hook. Given the schema below, there is a User and an Audit node declared, with a relationship between them. The Audit node is excluded from upserts and only created in the Hook.

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
    name: String!
    email: String!
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

GIven that a user goes and preforms a GraphQL update mutation:

```gql

```

The cypher produced would be along the lines of:

```

```

## Risks

What risks might cause us to go over the appetite described above?

## Out of Scope

What are we definitely not going to implement in this solution?

```

```
