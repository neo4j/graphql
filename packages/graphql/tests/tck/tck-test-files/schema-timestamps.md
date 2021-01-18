## Schema TimeStamps

Tests that the provided typeDefs return the correct schema.

---

### TimeStamp

**TypeDefs**

```typedefs-input
type Movie {
    id: ID
    createdAt: DateTime! @autogenerate(operations: ["create"])
    updatedAt: DateTime! @autogenerate(operations: ["update"])
}
```

**Output**

```schema-output
"""A date and time, represented as an ISO-8601 string"""
scalar DateTime

type Movie {
  id: ID
  createdAt: DateTime!
  updatedAt: DateTime!
}

type DeleteInfo {
  nodesDeleted: Int!
  relationshipsDeleted: Int!
}

input MovieAND {
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
  id_REGEX: String
  createdAt: DateTime
  createdAt_LT: DateTime
  createdAt_LTE: DateTime
  createdAt_GT: DateTime
  createdAt_GTE: DateTime
  updatedAt: DateTime
  updatedAt_LT: DateTime
  updatedAt_LTE: DateTime
  updatedAt_GT: DateTime
  updatedAt_GTE: DateTime
  OR: [MovieOR]
  AND: [MovieAND]
}

input MovieCreateInput {
  id: ID
}

input MovieOptions {
  sort: [MovieSort]
  limit: Int
  skip: Int
}

input MovieOR {
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
  id_REGEX: String
  createdAt: DateTime
  createdAt_LT: DateTime
  createdAt_LTE: DateTime
  createdAt_GT: DateTime
  createdAt_GTE: DateTime
  updatedAt: DateTime
  updatedAt_LT: DateTime
  updatedAt_LTE: DateTime
  updatedAt_GT: DateTime
  updatedAt_GTE: DateTime
  OR: [MovieOR]
  AND: [MovieAND]
}

enum MovieSort {
  id_DESC
  id_ASC
  createdAt_ASC
  createdAt_DESC
  updatedAt_ASC
  updatedAt_DESC
}

input MovieWhere {
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
  id_REGEX: String
  createdAt: DateTime
  createdAt_LT: DateTime
  createdAt_LTE: DateTime
  createdAt_GT: DateTime
  createdAt_GTE: DateTime
  updatedAt: DateTime
  updatedAt_LT: DateTime
  updatedAt_LTE: DateTime
  updatedAt_GT: DateTime
  updatedAt_GTE: DateTime
  OR: [MovieOR]
  AND: [MovieAND]
}

input MovieUpdateInput {
  id: ID
}

type Mutation {
  createMovies(input: [MovieCreateInput]!): [Movie]!
  deleteMovies(where: MovieWhere): DeleteInfo!
  updateMovies(where: MovieWhere, update: MovieUpdateInput): [Movie]!
}

type Query {
  Movies(where: MovieWhere, options: MovieOptions): [Movie]!
}
```

---
