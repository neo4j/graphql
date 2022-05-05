# Mathematical operators

## Problem
As described in the issue #677, if we have to do a mathematical operation using the GraphQL library, 
the common approach is to query the database and then perform the mutation with the final property value.
The former approach has several downsides:
- It requires multiple roundtrips to the database.
- It's not concurrency safe.
- It requires more code than necessary in the client.

## Proposed Solution
Add new input properties that solve atomic operations like:
- `_ADD`
- `_SUBTRACT`
- `_MULTIPLY`
- `_DIVIDE`

For instance `counter_ADD` or `counter_SUBTRACT`.
These properties should be available for all the following types:
- Int
- Float
- BigInt

### Usage Examples
Given the following type definitions:
```graphql
type Node {
  id: ID! @id
  counter: Int
}
```
The operator _ADD could then be used in a mutation like:
```graphql
updateNodes(
  where: { id: "e9bc687a-efd1-419d-b208" }
  update: {
    counter_ADD: 1,
  }
)
```

### Technical considerations
#### Ambiguous property
In the following mutation body: 
```graphql
updateNodes(
  where: { id: "e9bc687a-efd1-419d-b208" }
  update: {
    counter: 10,
    counter_ADD: 1,
  }
)
```
`counter` is ambiguous, and an Error will be raised.

#### Schema size
The proposed solution could increase the size of the augmented schema noticeably.

## Alternative Solution
Create a new GraphQL scalar type that supports these operations:
- `ADD`
- `SUBTRACT`
- `MULTIPLY`
- `DIVIDE`

For instance `counter: { ADD: 1 }` or `counter: { SUBTRACT: 1 }`, the syntax `counter: 1` should remains valid.
The new GraphQL scalar type should be available for all the following types:
- Int
- Float
- BigInt

### Usage Examples
Given the following type definitions:
```graphql
type Node {
  id: ID! @id
  counter: Int
}
```
The operator ADD could then be used in a mutation like:
```graphql
updateNodes(
  where: { id: "e9bc687a-efd1-419d-b208" }
  update: {
    counter: { ADD: 1 },
  }
)
```
### Technical considerations
#### Inconsistent design
The proposed solution implements a design different from similar features like [https://neo4j.com/docs/graphql-manual/current/filtering/](https://neo4j.com/docs/graphql-manual/current/filtering/),
and increase the learning curve of the library.

####  Unions between scalar types
Let's consider the following type definition:
```graphql
type Node {
  id: ID! @id
  counter: Int | IntBoxed
}

type IntBoxed {
  ADD: Int
  SUBTRACT: Int
  MULTIPLY: Int
  DIVIDE: Int
}
```
The above will raise an error as GraphQL does not support unions between scalar types.
A workaround of the above could be to construct a custom GraphQL scalar type, in this case, IntBoxed which will wrap all the Int types present in the GraphQL client schema.
The augmented schema should look like this:
```graphql
scalar IntBoxed

type Node {
  counter: IntBoxed
}
```
A future investigation on the feasibility of the above will be required in the case there will be a follow-up over this solution.

## Risks
- Schema size.

### Security consideration
None.

## Out of Scope
- `DateTime` and `Location` types.
- Lists of supported types.

## Discarded solutions
### Interpolation
In the following example:
```graphql
updateNodes(
  where: { id: "e9bc687a-efd1-419d-b208" }
  update: {
    counter: counter + 1,
  }
)
```
the syntax is not valid GraphQL.

