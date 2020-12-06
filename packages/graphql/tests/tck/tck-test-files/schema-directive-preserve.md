## Schema Preserve Directives

Tests that the provided typeDefs return the correct schema(with preserving directives).

---

### Preserve Directives

**TypeDefs**

```typedefs-input
directive @preservedTopLevel(string: String, int: Int, float: Float, boolean: Boolean) on OBJECT 
directive @preservedFieldLevel(string: String, int: Int, float: Float, boolean: Boolean) on FIELD_DEFINITION

type Movie @preservedTopLevel {
    id: ID @preservedFieldLevel(string: "str", int: 12, float: 1.2, boolean: true)
}
```

**Output**

```schema-output
directive @preservedTopLevel(string: String, int: Int, float: Float, boolean: Boolean) on OBJECT 
directive @preservedFieldLevel(string: String, int: Int, float: Float, boolean: Boolean) on FIELD_DEFINITION

type Movie @preservedTopLevel {
  id: ID @preservedFieldLevel(string: "str", int: 12, float: 1.2, boolean: true)
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