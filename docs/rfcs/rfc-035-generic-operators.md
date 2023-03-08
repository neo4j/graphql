# Reusable Generic Operators

## Problem

Consider the following type definition:

```graphql
type User {
    integerList: [Int!]!
    someFloat: Float
    name: String
}
type Post {
    content: String!
    public: Boolean
    likes: [User!]! @relationship(type: "LIKES", direction: IN)
}
```

will generate the following filters:

```graphql
input UserWhere {
    OR: [UserWhere!]
    AND: [UserWhere!]
    NOT: UserWhere
    integerList: [Int!]
    integerList_NOT: [Int!]
    integerList_INCLUDES: Int
    integerList_NOT_INCLUDES: Int
    someFloat: Float
    someFloat_NOT: Float
    someFloat_IN: [Float]
    someFloat_NOT_IN: [Float]
    someFloat_LT: Float
    someFloat_LTE: Float
    someFloat_GT: Float
    someFloat_GTE: Float
    name: String
    name_NOT: String
    name_IN: [String]
    name_NOT_IN: [String]
    name_CONTAINS: String
    name_NOT_CONTAINS: String
    name_STARTS_WITH: String
    name_NOT_STARTS_WITH: String
    name_ENDS_WITH: String
    name_NOT_ENDS_WITH: String
}

input PostWhere {
    OR: [PostWhere!]
    AND: [PostWhere!]
    NOT: PostWhere
    content: String
    content_NOT: String
    content_IN: [String!]
    content_NOT_IN: [String!]
    content_CONTAINS: String
    content_NOT_CONTAINS: String
    content_STARTS_WITH: String
    content_NOT_STARTS_WITH: String
    content_ENDS_WITH: String
    content_NOT_ENDS_WITH: String
    likes: UserWhere @deprecated(reason: "Use `likes_SOME` instead.")
    likes_NOT: UserWhere @deprecated(reason: "Use `likes_NONE` instead.")
    public: Boolean
    likesAggregate: PostLikesAggregateInput

    """
    Return Posts where all of the related Users match this filter
    """
    likes_ALL: UserWhere

    """
    Return Posts where none of the related Users match this filter
    """
    likes_NONE: UserWhere

    """
    Return Posts where one of the related Users match this filter
    """
    likes_SINGLE: UserWhere

    """
    Return Posts where some of the related Users match this filter
    """
    likes_SOME: UserWhere
    likesConnection: PostLikesConnectionWhere @deprecated(reason: "Use `likesConnection_SOME` instead.")
    likesConnection_NOT: PostLikesConnectionWhere @deprecated(reason: "Use `likesConnection_NONE` instead.")
    likesConnection_ALL: PostLikesConnectionWhere
    likesConnection_NONE: PostLikesConnectionWhere
    likesConnection_SINGLE: PostLikesConnectionWhere
    likesConnection_SOME: PostLikesConnectionWhere
}
```

As it's visible from the schema generated, the current approach is to add operators in the schema in the form of:

`{fieldName}_{operatorName}`: `{operatorType}`

to the types needed.

This mechanism is adopted widely, for instance, consider the aggregation filters:

```graphql
input PostLikesNodeAggregationWhereInput {
    AND: [PostLikesNodeAggregationWhereInput!]
    OR: [PostLikesNodeAggregationWhereInput!]
    NOT: PostLikesNodeAggregationWhereInput
    name_EQUAL: String
    name_AVERAGE_EQUAL: Float
    name_LONGEST_EQUAL: Int
    name_SHORTEST_EQUAL: Int
    name_GT: Int
    name_AVERAGE_GT: Float
    name_LONGEST_GT: Int
    name_SHORTEST_GT: Int
    name_GTE: Int
    name_AVERAGE_GTE: Float
    name_LONGEST_GTE: Int
    name_SHORTEST_GTE: Int
    name_LT: Int
    name_AVERAGE_LT: Float
    name_LONGEST_LT: Int
    name_SHORTEST_LT: Int
    name_LTE: Int
    name_AVERAGE_LTE: Float
    name_LONGEST_LTE: Int
    name_SHORTEST_LTE: Int
    someFloat_EQUAL: Float
    someFloat_AVERAGE_EQUAL: Float
    someFloat_MIN_EQUAL: Float
    someFloat_MAX_EQUAL: Float
    someFloat_SUM_EQUAL: Float
    someFloat_GT: Float
    someFloat_AVERAGE_GT: Float
    someFloat_MIN_GT: Float
    someFloat_MAX_GT: Float
    someFloat_SUM_GT: Float
    someFloat_GTE: Float
    someFloat_AVERAGE_GTE: Float
    someFloat_MIN_GTE: Float
    someFloat_MAX_GTE: Float
    someFloat_SUM_GTE: Float
    someFloat_LT: Float
    someFloat_AVERAGE_LT: Float
    someFloat_MIN_LT: Float
    someFloat_MAX_LT: Float
    someFloat_SUM_LT: Float
    someFloat_LTE: Float
    someFloat_AVERAGE_LTE: Float
    someFloat_MIN_LTE: Float
    someFloat_MAX_LTE: Float
    someFloat_SUM_LTE: Float
}
```

And then these can be used as follow:

**Posts where content contains Matrix**

```graphql
query Posts {
    posts(where: { content_CONTAINS: "The Matrix" }) {
        content
    }
}
```

**Posts with more than 10 likes**

```graphql
query Posts {
    posts(where: { likesAggregate: { count_GT: 10 } }) {
        content
    }
}
```

## Proposed Solution

As part of the new API design, this RFC wants to discuss a new approach to access these operators.

Is possible to reuse generic filters, for instance:

```graphql
input UserWhere {
    OR: [UserWhere!]
    AND: [UserWhere!]
    NOT: PostWhere
    integerList: IntListWhere
    someFloat: FloatWhere
    name: StringWhere
}

input PostWhere {
    OR: [PostWhere!]
    AND: [PostWhere!]
    NOT: PostWhere
    content: StringWhere
    likes: MoviesLikesWhere
}

input MoviesLikesWhere {
    OR: [MoviesLikesWhere!]
    AND: [MoviesLikesWhere!]
    NOT: MoviesLikesWhere
    aggregation: PostLikesAggregateInput
    all: PostLikesConnectionWhere
    none: PostLikesConnectionWhere
    single: PostLikesConnectionWhere
    some: PostLikesConnectionWhere
    # For simplicity the standard filters are substituted by the connections filters as discussed in the API uniformity piece.
}

input IntListWhere {
    OR: [IntListWhere!]
    AND: [IntListWhere!]
    NOT: IntListWhere
    equals: [Int!]
    all: IntWhere
    some: IntWhere
    single: IntWhere
    none: IntWhere
}

input IntWhere {
    OR: [IntWhere!]
    AND: [IntWhere!]
    NOT: IntWhere
    equals: Int
    in: [Int]
    lt: Int
    lte: Int
    gt: Int
    gte: Int
}

input StringWhere {
    OR: [StringWhere!]
    AND: [StringWhere!]
    NOT: StringWhere
    equals: String
    in: [String!]
    matches: String
    contains: String
    startsWith: String
    endsWith: String
}

input FloatWhere {
    OR: [FloatWhere!]
    AND: [FloatWhere!]
    NOT: FloatWhere
    equals: Float
    in: [Float]
    lt: Float
    lte: Float
    gt: Float
    gte: Float
}
```

**Aggregations**

```graphql
input PostLikesAggregateInput {
    AND: [PostLikesAggregateInput!]
    OR: [PostLikesAggregateInput!]
    NOT: PostLikesAggregateInput
    count: IntWhere
    node: PostLikesNodeAggregationWhereInput
}

input PostLikesNodeAggregationWhereInput {
    AND: [PostLikesNodeAggregationWhereInput!]
    OR: [PostLikesNodeAggregationWhereInput!]
    NOT: PostLikesNodeAggregationWhereInput
    name: StringAggregateSelectionNullableWhere
    someFloat: IntAggregateSelectionNullableWhere
}

type StringAggregateSelectionNullableWhere {
    shortest: IntWhere!
    longest: IntWhere!
    average: FloatWhere
}

input IntAggregateSelectionNullableWhere {
    average: FloatWhere
    min: IntWhere
    max: IntWhere
    sum: IntWhere
}
```

### Usage Examples

**Posts where content contains Matrix**

```graphql
query Posts {
    posts(where: { content: { contains: "Matrix" } }) {
        content
    }
}
```

**Posts with more than 10 likes**

```graphql
query Posts {
    posts(where: { likes: { aggregation: { count: { gt: 10 } } } }) {
        content
    }
}
```

**Posts with at least a like from Simone**

```graphql
query Posts {
    posts(where: { likes: { some: { node: { name: { equals: "Simone" } } } } }) {
        content
    }
}
```

**User with all the integers in the integerList greater than 5**

```graphql
query users {
    users(where: { integerList: { all: { gt: 5 } } }) {
        integerList
    }
}
```

As no operators would be available for Boolean fields apart from equals, the syntax for booleans will not change.

**Public posts**

```graphql
query Posts {
    posts(where: { public: true }) {
        content
    }
}
```

## Risks

-   As a breaking change, this could slow down the adoption from previous users.
-   Apart from the style of the API, this will lead to a tradeoff between more types and fewer fields.
-   Not applying the same design principles to the update operators, could result in a design inconsistency.

## Out of Scope

-   This RFC describes the style conceptually, declaring an operator from a new type rather than using a suffix in the field. Some operations and operators are not described in this RFC but they will be impacted as well.

### Security consideration

-   None
