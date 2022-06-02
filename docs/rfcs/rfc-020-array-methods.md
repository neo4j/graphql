# Array Methods

## Problem

Our users would like to modify arrays inline.

## Proposed Solution

Add new array methods:

-   `_PUSH`
-   `_POP`

### Usage Examples

Given the following type definitions with a middleNames array of strings:

```gql
type Person {
    name: String!
    middleNames: [String]
}
```

We could perform a POP operation like so, where the update parameter is an empty array:

Note: the implied use case of POP is to remove the last element in an array only, without having the element returned

```
mutation {
  updateRecord(
    where: { name: "Some Person" }
    update: { middleNames_POP: [] }
  ) {
    records {
      name
      middleNames
    }
  }
}
```

We could perform a PUSH operation like so, where the update parameter is an array containing the values to be pushed:

```
mutation {
  updateRecord(
    where: { name: "Some Person" }
    update: { middleNames_PUSH: ['Emil'] }
  ) {
    records {
      name
      middleNames
    }
  }
}
```

## Risks

### Security consideration

N/A

## Out of Scope

The following array methods will not be included:

-   `_SHIFT`
-   `_FILTER`
-   `_FILTER_NOT`
-   `_SORT`
