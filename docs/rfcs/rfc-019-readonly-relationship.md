# Readonly directive for relationships

## Problem

This feature request was raised in [#917](https://github.com/neo4j/graphql/issues/917).

Users require a way to describe the relationship field as read-only.
In a real-world scenario the evidence this read-only feature is missing could be: 
```
(Post)-[createdBy:POST_CREATED_BY]->(User)
```
In this case, it is reasonable to believe that `createdBy` should be immutable.

As a relationship need two nodes to exist, the @read-only directive will not make the relationship field immutable, as it will be still possible to mutate it indirectly by deleting one of the two nodes or removing the relationship from the other side of the relationship.
More at: [Indirect Mutation](#indirect-mutation)

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


## Proposed Solution

In this solution we consider the type definition defined as:
```graphql
type Post {
    title: String
    createdBy: User! @relationship(type: "POST_CREATED_BY", direction: OUT) @readonly
}

type User {
    name: String
    posts: [Post!]! @relationship(type: "POST_CREATED_BY", direction: IN) 
}
```

One way to achieve it is by modifying the schema by removing the `createdBy` input field from the following types:  
* `PostUpdateInput`
* `PostConnectInput`
* `PostDisconnectInput`
* `PostRelationInput`
* `PostDeleteInput`


For example, we could expect that the `PostUpdateInput` should look like this:
```graphql
input PostUpdateInput {
  ... // the createdBy field is not longer present as it was defined as readonly
  title: String
}
```

What about relationship properties, are they still allowed to be updated?

The directive combination `@relationship` and `@readonly` has to be allowed.

### Technical considerations

#### Indirect mutation

In this solution, even if `createdBy` is set as read-only, it's still possible to mutate it by:
* modify the relationship from the `User` node
* delete the `User` node.

A more stringent solution will be to enforce that if a @read-only directive is present, then, it should be present on both sides of the relationship.

#### Directive inheritance

It should be supported and tested against relationship with interface too.

#### Empty Inputs

This solution requires removing all the read-only relationship fields from all the update input types. That means that we have new situations where an input type could remains empty. To avoid that, an `_emptyInput` field could be added to these empty inputs or that input could be removed.

#### Cascade Deletes

From the type definition above, the type `PostDeleteInput` is shared, as argument, between  the `updatePosts` and the `deletePosts` mutation.
Remove `createdBy` from it, it will remove the ability to delete in cascade `User` nodes from the `Post` mutations.

## Risks

tbd

### Security consideration

None

## Out of Scope

- TBD
