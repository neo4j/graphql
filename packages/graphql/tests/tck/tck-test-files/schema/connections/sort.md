# Sort

Tests sort argument on connection fields

---

## sort argument is not present when nothing to sort

### TypeDefs

```graphql
type Node1 {
    property: String!
    relatedTo: [Node2!]! @relationship(type: "RELATED_TO", direction: OUT)
}

type Node2 {
    relatedTo: [Node1!]! @relationship(type: "RELATED_TO", direction: OUT)
}
```

### Output

```graphql
type CreateNode1sMutationResponse {
    node1s: [Node1!]!
}

type CreateNode2sMutationResponse {
    node2s: [Node2!]!
}

type DeleteInfo {
    nodesDeleted: Int!
    relationshipsDeleted: Int!
}

type Mutation {
    createNode1s(input: [Node1CreateInput!]!): CreateNode1sMutationResponse!
    deleteNode1s(where: Node1Where, delete: Node1DeleteInput): DeleteInfo!
    updateNode1s(
        where: Node1Where
        update: Node1UpdateInput
        connect: Node1ConnectInput
        disconnect: Node1DisconnectInput
        create: Node1RelationInput
        delete: Node1DeleteInput
    ): UpdateNode1sMutationResponse!
    createNode2s(input: [Node2CreateInput!]!): CreateNode2sMutationResponse!
    deleteNode2s(where: Node2Where, delete: Node2DeleteInput): DeleteInfo!
    updateNode2s(
        where: Node2Where
        update: Node2UpdateInput
        connect: Node2ConnectInput
        disconnect: Node2DisconnectInput
        create: Node2RelationInput
        delete: Node2DeleteInput
    ): UpdateNode2sMutationResponse!
}

type Node1 {
    property: String!
    relatedTo(where: Node2Where, options: Node2Options): [Node2!]!
    relatedToConnection(
        where: Node1RelatedToConnectionWhere
        first: Int
        after: String
    ): Node1RelatedToConnection!
}

input Node1ConnectInput {
    relatedTo: [Node1RelatedToConnectFieldInput!]
}

input Node1ConnectWhere {
    node: Node1Where!
}

input Node1CreateInput {
    property: String!
    relatedTo: Node1RelatedToFieldInput
}

input Node1DeleteInput {
    relatedTo: [Node1RelatedToDeleteFieldInput!]
}

input Node1DisconnectInput {
    relatedTo: [Node1RelatedToDisconnectFieldInput!]
}

input Node1Options {
    # Specify one or more Node1Sort objects to sort Node1s by. The sorts will be applied in the order in which they are arranged in the array.
    sort: [Node1Sort]
    limit: Int
    offset: Int
}

input Node1RelatedToConnectFieldInput {
    where: Node2ConnectWhere
    connect: [Node2ConnectInput!]
}

type Node1RelatedToConnection {
    edges: [Node1RelatedToRelationship!]!
    totalCount: Int!
    pageInfo: PageInfo!
}

input Node1RelatedToConnectionWhere {
    AND: [Node1RelatedToConnectionWhere!]
    OR: [Node1RelatedToConnectionWhere!]
    node: Node2Where
    node_NOT: Node2Where
}

input Node1RelatedToCreateFieldInput {
    node: Node2CreateInput!
}

input Node1RelatedToDeleteFieldInput {
    where: Node1RelatedToConnectionWhere
    delete: Node2DeleteInput
}

input Node1RelatedToDisconnectFieldInput {
    where: Node1RelatedToConnectionWhere
    disconnect: Node2DisconnectInput
}

input Node1RelatedToFieldInput {
    create: [Node1RelatedToCreateFieldInput!]
    connect: [Node1RelatedToConnectFieldInput!]
}

type Node1RelatedToRelationship {
    cursor: String!
    node: Node2!
}

input Node1RelatedToUpdateConnectionInput {
    node: Node2UpdateInput
}

input Node1RelatedToUpdateFieldInput {
    where: Node1RelatedToConnectionWhere
    update: Node1RelatedToUpdateConnectionInput
    connect: [Node1RelatedToConnectFieldInput!]
    disconnect: [Node1RelatedToDisconnectFieldInput!]
    create: [Node1RelatedToCreateFieldInput!]
    delete: [Node1RelatedToDeleteFieldInput!]
}

input Node1RelationInput {
    relatedTo: [Node1RelatedToCreateFieldInput!]
}

# Fields to sort Node1s by. The order in which sorts are applied is not guaranteed when specifying many fields in one Node1Sort object.
input Node1Sort {
    property: SortDirection
}

input Node1UpdateInput {
    property: String
    relatedTo: [Node1RelatedToUpdateFieldInput!]
}

input Node1Where {
    OR: [Node1Where!]
    AND: [Node1Where!]
    property: String
    property_NOT: String
    property_IN: [String]
    property_NOT_IN: [String]
    property_CONTAINS: String
    property_NOT_CONTAINS: String
    property_STARTS_WITH: String
    property_NOT_STARTS_WITH: String
    property_ENDS_WITH: String
    property_NOT_ENDS_WITH: String
    relatedTo: Node2Where
    relatedTo_NOT: Node2Where
}

type Node2 {
    relatedTo(where: Node1Where, options: Node1Options): [Node1!]!
    relatedToConnection(
        where: Node2RelatedToConnectionWhere
        first: Int
        after: String
        sort: [Node2RelatedToConnectionSort!]
    ): Node2RelatedToConnection!
}

input Node2ConnectInput {
    relatedTo: [Node2RelatedToConnectFieldInput!]
}

input Node2ConnectWhere {
    node: Node2Where!
}

input Node2CreateInput {
    relatedTo: Node2RelatedToFieldInput
}

input Node2DeleteInput {
    relatedTo: [Node2RelatedToDeleteFieldInput!]
}

input Node2DisconnectInput {
    relatedTo: [Node2RelatedToDisconnectFieldInput!]
}

input Node2Options {
    limit: Int
    offset: Int
}

input Node2RelatedToConnectFieldInput {
    where: Node1ConnectWhere
    connect: [Node1ConnectInput!]
}

type Node2RelatedToConnection {
    edges: [Node2RelatedToRelationship!]!
    totalCount: Int!
    pageInfo: PageInfo!
}

input Node2RelatedToConnectionSort {
    node: Node1Sort
}

input Node2RelatedToConnectionWhere {
    AND: [Node2RelatedToConnectionWhere!]
    OR: [Node2RelatedToConnectionWhere!]
    node: Node1Where
    node_NOT: Node1Where
}

input Node2RelatedToCreateFieldInput {
    node: Node1CreateInput!
}

input Node2RelatedToDeleteFieldInput {
    where: Node2RelatedToConnectionWhere
    delete: Node1DeleteInput
}

input Node2RelatedToDisconnectFieldInput {
    where: Node2RelatedToConnectionWhere
    disconnect: Node1DisconnectInput
}

input Node2RelatedToFieldInput {
    create: [Node2RelatedToCreateFieldInput!]
    connect: [Node2RelatedToConnectFieldInput!]
}

type Node2RelatedToRelationship {
    cursor: String!
    node: Node1!
}

input Node2RelatedToUpdateConnectionInput {
    node: Node1UpdateInput
}

input Node2RelatedToUpdateFieldInput {
    where: Node2RelatedToConnectionWhere
    update: Node2RelatedToUpdateConnectionInput
    connect: [Node2RelatedToConnectFieldInput!]
    disconnect: [Node2RelatedToDisconnectFieldInput!]
    create: [Node2RelatedToCreateFieldInput!]
    delete: [Node2RelatedToDeleteFieldInput!]
}

input Node2RelationInput {
    relatedTo: [Node2RelatedToCreateFieldInput!]
}

input Node2UpdateInput {
    relatedTo: [Node2RelatedToUpdateFieldInput!]
}

input Node2Where {
    OR: [Node2Where!]
    AND: [Node2Where!]
    relatedTo: Node1Where
    relatedTo_NOT: Node1Where
}

# Pagination information (Relay)
type PageInfo {
    hasNextPage: Boolean!
    hasPreviousPage: Boolean!
    startCursor: String!
    endCursor: String!
}

type Query {
    node1s(where: Node1Where, options: Node1Options): [Node1!]!
    node2s(where: Node2Where, options: Node2Options): [Node2!]!
    countNode1s(where: Node1Where): Int!
    countNode2s(where: Node2Where): Int!
}

enum SortDirection {
    # Sort by field values in ascending order.
    ASC

    # Sort by field values in descending order.
    DESC
}

type UpdateNode1sMutationResponse {
    node1s: [Node1!]!
}

type UpdateNode2sMutationResponse {
    node2s: [Node2!]!
}
```

---
