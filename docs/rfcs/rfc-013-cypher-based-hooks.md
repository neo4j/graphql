# Cypher Based Hooks

## Problem

Due to the fact that Neo4j GraphQL generates a single Cypher statement, it’s difficult for users to ‘inject’ custom logic before or after an interaction with either a node or relationship. Injecting custom logic is common, and for example: ‘Audit Logs’ - Users may want to efficiently store a trail of events produced by their API consumers.

Not only is it difficult for users to inject custom logic but the logic that they do inject can never be 100% deterministic, and this is because, again, we generate a single Cypher statement! All the interactions with the database happen in one transaction, defined in one statement, and so any hook or plugin made will always execute outside of that transaction.

I believe, demonstrated in this RFC, we could use Cypher Hooks to; enforce and create relationships, validate properties, extend and authentication.

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

## Usage Examples

### Audit Logs

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


Producing Cypher like: 

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

### Extending Auth

Finally, I would like to point out that our `@auth` directive cannot cover all complexities related to auth and that Cypher Hooks would enable users to enforce sophisticated auth patterns before or after a Cypher operation.

## Risks

- We'll face similar issues as we did with relationship cardinality - if a node is disconnected as a side effect, we just wouldn't know to execute the hook
- Security Consideration
    - Escaping the Cypher
    - Dynamic Cypher

## Out of scope

1. Filtering on `post`

## Notes

Actually, creating a Hook system for top-level operations like updating a user property is quite straightforward, the complexity starts to arise when you talk about the nested operations such as connect and disconnect - surely subscribers would want to know if a relationship was upserted too? The great thing about using Cypher hooks is that users don't need to navigate their way through the resolve info to find if a connection has happened because we can append the custom logic just after the connection statement.

## Appetite

3 weeks

## Considerations

1. `this` variable injected into the scope
2. `target` variable injected into the scope on CONNECT and DISCONNECT
3. Does the OPERATIONS array need to be different depenant on `pre` and `post`
4. Combine this will Javascript callback hooks, using the same directive ? 
