# Readonly directive for relationships

## Problem

This feature request was raised in [#917](https://github.com/neo4j/graphql/issues/917).

Users require a way to describe the relationship field as read-only.
In a real-world scenario the evidence this read-only feature is missing could be: 
```
(Post)-[createdBy:POST_CREATED_BY]->(User)
```
In this case, it is reasonable to believe that `createdBy` should be immutable.

### One-to-many relationships

Given this type defintion:
```graphql
type Company {
    name: String
    founders: [User!]! @relationship(type: "FOUNDED_BY", direction: OUT) @readonly
}
type User {
    name: String!
}
```
It is reasonable to believe that `founders` should be immutable.

### Many-to-many relationships

Given this type defintion:
```graphql
type Company {
    name: String
    founders: [User!]! @relationship(type: "FOUNDED_BY", direction: OUT) @readonly
}
type User {
    name: String!
    founderOf: [Company!]! @relationship(type: "FOUNDED_BY", direction: IN) @readonly
}
```
It is reasonable to believe that both `founders` and `founderOf` should be immutable.

A once created relationship should, when the `@readonly` directive is present, not be updatable anymore.
This is currently not possible and prevented by the combination check on the directives.

In this document we consider the type definition defined as:
```graphql
type Post {
    id: ID
    title: String
    createdBy: User! @relationship(type: "POST_CREATED_BY", direction: OUT) @readonly
}

type User {
    name: String
    posts: [Post!]! @relationship(type: "POST_CREATED_BY", direction: IN) 
}
```

## Proposed Solution

Given the following type definitions:

One way to achieve it is by modifying the schema by removing the `createdBy` input field from the following types:  
`PostUpdateInput`
`PostConnectInput`
`PostDisconnectInput`
`PostRelationInput`
`PostDeleteInput`

For example, we could expect that the `PostUpdateInput` should look like this:
```graphql
input PostUpdateInput {
  ... // the createdBy field is not longer present as it was defined as readonly
  id: ID 
  title: String
}
```

What about relationship properties, are they still allowed to be updated?

The directive combination `@relationship` and `@readonly` has to be allowed.

## Risks

tbd

### Security consideration

None

## Out of Scope

- TBD
