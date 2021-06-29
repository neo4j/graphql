## Schema -> Connections -> Unions

Tests that the provided typeDefs return the correct schema (with relationships).

---

### Relationship Properties

**TypeDefs**

```typedefs-input
union Publication = Book | Journal

type Author {
    name: String!
    publications: [Publication] @relationship(type: "WROTE", direction: OUT, properties: "Wrote")
}

type Book {
    title: String!
    author: [Author!]! @relationship(type: "WROTE", direction: IN, properties: "Wrote")
}

type Journal {
    subject: String!
    author: [Author!]! @relationship(type: "WROTE", direction: IN, properties: "Wrote")
}

interface Wrote {
    words: Int!
}
```

**Output**

```schema-output
type Author {
  name: String!
  publications(options: QueryOptions, Book: BookWhere, Journal: JournalWhere): [Publication]
  publicationsConnection(where: AuthorPublicationsConnectionWhere): AuthorPublicationsConnection!
}

input AuthorConnectInput {
  publications_Book: [AuthorPublicationsConnectFieldInput!]
  publications_Journal: [AuthorPublicationsConnectFieldInput!]
}

input AuthorCreateInput {
  name: String!
  publications_Book: AuthorPublicationsBookFieldInput
  publications_Journal: AuthorPublicationsJournalFieldInput
}

input AuthorDeleteInput {
  publications_Book: [AuthorPublicationsBookDeleteFieldInput!]
  publications_Journal: [AuthorPublicationsJournalDeleteFieldInput!]
}

input AuthorDisconnectInput {
  publications_Book: [AuthorPublicationsBookDisconnectFieldInput!]
  publications_Journal: [AuthorPublicationsJournalDisconnectFieldInput!]
}

input AuthorOptions {
  """
  Specify one or more AuthorSort objects to sort Authors by. The sorts will be applied in the order in which they are arranged in the array.
  """
  sort: [AuthorSort]
  limit: Int
  skip: Int
}

input AuthorPublicationsBookConnectionWhere {
  node: BookWhere
  node_NOT: BookWhere
  AND: [AuthorPublicationsBookConnectionWhere!]
  OR: [AuthorPublicationsBookConnectionWhere!]
  relationship: WroteWhere
  relationship_NOT: WroteWhere
}

input AuthorPublicationsBookCreateFieldInput {
  node: BookCreateInput!
  properties: WroteCreateInput!
}

input AuthorPublicationsBookDeleteFieldInput {
  where: AuthorPublicationsBookConnectionWhere
  delete: BookDeleteInput
}

input AuthorPublicationsBookDisconnectFieldInput {
  where: AuthorPublicationsBookConnectionWhere
  disconnect: BookDisconnectInput
}

input AuthorPublicationsBookFieldInput {
  create: [AuthorPublicationsBookCreateFieldInput!]
  connect: [AuthorPublicationsConnectFieldInput!]
}

input AuthorPublicationsBookUpdateFieldInput {
  properties: WroteUpdateInput
  where: AuthorPublicationsConnectionWhere
  update: BookUpdateInput
  connect: [AuthorPublicationsConnectFieldInput!]
  disconnect: [AuthorPublicationsBookDisconnectFieldInput!]
  create: [AuthorPublicationsBookCreateFieldInput!]
  delete: [AuthorPublicationsBookDeleteFieldInput!]
}

input AuthorPublicationsConnectFieldInput {
  where: BookWhere
  connect: [BookConnectInput!]
  properties: WroteCreateInput!
}

type AuthorPublicationsConnection {
  edges: [AuthorPublicationsRelationship!]!
}

input AuthorPublicationsConnectionWhere {
  AND: [AuthorPublicationsConnectionWhere!]
  OR: [AuthorPublicationsConnectionWhere!]
  relationship: WroteWhere
  relationship_NOT: WroteWhere
  Book: BookWhere
  Book_NOT: BookWhere
  Journal: JournalWhere
  Journal_NOT: JournalWhere
}

input AuthorPublicationsJournalConnectionWhere {
  node: JournalWhere
  node_NOT: JournalWhere
  AND: [AuthorPublicationsJournalConnectionWhere!]
  OR: [AuthorPublicationsJournalConnectionWhere!]
  relationship: WroteWhere
  relationship_NOT: WroteWhere
}

input AuthorPublicationsJournalCreateFieldInput {
  node: JournalCreateInput!
  properties: WroteCreateInput!
}

input AuthorPublicationsJournalDeleteFieldInput {
  where: AuthorPublicationsJournalConnectionWhere
  delete: JournalDeleteInput
}

input AuthorPublicationsJournalDisconnectFieldInput {
  where: AuthorPublicationsJournalConnectionWhere
  disconnect: JournalDisconnectInput
}

input AuthorPublicationsJournalFieldInput {
  create: [AuthorPublicationsJournalCreateFieldInput!]
  connect: [AuthorPublicationsConnectFieldInput!]
}

input AuthorPublicationsJournalUpdateFieldInput {
  properties: WroteUpdateInput
  where: AuthorPublicationsConnectionWhere
  update: JournalUpdateInput
  connect: [AuthorPublicationsConnectFieldInput!]
  disconnect: [AuthorPublicationsJournalDisconnectFieldInput!]
  create: [AuthorPublicationsJournalCreateFieldInput!]
  delete: [AuthorPublicationsJournalDeleteFieldInput!]
}

type AuthorPublicationsRelationship implements Wrote {
  node: Publication!
  words: Int!
}

input AuthorRelationInput {
  publications_Book: [AuthorPublicationsBookCreateFieldInput!]
  publications_Journal: [AuthorPublicationsJournalCreateFieldInput!]
}

"""
Fields to sort Authors by. The order in which sorts are applied is not guaranteed when specifying many fields in one AuthorSort object.
"""
input AuthorSort {
  name: SortDirection
}

input AuthorUpdateInput {
  name: String
  publications_Book: [AuthorPublicationsBookUpdateFieldInput!]
  publications_Journal: [AuthorPublicationsJournalUpdateFieldInput!]
}

input AuthorWhere {
  OR: [AuthorWhere!]
  AND: [AuthorWhere!]
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

type Book {
  title: String!
  author(where: AuthorWhere, options: AuthorOptions): [Author!]!
  authorConnection(
    where: BookAuthorConnectionWhere, 
    options: BookAuthorConnectionOptions
  ): BookAuthorConnection!
}

input BookAuthorConnectFieldInput {
  where: AuthorWhere
  connect: [AuthorConnectInput!]
  properties: WroteCreateInput!
}

type BookAuthorConnection {
  edges: [BookAuthorRelationship!]!
}

input BookAuthorConnectionOptions {
  sort: [BookAuthorConnectionSort!]
}

input BookAuthorConnectionSort {
  node: AuthorSort
  relationship: WroteSort
}

input BookAuthorConnectionWhere {
  AND: [BookAuthorConnectionWhere!]
  OR: [BookAuthorConnectionWhere!]
  relationship: WroteWhere
  relationship_NOT: WroteWhere
  node: AuthorWhere
  node_NOT: AuthorWhere
}

input BookAuthorCreateFieldInput {
  node: AuthorCreateInput!
  properties: WroteCreateInput!
}

input BookAuthorDeleteFieldInput {
  where: BookAuthorConnectionWhere
  delete: AuthorDeleteInput
}

input BookAuthorDisconnectFieldInput {
  where: BookAuthorConnectionWhere
  disconnect: AuthorDisconnectInput
}

input BookAuthorFieldInput {
  create: [BookAuthorCreateFieldInput!]
  connect: [BookAuthorConnectFieldInput!]
}

type BookAuthorRelationship implements Wrote {
  node: Author!
  words: Int!
}

input BookAuthorUpdateFieldInput {
  properties: WroteUpdateInput
  where: BookAuthorConnectionWhere
  update: AuthorUpdateInput
  connect: [BookAuthorConnectFieldInput!]
  disconnect: [BookAuthorDisconnectFieldInput!]
  create: [BookAuthorCreateFieldInput!]
  delete: [BookAuthorDeleteFieldInput!]
}

input BookConnectInput {
  author: [BookAuthorConnectFieldInput!]
}

input BookCreateInput {
  title: String!
  author: BookAuthorFieldInput
}

input BookDeleteInput {
  author: [BookAuthorDeleteFieldInput!]
}

input BookDisconnectInput {
  author: [BookAuthorDisconnectFieldInput!]
}

input BookOptions {
  """
  Specify one or more BookSort objects to sort Books by. The sorts will be applied in the order in which they are arranged in the array.
  """
  sort: [BookSort]
  limit: Int
  skip: Int
}

input BookRelationInput {
  author: [BookAuthorCreateFieldInput!]
}

"""
Fields to sort Books by. The order in which sorts are applied is not guaranteed when specifying many fields in one BookSort object.
"""
input BookSort {
  title: SortDirection
}

input BookUpdateInput {
  title: String
  author: [BookAuthorUpdateFieldInput!]
}

input BookWhere {
  OR: [BookWhere!]
  AND: [BookWhere!]
  title: String
  title_NOT: String
  title_IN: [String]
  title_NOT_IN: [String]
  title_CONTAINS: String
  title_NOT_CONTAINS: String
  title_STARTS_WITH: String
  title_NOT_STARTS_WITH: String
  title_ENDS_WITH: String
  title_NOT_ENDS_WITH: String
  author: AuthorWhere
  author_NOT: AuthorWhere
}

type CreateAuthorsMutationResponse {
  authors: [Author!]!
}

type CreateBooksMutationResponse {
  books: [Book!]!
}

type CreateJournalsMutationResponse {
  journals: [Journal!]!
}

type DeleteInfo {
  nodesDeleted: Int!
  relationshipsDeleted: Int!
}

type Journal {
  subject: String!
  author(where: AuthorWhere, options: AuthorOptions): [Author!]!
  authorConnection(
    where: JournalAuthorConnectionWhere, 
    options: JournalAuthorConnectionOptions
  ): JournalAuthorConnection!
}

input JournalAuthorConnectFieldInput {
  where: AuthorWhere
  connect: [AuthorConnectInput!]
  properties: WroteCreateInput!
}

type JournalAuthorConnection {
  edges: [JournalAuthorRelationship!]!
}

input JournalAuthorConnectionOptions {
  sort: [JournalAuthorConnectionSort!]
}

input JournalAuthorConnectionSort {
  node: AuthorSort
  relationship: WroteSort
}

input JournalAuthorConnectionWhere {
  AND: [JournalAuthorConnectionWhere!]
  OR: [JournalAuthorConnectionWhere!]
  relationship: WroteWhere
  relationship_NOT: WroteWhere
  node: AuthorWhere
  node_NOT: AuthorWhere
}

input JournalAuthorCreateFieldInput {
  node: AuthorCreateInput!
  properties: WroteCreateInput!
}

input JournalAuthorDeleteFieldInput {
  where: JournalAuthorConnectionWhere
  delete: AuthorDeleteInput
}

input JournalAuthorDisconnectFieldInput {
  where: JournalAuthorConnectionWhere
  disconnect: AuthorDisconnectInput
}

input JournalAuthorFieldInput {
  create: [JournalAuthorCreateFieldInput!]
  connect: [JournalAuthorConnectFieldInput!]
}

type JournalAuthorRelationship implements Wrote {
  node: Author!
  words: Int!
}

input JournalAuthorUpdateFieldInput {
  properties: WroteUpdateInput
  where: JournalAuthorConnectionWhere
  update: AuthorUpdateInput
  connect: [JournalAuthorConnectFieldInput!]
  disconnect: [JournalAuthorDisconnectFieldInput!]
  create: [JournalAuthorCreateFieldInput!]
  delete: [JournalAuthorDeleteFieldInput!]
}

input JournalConnectInput {
  author: [JournalAuthorConnectFieldInput!]
}

input JournalCreateInput {
  subject: String!
  author: JournalAuthorFieldInput
}

input JournalDeleteInput {
  author: [JournalAuthorDeleteFieldInput!]
}

input JournalDisconnectInput {
  author: [JournalAuthorDisconnectFieldInput!]
}

input JournalOptions {
  """
  Specify one or more JournalSort objects to sort Journals by. The sorts will be applied in the order in which they are arranged in the array.
  """
  sort: [JournalSort]
  limit: Int
  skip: Int
}

input JournalRelationInput {
  author: [JournalAuthorCreateFieldInput!]
}

"""
Fields to sort Journals by. The order in which sorts are applied is not guaranteed when specifying many fields in one JournalSort object.
"""
input JournalSort {
  subject: SortDirection
}

input JournalUpdateInput {
  subject: String
  author: [JournalAuthorUpdateFieldInput!]
}

input JournalWhere {
  OR: [JournalWhere!]
  AND: [JournalWhere!]
  subject: String
  subject_NOT: String
  subject_IN: [String]
  subject_NOT_IN: [String]
  subject_CONTAINS: String
  subject_NOT_CONTAINS: String
  subject_STARTS_WITH: String
  subject_NOT_STARTS_WITH: String
  subject_ENDS_WITH: String
  subject_NOT_ENDS_WITH: String
  author: AuthorWhere
  author_NOT: AuthorWhere
}

type Mutation {
  createAuthors(input: [AuthorCreateInput!]!): CreateAuthorsMutationResponse!
  deleteAuthors(where: AuthorWhere, delete: AuthorDeleteInput): DeleteInfo!
  updateAuthors(where: AuthorWhere, update: AuthorUpdateInput, connect: AuthorConnectInput, disconnect: AuthorDisconnectInput, create: AuthorRelationInput, delete: AuthorDeleteInput): UpdateAuthorsMutationResponse!
  createBooks(input: [BookCreateInput!]!): CreateBooksMutationResponse!
  deleteBooks(where: BookWhere, delete: BookDeleteInput): DeleteInfo!
  updateBooks(where: BookWhere, update: BookUpdateInput, connect: BookConnectInput, disconnect: BookDisconnectInput, create: BookRelationInput, delete: BookDeleteInput): UpdateBooksMutationResponse!
  createJournals(input: [JournalCreateInput!]!): CreateJournalsMutationResponse!
  deleteJournals(where: JournalWhere, delete: JournalDeleteInput): DeleteInfo!
  updateJournals(where: JournalWhere, update: JournalUpdateInput, connect: JournalConnectInput, disconnect: JournalDisconnectInput, create: JournalRelationInput, delete: JournalDeleteInput): UpdateJournalsMutationResponse!
}

union Publication = Book | Journal

"""Globally-identifiable node (Relay)"""
interface Node {
  id: ID!
}

type Query {
  authors(where: AuthorWhere, options: AuthorOptions): [Author!]!
  books(where: BookWhere, options: BookOptions): [Book!]!
  journals(where: JournalWhere, options: JournalOptions): [Journal!]!
  node(id: ID!): Node!
}

input QueryOptions {
  skip: Int
  limit: Int
}

enum SortDirection {
  """Sort by field values in ascending order."""
  ASC

  """Sort by field values in descending order."""
  DESC
}

type UpdateAuthorsMutationResponse {
  authors: [Author!]!
}

type UpdateBooksMutationResponse {
  books: [Book!]!
}

type UpdateJournalsMutationResponse {
  journals: [Journal!]!
}

interface Wrote {
  words: Int!
}

input WroteCreateInput {
  words: Int!
}

input WroteSort {
  words: SortDirection
}

input WroteUpdateInput {
  words: Int
}

input WroteWhere {
  OR: [WroteWhere!]
  AND: [WroteWhere!]
  words: Int
  words_NOT: Int
  words_IN: [Int]
  words_NOT_IN: [Int]
  words_LT: Int
  words_LTE: Int
  words_GT: Int
  words_GTE: Int
}
```

---
