# Schema Private

Tests private fields are not included in the schema.

---

## Simple

### TypeDefs

```graphql
type User {
    id: ID
    password: String @private
}
```

### Output

```graphql
type User {
    id: ID
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
    id: ID
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
}

input UserWhere {
    id: ID
    id_IN: [ID]
    id_NOT: ID
    id_NOT_IN: [ID]
    id_CONTAINS: ID
    id_NOT_CONTAINS: ID
    id_STARTS_WITH: ID
    id_NOT_STARTS_WITH: ID
    id_ENDS_WITH: ID
    id_NOT_ENDS_WITH: ID
    OR: [UserWhere!]
    AND: [UserWhere!]
}

input UserUpdateInput {
    id: ID
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
