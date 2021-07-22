# Schema -> Connections -> Unions

Tests that the provided typeDefs return the correct schema (with relationships).

---

## Relationship Properties

### TypeDefs

```graphql
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

### Output

```graphql
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

input AuthorConnectWhere {
    node: AuthorWhere!
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

input AuthorPublicationsBookConnectFieldInput {
    where: BookConnectWhere
    connect: [BookConnectInput!]
    relationship: WroteCreateInput!
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
    relationship: WroteCreateInput!
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
    relationship: WroteUpdateInput
    node: BookUpdateInput
}

input AuthorPublicationsBookUpdateFieldInput {
    where: AuthorPublicationsBookConnectionWhere
    update: AuthorPublicationsBookUpdateConnectionInput
    connect: [AuthorPublicationsBookConnectFieldInput!]
    disconnect: [AuthorPublicationsBookDisconnectFieldInput!]
    create: [AuthorPublicationsBookCreateFieldInput!]
    delete: [AuthorPublicationsBookDeleteFieldInput!]
}

input AuthorPublicationsConnectInput {
    Book: [AuthorPublicationsBookConnectFieldInput!]
    Journal: [AuthorPublicationsJournalConnectFieldInput!]
}

type AuthorPublicationsConnection {
    edges: [AuthorPublicationsRelationship!]!
    totalCount: Int!
    pageInfo: PageInfo!
}

input AuthorPublicationsConnectionBookWhere {
    OR: [AuthorPublicationsConnectionBookWhere]
    AND: [AuthorPublicationsConnectionBookWhere]
    node: BookWhere
    node_NOT: BookWhere
    relationship: WroteWhere
    relationship_NOT: WroteWhere
}

input AuthorPublicationsConnectionJournalWhere {
    OR: [AuthorPublicationsConnectionJournalWhere]
    AND: [AuthorPublicationsConnectionJournalWhere]
    node: JournalWhere
    node_NOT: JournalWhere
    relationship: WroteWhere
    relationship_NOT: WroteWhere
}

input AuthorPublicationsConnectionWhere {
    Book: AuthorPublicationsConnectionBookWhere
    Journal: AuthorPublicationsConnectionJournalWhere
}

input AuthorPublicationsCreateFieldInput {
    Book: [AuthorPublicationsBookCreateFieldInput!]
    Journal: [AuthorPublicationsJournalCreateFieldInput!]
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

input AuthorPublicationsJournalConnectFieldInput {
    where: JournalConnectWhere
    connect: [JournalConnectInput!]
    relationship: WroteCreateInput!
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
    relationship: WroteCreateInput!
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
    relationship: WroteUpdateInput
    node: JournalUpdateInput
}

input AuthorPublicationsJournalUpdateFieldInput {
    where: AuthorPublicationsJournalConnectionWhere
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

input AuthorPublicationsUpdateInput {
    Book: [AuthorPublicationsBookUpdateFieldInput!]
    Journal: [AuthorPublicationsJournalUpdateFieldInput!]
}

input AuthorRelationInput {
    publications: AuthorPublicationsCreateFieldInput
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
    publicationsConnection: AuthorPublicationsConnectionWhere
    publicationsConnection_NOT: AuthorPublicationsConnectionWhere
}

type Book {
    title: String!
    author(where: AuthorWhere, options: AuthorOptions): [Author!]!
    authorConnection(
        where: BookAuthorConnectionWhere
        sort: [BookAuthorConnectionSort!]
        first: Int
        after: String
    ): BookAuthorConnection!
}

input BookAuthorConnectFieldInput {
    where: AuthorConnectWhere
    connect: [AuthorConnectInput!]
    relationship: WroteCreateInput!
}

type BookAuthorConnection {
    edges: [BookAuthorRelationship!]!
    totalCount: Int!
    pageInfo: PageInfo!
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
    relationship: WroteCreateInput!
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

input BookConnectWhere {
    node: BookWhere!
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
    authorConnection: BookAuthorConnectionWhere
    authorConnection_NOT: BookAuthorConnectionWhere
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
        where: JournalAuthorConnectionWhere
        sort: [JournalAuthorConnectionSort!]
        first: Int
        after: String
    ): JournalAuthorConnection!
}

input JournalAuthorConnectFieldInput {
    where: AuthorConnectWhere
    connect: [AuthorConnectInput!]
    relationship: WroteCreateInput!
}

type JournalAuthorConnection {
    edges: [JournalAuthorRelationship!]!
    totalCount: Int!
    pageInfo: PageInfo!
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
    relationship: WroteCreateInput!
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

input JournalConnectWhere {
    node: JournalWhere!
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
    authorConnection: JournalAuthorConnectionWhere
    authorConnection_NOT: JournalAuthorConnectionWhere
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

"""
Pagination information (Relay)
"""
type PageInfo {
    hasNextPage: Boolean!
    hasPreviousPage: Boolean!
    startCursor: String!
    endCursor: String!
}

union Publication = Book | Journal

input PublicationWhere {
    Book: BookWhere
    Journal: JournalWhere
}

type Query {
    authors(where: AuthorWhere, options: AuthorOptions): [Author!]!
    books(where: BookWhere, options: BookOptions): [Book!]!
    journals(where: JournalWhere, options: JournalOptions): [Journal!]!
    authorsCount(where: AuthorWhere): Int!
    booksCount(where: BookWhere): Int!
    journalsCount(where: JournalWhere): Int!
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
