# Example Title

## Problem

Currently, the `@customResolver` directive allows users to define fields that a custom resolver requires in order to provide it's intended functionality. These fields are then always fetched from the database if the `@customResolver` field is requested. However, only fields defined on the same type as the `@customResolver` field, can be used in the `requires` argument. A user may want to use fields on related types. This is not currently possible.

## Proposed Solution

The requires argument should be updated to accept a selection set (i.e. `firstName lastName address { city }` which would fetch the `firstName`, `lastName` and `address.city` fields.). Nested fields should be provided to the custom resolver as nested objects.

In version 3.x.x this new input type should be optional and the only input should be deprecated. This will allow users to try out the feature ahead of 4.0.0.

In version 4.0.0, the array input should be removed.

### Usage Examples

#### Fetching only fields available on the base type

Type Defs:

```gql
type User {
    id: ID!
    firstName: String!
    lastName: String!
    fullName: String @customResolver(requires: "firstName lastName")
}
```

Resolver:

```js
const resolvers = {
    User: {
        fullName: ({ firstName, lastName }) => `${firstName} ${lastName}`,
    },
};
```

#### Fetching a field from a related type

Type Defs:

```gql
type AddressType {
    street: String!
    city: String!
}

type User {
    id: ID!
    firstName: String!
    lastName: String!
    address: AddressType @relationship(type: "LIVES_AT", direction: OUT)
    fullName: String @customResolver(requires: "firstName lastName address { city }")
}
```

OR

```gql
type AddressType {
    street: String!
    city: String!
}

type User {
    id: ID!
    firstName: String!
    lastName: String!
    address: AddressType @relationship(type: "LIVES_AT", direction: OUT)
    fullName: String @customResolver(requires: "firstName address { city } lastName") # Note that non-nested fields can be required after the nested fields
}
```

Resolver:

```js
const resolvers = {
    User: {
        fullName: ({ firstName, lastName, address }) => `${firstName} ${lastName} from ${address.city}`,
    },
};
```

Cypher (when just fullName selected):

```
MATCH (this:`User`)

CALL {
    WITH this
    MATCH (this)-[this0:LIVES_AT]->(this_address:`AddressType`)
    WITH this_address { .city } AS this_address
    RETURN head(collect(this_address)) AS this_address
}
RETURN this { .fullName, address: this_address, .firstName, .lastName } AS this
```

Note this is the same cypher as when the firstName, lastName, address city and fullName are manually selected.


### Documentation Updates

There is not currently documentation for using the `requires` argument. This needs to be added to document the new possibilities.

## Risks

What risks might cause us to go over the appetite described above?

### Security consideration

Please take some time to think about potential security issues/considerations for the proposed solution.
For example: How can a malicious user abuse this? How can we prevent that in such case?

## Out of Scope

What are we definitely not going to implement in this solution?
