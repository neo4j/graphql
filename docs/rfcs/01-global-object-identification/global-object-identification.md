# Global Object Identification

## Background

The following articles can be read for background on this topic:

- <https://relay.dev/docs/guides/graphql-server-specification/#object-identification>
- <https://graphql.org/learn/global-object-identification/>

## Problem

From <https://relay.dev/docs/guides/graphql-server-specification/>, there are two assumptions that Relay makes about a GraphQL server, in that it should provide:

1. A mechanism for refetching an object.
2. A description of how to page through connections.

The second assumption is already satisfied by `@neo4j/graphql`, but a solution for the second assumption is yet to be implemented.

Relay expects this to be fulfilled by a field `node` on the root query type, which returns an implementation of a `Node` interface, which contains a single field `id` of type `ID!` which implementing types must satisfy.

## Solution

### `Node` interface and `id` field

There are two main approaches which could be taken when implementing global object identification, namely:

1. Native globally unique IDs stored in the database.
2. Synthesized globally unique IDs which are an encoded composition of the type name and a type-specific ID.

The second option is significantly more attractive in that the type name can be decoded before database access and used as the label in the Cypher query.

In <https://github.com/graphql/graphql-relay-js/blob/main/src/node/node.js> there is an established standard of concatenating the type name and the type-specific ID with a colon in between, and then encoding this in base64.

So the main solution needed is twofold:

1. How does a user opt a type in to implement the `Node` interface?
2. How does a user indicate which field should be used as the type-specific ID?

#### Implementation of the `Node` interface

In <https://github.com/neo4j/graphql/pull/285>, there was talk of using the `@node` directive for this purpose. However, it now has other purposes, which means that using this would mean the directive plus an argument within, at which point it is less boilerplate to explicity add `implements Node` and the necessary `id` field to the type definition. So a `Movie` type with global object identification should be defined using:

```graphql
type Movie implements Node {
    id: ID!
    title: String!
}
```

#### Type-specific ID

Once again pointing back to <https://github.com/neo4j/graphql/pull/285>, there was a discussion on how to specify a type-specific ID. However, with the introduction of unique node property constraint management, this could now be an automatic process through searching for a field which fulfils the following criteria:

1. Is of type non-nullable `String` or non-nullable `ID`.
2. Has either the `@id` (first choice) or `@unique`, choosing the first field when sorted alphabetically.

If a match is found, append the field name into the generated ID before it is encoded. If a match cannot be found, throw an error indicating the requirements.

In the following example, the `id` field will resolve to value "Book:iban:VALUE" encoded in base64, where "VALUE" is the value of the `iban` field:

```graphql
type Book implements Node {
    id: ID!
    iban: String! @id
}
```

The following type would throw an error because there id no `@id` or `@unique` directive:

```graphql
type Book implements Node {
    iban: String!
}
```

The inclusion of the type name and field name in the ID will mean easy refetching of data.

### `node` root query type field

There must be a `node` field on the root query type with the following definition:

```graphql
type Query {
    node(id: ID!): Node
}
```

Upon resolution of the `node` field, the following steps should take place:

1. base64 decode the `id` input field.
2. Split the decoded ID on the first two colon characters.
3. Query for the node, using the first entry of the split as the label, second as the field to filter on, and third as the value for filtering.
4. Return the node if found, `null` otherwise.

#### Additional `nodes` root query type field

An additional `nodes` field _can_ be added to the root query type, with the following definition:

```graphql
type Query {
    nodes(ids: [ID!]!): [Node]!
}
```

For each ID in the `ids` input field, execute the same intructions as above, returning the result in the same array position as the input argument.
