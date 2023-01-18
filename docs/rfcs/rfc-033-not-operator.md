# Not operator

## Problem

Currently, boolean operators like `AND` and `OR` are supported by the library for filters and authorizations purpose.
Almost all filters, for instance:
`_CONTAINS`, `_IN`, `_STARTS_WITH` have their counterpart as:
`_NOT_CONTAINS`, `_NOT_IN`, `_NOT_STARTS_WITH`.
The goal of this RFC is to propose a mechanism to remove these extra filters in favor of a general NOT operator as it's already the case for the `AND` and `OR`.
With the new operator is possible to reduce the schema size and have a more consistent API, currently, only a portion of predicates have the negate counterpart.

## Proposed Solution

This RFC proposes to deprecate all the previous filters with the `@deprecated` directive and deprecate these in the `4.x` release.
A new operator `NOT` should then be included where the other two operators `AND` and `OR` are currently present.

List of deprecated syntaxes:

-   `_NOT`
-   `_NOT_INCLUDES`
-   `_NOT_IN`
-   `_NOT_CONTAINS`
-   `_NOT_STARTS_WITH`
-   `_NOT_ENDS_WITH`
-   `node_NOT` (connection fields)
-   `edge_NOT` (connection fields)

The `NOT` operator should be then included in the following types:

-   `{type}Where`
-   `{relationshipProperties}Where`
-   `{relationshipField}AggregateInput`
-   `{relationshipField}EdgeAggregationWhereInput`
-   `{relationshipField}NodeAggregationWhereInput`
-   `{relationshipField}ConnectionWhere`

### Usage Examples

Given the following Type Definitions:

```graphql
type Post {
    title: String
    postedBy: User @relationship(type: "POSTED_BY", direction: OUT)
}

type User {
    username: String
    posts: [Post!]! @relationship(type: "POSTED_BY", direction: IN)
}
```

```graphql
query NotMatrixRelatedPosts{
  posts(where: {
        NOT: {
              "title_CONTAINS": "Matrix"
        }
    }) {
    title
  }
}
```

## Risks

-   Schema size will slightly increase before the actual deprecations of the previous negate filters.

## Out of Scope

.
