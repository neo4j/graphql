# Array Methods

## Problem

Our users would like to modify arrays inline.

## Proposed Solution

How are you proposing we will solve the problem described above?

Feel free to add/remove subheadings below as appropriate:

### Usage Examples

An example where POP is used to take the last element from an array... and then use it in a following query?

An example where PUSH is used to add a new element to an array?

Given the following type definitions:

```gql
type Actor {
    name: String!
    movies: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT)
}

type Movie {
    title: String
    id: ID! @id
    actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN)
}
```

We could 


## Risks


### Security consideration

N/A

## Out of Scope

What are we definitely not going to implement in this solution?
