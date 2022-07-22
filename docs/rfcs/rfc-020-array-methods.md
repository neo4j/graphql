# Array Methods

## Problem

Our users would like to modify arrays inline.

## Proposed Solution

Add new array methods PUSH and POP:

-   `_PUSH`
-   `_POP`

### Potential additional methods

SHIFT `_SHIFT` and UNSHIFT `_UNSHIFT` are very similar methods to PUSH and POP so they may be included, if time permits.

### Usage Examples

Given the following type definitions with a middleNames array of strings:

```gql
type Person {
    name: String!
    middleNames: [String]
}
```

#### POP operations

We could perform a POP operation like so, where the update parameter is an integer, specifying the number of array elements to pop off the end of the array. Popped off elements would then be returned in a `poppedElements` object inside the `info` object.

The minimum valid value is 1. Values less than 1 would result in an error.

```graphql
mutation {
  updateRecord(
    where: { name: "Some Person" }
    update: { middleNames_POP: 1 }
  ) {
    records {
      name
      middleNames
    }
    info {
      poppedElements {
        middleNames
      }
    }
  }
}
```

Where the response info object has a poppedElements object containing the elements that were popped like:

```json
"info": {
    "poppedElements": {
        "middleNames": ["Emil"]
    }
}
```

Or when updating arrays in the same mutation (supposing there was an additional `otherNames` field):

```graphql
mutation {
  updateRecord(
    where: { name: "Some Person" }
    update: { middleNames_POP: 1, otherNames_POP: 1  }
  ) {
    records {
      name
      middleNames
      otherNames
    }
    info {
      poppedElements: {
        middleNames
        otherNames
      }
    }
  }
}
```

Where the response info object has a poppedElements object containing the elements that were popped like:

```json
"info": {
    "poppedElements": {
        "middleNames": ["Emil"],
        "otherNames": ["Michael"],
    }
}
```

#### PUSH operations

We could perform a PUSH operation like so, where the update parameter is an array containing the values to be pushed to the end of the array:

```graphql
mutation {
  updateRecord(
    where: { name: "Some Person" }
    update: { middleNames_PUSH: ["Emil"] }
  ) {
    records {
      name
      middleNames
    }
  }
}
```

Or when updating arrays in the same mutation (supposing there was an additional `otherNames` field):

```graphql
mutation {
  updateRecord(
    where: { name: "Some Person" }
    update: { middleNames_PUSH: ["Emil"], otherNames_PUSH: ["Michael"]  }
  ) {
    records {
      name
      middleNames
      otherNames
    }
  }
}
```

#### PUSH and POP operations

We could also perform both PUSH and POP operations in a single mutation:


```graphql
mutation {
  updateRecord(
    where: { name: "Some Person" }
    update: { middleNames_POP: 1, otherNames_PUSH: ["Michael"]  }
  ) {
    records {
      name
      middleNames
      otherNames
    }
  }
}
```

### Technical considerations

In an update mutation when the POP method is not used, the `info` object will contain the field `poppedElements` with a value of `[]`.

#### Homogenous array types

Since graphql allows union types in an array but Cypher only allows homogenous arrays, we could perform type checking in the graphql schema to ensure defined arrays are of the same type.

#### PUSH to undefined properties

When using the PUSH method on an undefined property, we will throw an error in all cases unless the `coalesce` directive is used.

If the coalesce directive is used, we will create the array and add the new elements. This can be achieved in Cypher by always starting with at least an empty array:

```cypher
SET n.myPushToProperty = coalesce(n.myPushToProperty, []) + n.myPushToProperty
```

#### POP on undefined properties

When using the POP method on an undefined property, we will throw an error.

#### Ambiguous property
In the following mutation body:

```graphql
updateNodes(
  where: { id: "e9bc687a-efd1-419d-b208" }
  update: {
    middleNames: [],
    middleNames_PUSH: ["Emil"]
  }
)
```

`middleNames` is ambiguous, and an Error will be raised.

#### Supported types

To be added to documentation, we should make it clear that the supported types for arrays are the same default scalar types we use support in GraphQL today and not more complex types.

## Risks

There could be confusion about the usage of POP as providing an integer to POP is not universally standard. This can be addressed in documentation.

### Security consideration

N/A

## Out of Scope

Instead of throwing an error on ambiguous updates, it could be nice to instead ensure an order of updates. This would enable users to perform something like clearing an array and then adding to it in one update.

Where this would now error, it would instead ensure that the database value is `["Emil"]`.

```
updateNodes(
  where: { id: "e9bc687a-efd1-419d-b208" }
  update: {
    middleNames: [],
    middleNames_PUSH: ["Emil"]
  }
)
```

### Array methods

The following array methods will not be included:

-   `_FILTER`
-   `_FILTER_NOT`
-   `_SORT`
-   `_SPLICE`
-   `_SLICE`

### Complex types

We will not support complex types in arrays and keep the standard type support. https://neo4j.com/docs/graphql-manual/current/type-definitions/types/
