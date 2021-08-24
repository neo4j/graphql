# Schema BigInt

Tests that the provided typeDefs return the correct schema.

---

## BigInt

### TypeDefs

```graphql
type File {
    name: String!
    size: BigInt!
}
```

### Output

```graphql
"""
A BigInt value up to 64 bits in size, which can be a number or a string if used inline, or a string only if used as a variable. Always returned as a string.
"""
scalar BigInt

type CreateInfo {
    bookmark: String
    nodesCreated: Int!
    relationshipsCreated: Int!
}

type UpdateInfo {
    bookmark: String
    nodesCreated: Int!
    nodesDeleted: Int!
    relationshipsCreated: Int!
    relationshipsDeleted: Int!
}

type File {
    name: String!
    size: BigInt!
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

input FileCreateInput {
    name: String!
    size: BigInt!
}

input FileOptions {
    """
    Specify one or more FileSort objects to sort Files by. The sorts will be applied in the order in which they are arranged in the array.
    """
    sort: [FileSort]
    limit: Int
    offset: Int
}

"""
Fields to sort Files by. The order in which sorts are applied is not guaranteed when specifying many fields in one FileSort object.
"""
input FileSort {
    name: SortDirection
    size: SortDirection
}

input FileWhere {
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
    size: BigInt
    size_IN: [BigInt]
    size_NOT: BigInt
    size_NOT_IN: [BigInt]
    size_LT: BigInt
    size_LTE: BigInt
    size_GT: BigInt
    size_GTE: BigInt
    OR: [FileWhere!]
    AND: [FileWhere!]
}

input FileUpdateInput {
    name: String
    size: BigInt
}

type CreateFilesMutationResponse {
    info: CreateInfo!
    files: [File!]!
}

type UpdateFilesMutationResponse {
    info: UpdateInfo!
    files: [File!]!
}

type Mutation {
    createFiles(input: [FileCreateInput!]!): CreateFilesMutationResponse!
    deleteFiles(where: FileWhere): DeleteInfo!
    updateFiles(
        where: FileWhere
        update: FileUpdateInput
    ): UpdateFilesMutationResponse!
}

type Query {
    files(where: FileWhere, options: FileOptions): [File!]!
    filesCount(where: FileWhere): Int!
}
```

---
