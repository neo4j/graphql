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
- `_INC`
- `_DEC`
- `_MULT`
- `_DIV`

For instance `counter_INC` or `counter_DEC`.
These properties should be available for all the following types:
- Int
- Float
- BigInt

### Usage Examples
```graphql
updateNodes(
  where: { id: "e9bc687a-efd1-419d-b208" }
  update: {
    counter_INC: 1,
  }
)
```

### Technical considerations
#### Ambiguous property
Given the following example: 
```graphql
updateNodes(
  where: { id: "e9bc687a-efd1-419d-b208" }
  update: {
    counter: 10,
    counter_INC: 1,
  }
)
```
`counter` is ambiguous, and a strategy for this situation should be defined.

#### Schema size
The proposed solution could increase the size of the augmented schema noticeably.

## Alternative Solution
Create a new GraphQL scalar type that supports these operations:
- `INC`
- `DEC`
- `MULT`
- `DIV`

For instance `counter: { INC: 1 }` or `counter: { DEC: 1 }`, the syntax `counter: 1` should remains valid.
The new GraphQL scalar type should be available for all the following types:
- Int
- Float
- BigInt

### Usage Examples
```graphql
updateNodes(
  where: { id: "e9bc687a-efd1-419d-b208" }
  update: {
    counter: { inc: 1 },
  }
)
```
### Technical considerations
#### Inconsistent design
The proposed solution implements a design different from similar features like [https://neo4j.com/docs/graphql-manual/current/filtering/](https://neo4j.com/docs/graphql-manual/current/filtering/),
and increase the learning curve of the library.

## Risks
- Schema size.

### Security consideration
None.

## Out of Scope
- `DateTime` and `Location` types.
- Lists of supported types.

## Discarded solutions
### Interpolation
Given the following example:
```graphql
updateNodes(
  where: { id: "e9bc687a-efd1-419d-b208" }
  update: {
    counter: counter + 1,
  }
)
```
This syntax is not valid GraphQL.

