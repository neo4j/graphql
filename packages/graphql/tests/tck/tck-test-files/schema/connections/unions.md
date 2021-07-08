## Schema -> Connections -> Unions

Tests that the provided typeDefs return the correct schema (with relationships).

---

### Relationship Properties

**TypeDefs**

```typedefs-input
union Publication = Book | Journal

type Author {
    name: String!
    publications: [Publication]
        @relationship(type: "WROTE", direction: OUT, properties: "Wrote")
}

type Book {
    title: String!
    author: [Author!]!
        @relationship(type: "WROTE", direction: IN, properties: "Wrote")
}

type Journal {
    subject: String!
    author: [Author!]!
        @relationship(type: "WROTE", direction: IN, properties: "Wrote")
}

interface Wrote {
    words: Int!
}
```

**Output**

```schema-output
type Author {
    name: String!
    publications(options: QueryOptions, where: PublicationWhere): [Publication]
    publicationsConnection(
        where: AuthorPublicationsConnectionWhere
    ): AuthorPublicationsConnection!
}

input AuthorConnectInput {
    publications: AuthorPublicationsConnectInput
}

input AuthorCreateInput {
    name: String!
    publications: AuthorPublicationsCreateInput
}

input AuthorDeleteInput {
    publications: AuthorPublicationsDeleteInput
}

input AuthorDisconnectInput {
    publications: AuthorPublicationsDisconnectInput
}

input AuthorOptions {
    """
    Specify one or more AuthorSort objects to sort Authors by. The sorts will be applied in the order in which they are arranged in the array.
    """
    sort: [AuthorSort]
    limit: Int
    offset: Int
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
    connect: [AuthorPublicationsBookConnectFieldInput!]
}

input AuthorPublicationsBookUpdateConnectionInput {
    node: BookUpdateInput
    relationship: WroteUpdateInput
}

input AuthorPublicationsBookUpdateFieldInput {
    where: AuthorPublicationsConnectionWhere
    update: AuthorPublicationsBookUpdateConnectionInput
    connect: [AuthorPublicationsBookConnectFieldInput!]
    disconnect: [AuthorPublicationsBookDisconnectFieldInput!]
    create: [AuthorPublicationsBookCreateFieldInput!]
    delete: [AuthorPublicationsBookDeleteFieldInput!]
}

input BookConnectWhere {
    node: BookWhere!
}

input JournalConnectWhere {
    node: JournalWhere!
}

input AuthorPublicationsBookConnectFieldInput {
    where: BookConnectWhere
    connect: [BookConnectInput!]
    properties: WroteCreateInput!
}

input AuthorPublicationsJournalConnectFieldInput {
    where: JournalConnectWhere
    connect: [JournalConnectInput!]
    properties: WroteCreateInput!
}

type AuthorPublicationsConnection {
    edges: [AuthorPublicationsRelationship!]!
    pageInfo: PageInfo!
    totalCount: Int!
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

input AuthorPublicationsConnectInput {
    Book: [AuthorPublicationsBookConnectFieldInput!]
    Journal: [AuthorPublicationsJournalConnectFieldInput!]
}

input AuthorPublicationsCreateInput {
    Book: AuthorPublicationsBookFieldInput
    Journal: AuthorPublicationsJournalFieldInput
}

input AuthorPublicationsDeleteInput {
    Book: [AuthorPublicationsBookDeleteFieldInput!]
    Journal: [AuthorPublicationsJournalDeleteFieldInput!]
}

input AuthorPublicationsDisconnectInput {
    Book: [AuthorPublicationsBookDisconnectFieldInput!]
    Journal: [AuthorPublicationsJournalDisconnectFieldInput!]
}

input AuthorPublicationsUpdateInput {
    Book: [AuthorPublicationsBookUpdateFieldInput!]
    Journal: [AuthorPublicationsJournalUpdateFieldInput!]
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
    connect: [AuthorPublicationsJournalConnectFieldInput!]
}

input AuthorPublicationsJournalUpdateConnectionInput {
    node: JournalUpdateInput
    relationship: WroteUpdateInput
}

input AuthorPublicationsJournalUpdateFieldInput {
    where: AuthorPublicationsConnectionWhere
    update: AuthorPublicationsJournalUpdateConnectionInput
    connect: [AuthorPublicationsJournalConnectFieldInput!]
    disconnect: [AuthorPublicationsJournalDisconnectFieldInput!]
    create: [AuthorPublicationsJournalCreateFieldInput!]
    delete: [AuthorPublicationsJournalDeleteFieldInput!]
}

type AuthorPublicationsRelationship implements Wrote {
    cursor: String!
    node: Publication!
    words: Int!
}

input AuthorRelationInput {
    publications: AuthorPublicationsCreateInput
}

"""
Fields to sort Authors by. The order in which sorts are applied is not guaranteed when specifying many fields in one AuthorSort object.
"""
input AuthorSort {
    name: SortDirection
}

input AuthorUpdateInput {
    name: String
    publications: AuthorPublicationsUpdateInput
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
        after: String
        first: Int
        where: BookAuthorConnectionWhere
        sort: [BookAuthorConnectionSort!]
    ): BookAuthorConnection!
}

input AuthorConnectWhere {
    node: AuthorWhere!
}

input BookAuthorConnectFieldInput {
    where: AuthorConnectWhere
    connect: [AuthorConnectInput!]
    properties: WroteCreateInput!
}

type BookAuthorConnection {
    edges: [BookAuthorRelationship!]!
    pageInfo: PageInfo!
    totalCount: Int!
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
    cursor: String!
    node: Author!
    words: Int!
}

input BookAuthorUpdateConnectionInput {
    node: AuthorUpdateInput
    relationship: WroteUpdateInput
}

input BookAuthorUpdateFieldInput {
    where: BookAuthorConnectionWhere
    update: BookAuthorUpdateConnectionInput
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
    offset: Int
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
        after: String
        first: Int
        where: JournalAuthorConnectionWhere
        sort: [JournalAuthorConnectionSort!]
    ): JournalAuthorConnection!
}

input JournalAuthorConnectFieldInput {
    where: AuthorConnectWhere
    connect: [AuthorConnectInput!]
    properties: WroteCreateInput!
}

type JournalAuthorConnection {
    edges: [JournalAuthorRelationship!]!
    pageInfo: PageInfo!
    totalCount: Int!
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
    cursor: String!
    node: Author!
    words: Int!
}

input JournalAuthorUpdateConnectionInput {
    node: AuthorUpdateInput
    relationship: WroteUpdateInput
}

input JournalAuthorUpdateFieldInput {
    where: JournalAuthorConnectionWhere
    update: JournalAuthorUpdateConnectionInput
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
    offset: Int
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
    updateAuthors(
        where: AuthorWhere
        update: AuthorUpdateInput
        connect: AuthorConnectInput
        disconnect: AuthorDisconnectInput
        create: AuthorRelationInput
        delete: AuthorDeleteInput
    ): UpdateAuthorsMutationResponse!
    createBooks(input: [BookCreateInput!]!): CreateBooksMutationResponse!
    deleteBooks(where: BookWhere, delete: BookDeleteInput): DeleteInfo!
    updateBooks(
        where: BookWhere
        update: BookUpdateInput
        connect: BookConnectInput
        disconnect: BookDisconnectInput
        create: BookRelationInput
        delete: BookDeleteInput
    ): UpdateBooksMutationResponse!
    createJournals(
        input: [JournalCreateInput!]!
    ): CreateJournalsMutationResponse!
    deleteJournals(where: JournalWhere, delete: JournalDeleteInput): DeleteInfo!
    updateJournals(
        where: JournalWhere
        update: JournalUpdateInput
        connect: JournalConnectInput
        disconnect: JournalDisconnectInput
        create: JournalRelationInput
        delete: JournalDeleteInput
    ): UpdateJournalsMutationResponse!
}

union Publication = Book | Journal

input PublicationWhere {
    Book: BookWhere
    Journal: JournalWhere
}

"""
Pagination information (Relay)
"""
type PageInfo {
    hasNextPage: Boolean!
    hasPreviousPage: Boolean!
    startCursor: String!
    endCursor: String!
}

type Query {
    authors(where: AuthorWhere, options: AuthorOptions): [Author!]!
    books(where: BookWhere, options: BookOptions): [Book!]!
    journals(where: JournalWhere, options: JournalOptions): [Journal!]!
}

input QueryOptions {
    offset: Int
    limit: Int
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
