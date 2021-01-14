## Schema autogenerate directive

Tests that the autogenerate directive produces the correct schema.

---

### Simple

**TypeDefs**

```typedefs-input
type Movie {
    id: ID! @autogenerate
}
```

**Output**

```schema-output
type Movie {
  id: ID!
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
  OR: [MovieOR]
  AND: [MovieAND]
}

input MovieCreateInput {
  id: ID = "autogenerate"
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
  OR: [MovieOR]
  AND: [MovieAND]
}

enum MovieSort {
  id_DESC
  id_ASC
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
