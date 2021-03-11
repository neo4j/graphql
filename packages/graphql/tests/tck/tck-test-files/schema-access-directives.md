## Schema Access Directives

Tests that the access directives @readonly and @writeonly work as expected.

---

### Simple

**TypeDefs**

```typedefs-input
type User {
    id: ID! @readonly
    username: String!
    password: String! @writeonly
}
```

**Output**

```schema-output
enum SortDirection {
  """Sort by field values in ascending order."""
  ASC
  """Sort by field values in descending order."""
  DESC
}

type User {
  id: ID!
  username: String!
}

type DeleteInfo {
  nodesDeleted: Int!
  relationshipsDeleted: Int!
}

input UserCreateInput {
  username: String!
  password: String!
}

input UserOptions {
  """Specify one or more UserSort objects to sort Users by. The sorts will be applied in the order in which they are arranged in the array."""
  sort: [UserSort]
  limit: Int
  skip: Int
}

"""Fields to sort Users by. The order in which sorts are applied is not guaranteed when specifying many fields in one UserSort object."""
input UserSort {
  id: SortDirection
  password: SortDirection
  username: SortDirection
}

input UserWhere {
  AND: [UserWhere!]
  id: ID
  id_CONTAINS: ID
  id_ENDS_WITH: ID
  id_IN: [ID]
  id_MATCHES: String
  id_NOT: ID
  id_NOT_CONTAINS: ID
  id_NOT_ENDS_WITH: ID
  id_NOT_IN: [ID]
  id_NOT_STARTS_WITH: ID
  id_STARTS_WITH: ID
  OR: [UserWhere!]
  password: String
  password_CONTAINS: String
  password_ENDS_WITH: String
  password_IN: [String]
  password_MATCHES: String
  password_NOT: String
  password_NOT_CONTAINS: String
  password_NOT_ENDS_WITH: String
  password_NOT_IN: [String]
  password_NOT_STARTS_WITH: String
  password_STARTS_WITH: String
  username: String
  username_CONTAINS: String
  username_ENDS_WITH: String
  username_IN: [String]
  username_MATCHES: String
  username_NOT: String
  username_NOT_CONTAINS: String
  username_NOT_ENDS_WITH: String
  username_NOT_IN: [String]
  username_NOT_STARTS_WITH: String
  username_STARTS_WITH: String
}

input UserUpdateInput {
  username: String
  password: String
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
  updateUsers(where: UserWhere, update: UserUpdateInput): UpdateUsersMutationResponse!
}

type Query {
  users(where: UserWhere, options: UserOptions): [User]!
}
```

---
