# Readonly directive for relationships

## Problem

This feature request was raised in [#917](https://github.com/neo4j/graphql/issues/917).

Users need a way to describe the relationship field as read-only.
In a real-world scenario the evidence this read-only feature is missing could be: 
```cypher
(Post)-[createdBy:CREATED_BY]->(User)
```
In this case, it is reasonable to believe that `createdBy` should be immutable.

A once created one-to-one (only?) relationship should, when the `@readonly` directive is present, not be able to be updated anymore.
This is currently not possible and also prevented by the directive combination check.

## Proposed Solution

Given the following type definitions:
```
type Product {
    id: ID
    name: String
    createdBy: Application! @relationship(type: "CREATED_BY", direction: OUT) @readonly
}

type Application {
    name: String
}
```
One way to achieve it is by removing the ability to update the relationship via the `<type>UpdateInput`.
The `<type><fieldName>UpdateFieldInput` has to be remove, see below.
```
input ProductUpdateInput {
  createdBy: ProductCreatedByUpdateFieldInput // <- remove this line
  id: ID
  name: String
}
```
What about relationship properties, are they still allowed to be updated?

The directive combination `@relationship` and `@readonly` has to be allowed of course.

Note: A readonly relationship, in the example above `createdBy`, can still be deleted.

### Usage Examples

tbd

## Risks

What about many-to-many relationships? 

### Security consideration

None

## Out of Scope

- tbd
