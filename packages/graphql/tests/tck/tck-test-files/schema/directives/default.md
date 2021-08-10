# Schema Default

Tests that the @default directive works as expected.

---

## Simple

### TypeDefs

```graphql
type User {
    id: ID! @default(value: "00000000-00000000-00000000-00000000")
    name: String! @default(value: "Jane Smith")
    verified: Boolean! @default(value: false)
    numberOfFriends: Int! @default(value: 0)
    rating: Float! @default(value: 0.0)
    verifiedDate: DateTime! @default(value: "1970-01-01T00:00:00.000Z")
}
```

### Output

```graphql
"""
A date and time, represented as an ISO-8601 string
"""
scalar DateTime

type User {
    id: ID!
    name: String!
    verified: Boolean!
    numberOfFriends: Int!
    rating: Float!
    verifiedDate: DateTime!
}

type DeleteInfo {
    nodesDeleted: Int!
    relationshipsDeleted: Int!
}

enum SortDirection {
    """
    Sort by field values in ascending order.
    """
    ASC
    """
    Sort by field values in descending order.
    """
    DESC
}

input UserCreateInput {
    id: ID! = "00000000-00000000-00000000-00000000"
    name: String! = "Jane Smith"
    verified: Boolean! = false
    numberOfFriends: Int! = 0
    rating: Float! = 0.0
    verifiedDate: DateTime! = "1970-01-01T00:00:00.000Z"
}

input UserOptions {
    """
    Specify one or more UserSort objects to sort Users by. The sorts will be applied in the order in which they are arranged in the array.
    """
    sort: [UserSort]
    limit: Int
    offset: Int
}

"""
Fields to sort Users by. The order in which sorts are applied is not guaranteed when specifying many fields in one UserSort object.
"""
input UserSort {
    id: SortDirection
    name: SortDirection
    verified: SortDirection
    numberOfFriends: SortDirection
    rating: SortDirection
    verifiedDate: SortDirection
}

input UserWhere {
    id: ID
    id_CONTAINS: ID
    id_ENDS_WITH: ID
    id_IN: [ID]
    id_NOT: ID
    id_NOT_CONTAINS: ID
    id_NOT_ENDS_WITH: ID
    id_NOT_IN: [ID]
    id_NOT_STARTS_WITH: ID
    id_STARTS_WITH: ID
    name: String
    name_CONTAINS: String
    name_ENDS_WITH: String
    name_IN: [String]
    name_NOT: String
    name_NOT_CONTAINS: String
    name_NOT_ENDS_WITH: String
    name_NOT_IN: [String]
    name_NOT_STARTS_WITH: String
    name_STARTS_WITH: String
    numberOfFriends: Int
    numberOfFriends_GT: Int
    numberOfFriends_GTE: Int
    numberOfFriends_IN: [Int]
    numberOfFriends_LT: Int
    numberOfFriends_LTE: Int
    numberOfFriends_NOT: Int
    numberOfFriends_NOT_IN: [Int]
    rating: Float
    rating_GT: Float
    rating_GTE: Float
    rating_IN: [Float]
    rating_LT: Float
    rating_LTE: Float
    rating_NOT: Float
    rating_NOT_IN: [Float]
    verified: Boolean
    verified_NOT: Boolean
    verifiedDate: DateTime
    verifiedDate_GT: DateTime
    verifiedDate_GTE: DateTime
    verifiedDate_IN: [DateTime]
    verifiedDate_LT: DateTime
    verifiedDate_LTE: DateTime
    verifiedDate_NOT: DateTime
    verifiedDate_NOT_IN: [DateTime]
    OR: [UserWhere!]
    AND: [UserWhere!]
}

input UserUpdateInput {
    id: ID
    name: String
    verified: Boolean
    numberOfFriends: Int
    rating: Float
    verifiedDate: DateTime
}

type CreateUsersMutationResponse {
    users: [User!]!
}

type UpdateUsersMutationResponse {
    users: [User!]!
}

type Mutation {
    createUsers(input: [UserCreateInput!]!): CreateUsersMutationResponse!
    deleteUsers(where: UserWhere): DeleteInfo!
    updateUsers(
        where: UserWhere
        update: UserUpdateInput
    ): UpdateUsersMutationResponse!
}

type Query {
    users(where: UserWhere, options: UserOptions): [User!]!
    usersCount(where: UserWhere): Int!
}
```

---
