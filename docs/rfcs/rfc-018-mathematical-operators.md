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
- `_INCREMENT`
- `_DECREMENT`

available for Int and BigInt fields.
And:
- `_ADD`
- `_SUBTRACT`
- `_MULTIPLY`
- `_DIVIDE`

available for Float fields.

For instance `counter_ADD` or `counter_SUBTRACT`.

The MULTIPLY and the DIVIDE operations will then be available only for fields defined as Float.

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
    counter_INCREMENT: 1,
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
    counter_INCREMENT: 1,
  }
)
```
`counter` is ambiguous, and an Error will be raised.

#### Schema size
The proposed solution could increase the size of the augmented schema noticeably.

#### Overflow
In cases where a mathematical operation leads to an overflow, then an exception must be raised.

#### Infinity
The Infinity type is not supported, this means that divisions by zero will be not supported as well.

## Risks
- Schema size.

### Security consideration
None.

## Out of Scope
- `DateTime` and `Location` types.
- Lists of supported types.
- MULTIPLY AND DIVIDE for Integer and BigInt fields.
- Divisions by zero.

## Discarded solutions
### New Scalar type
Create a new GraphQL scalar type that supports these operations:
- `INCREMENT`
- `DECREMENT`

available for Int and BigInt fields.
And:
- `ADD`
- `SUBTRACT`
- `MULTIPLY`
- `DIVIDE`

available for Float fields.

For instance `counter: { INCREMENT: 1 }` or `counter: { DECREMENT: 1 }`, the syntax `counter: 1` should remains valid.

The MULTIPLY and the DIVIDE operations will then be available only for fields defined as Float.

#### Usage Examples
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
#### Technical considerations
##### Inconsistent design
The proposed solution implements a design different from similar features like [https://neo4j.com/docs/graphql-manual/current/filtering/](https://neo4j.com/docs/graphql-manual/current/filtering/),
and increase the learning curve of the library.

#####  Unions between scalar types
Let's consider the following type definition:
```graphql
type Node {
  id: ID! @id
  counter: Int | IntBoxed
}

type IntBoxed {
  INCREMENT: Int
  DECREMENT: Int
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

##### Overflow
In cases where a mathematical operation leads to an overflow, then an exception must be raised.

##### Infinity
The Infinity type is not supported, this means that divisions by zero will be not supported as well.

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

