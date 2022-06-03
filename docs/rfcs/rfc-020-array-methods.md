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

We could perform a POP operation like so, where the update parameter is an integer, specifying the number of array elements to pop off the end of the array. Popped off elements would then be returned in `poppedElements` inside the `info` object.

```
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
      poppedElements: ["Emil"]
    }
  }
}
```

We could perform a PUSH operation like so, where the update parameter is an array containing the values to be pushed to the end of the array:

```
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

### Technical considerations

In an update mutation when the POP method is not used, the `info` object will contain the field `poppedElements` with a value of `[]`.

## Risks

### Security consideration

N/A

## Out of Scope

The following array methods will not be included:

-   `_FILTER`
-   `_FILTER_NOT`
-   `_SORT`
-   `_SPLICE`
-   `_SLICE`
