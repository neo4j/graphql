# Authorization

This RFC documents the proposal to add new authorization functionality into the Neo4j GraphQL Library to replace the existing `@auth` directive.

## Instantiation

Requirements gathered from the various methods of verifying JWTs using `jose`:

* <https://github.com/panva/jose/blob/main/docs/functions/jwt_verify.jwtVerify.md>
* <https://github.com/panva/jose/blob/main/docs/functions/jwks_remote.createRemoteJWKSet.md>

For now we will support only secret keys and JWKS as we currently support, but objects for SPKI and JWK keys could be supported in future.

```ts
type RemoteJWKS = {
  url: string | URL;
  // https://github.com/panva/jose/blob/main/docs/functions/jwks_remote.createRemoteJWKSet.md
  options: RemoteJWKSetOptions;
}

type Key = string | RemoteJWKS

type AuthConfig = {
  key: Key | ((req: RequestLike) => Key);
  verify: boolean;
  // https://github.com/panva/jose/blob/main/docs/interfaces/jwt_verify.JWTVerifyOptions.md
  verifyOptions: JWTVerifyOptions;
}
```

`AuthConfig.key` will assume symmetric type if passed a string, or other types by passing in different objects. This will allow us to use the same configuration for a variety of secret types. `jose` also supports SPKI encoded RSA keys. This can also be a function executed using the request context to return the same object.

`AuthConfig.verify` will be `true` by default, but can be set to `false` if the desired behaviour is to decode only.

`AuthConfig.verifyOptions` allows configuration of the JWT verify options in `jose`. It will simply passthrough the types used directly by `jose`. The `JWTVerifyOptions` and also the `RemoteJWKSetOptions` will need to be re-exported for TypeScript users.

To configure auth with a symmetric secret "secret", the following can be executed:

```ts
new Neo4jGraphQL({
  typeDefs,
  features: {
    auth: {
      key: "secret",
    }
  }
})
```

## JWT Payload

As part of this proposal, users will be able to define the structure of their JWT payload using two GraphQL directives:

```gql
directive @jwtPayload on OBJECT
directive @jwtClaim(
  path: String!
) on FIELD_DEFINITION
```

These directives are for flagging the structure for the representation of the JWT payload structure.

The `@jwtPayload` directive can be used only once in a user's type definitions, and flags the object representing the payload. The type decorated with `@jwtPayload` will only be allowed to contain fields of primitive types, or their list variants.

The `@jwtClaim` directive can only be used within the type flagged with the `@jwtPayload` directive. It only needs to be used if the GraphQL fieldname isn't a direct map to the JWT claim.

Then a type such as the following can be included in users' type definitions:

```gql
type JWTPayload @jwtPayload {
  roles: [String!]!
  application1Groups: [String!]! @jwtClaim(path: "applications[0].groups")
}
```

This will be used for the generation of filters later down the line.

We will automatically map the Registered Claim Names according to the JWT specification (https://www.rfc-editor.org/rfc/rfc7519#section-4.1):

* `iss`
* `sub`
* `aud`
* `exp`
* `nbf`
* `iat`
* `jti`

## Directive

The directive for authorization will not be a "static directive" with a single definition - its definition will vary based on the type it is applied to.

To explore this, we will use the following type definitions:

```gql
type Post {
    content: String!
    author: User! @relationship(type: "HAS_AUTHOR", direction: OUT)
}

type User {
    id: ID!
    name: String!
    author: User! @relationship(type: "HAS_AUTHOR", direction: IN)
}
```

### Prerequisites

We need to gather some information before we can look at the directive definitions for the above types.

#### Generated schema

When passed into the Neo4j GraphQL Library, it will generate the following types which are relevant to the authorization directive definitions. Everything else has been removed.

```gql
input PostAuthorAggregateInput {
    AND: [PostAuthorAggregateInput!]
    NOT: PostAuthorAggregateInput
    OR: [PostAuthorAggregateInput!]
    count: Int
    count_GT: Int
    count_GTE: Int
    count_LT: Int
    count_LTE: Int
    node: PostAuthorNodeAggregationWhereInput
}

input PostAuthorConnectionWhere {
    AND: [PostAuthorConnectionWhere!]
    NOT: PostAuthorConnectionWhere
    OR: [PostAuthorConnectionWhere!]
    node: UserWhere
    node_NOT: UserWhere @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
}

input PostAuthorNodeAggregationWhereInput {
    AND: [PostAuthorNodeAggregationWhereInput!]
    NOT: PostAuthorNodeAggregationWhereInput
    OR: [PostAuthorNodeAggregationWhereInput!]
    id_EQUAL: ID @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
    name_AVERAGE_EQUAL: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
    name_AVERAGE_GT: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
    name_AVERAGE_GTE: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
    name_AVERAGE_LENGTH_EQUAL: Float
    name_AVERAGE_LENGTH_GT: Float
    name_AVERAGE_LENGTH_GTE: Float
    name_AVERAGE_LENGTH_LT: Float
    name_AVERAGE_LENGTH_LTE: Float
    name_AVERAGE_LT: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
    name_AVERAGE_LTE: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
    name_EQUAL: String @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
    name_GT: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
    name_GTE: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
    name_LONGEST_EQUAL: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
    name_LONGEST_GT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
    name_LONGEST_GTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
    name_LONGEST_LENGTH_EQUAL: Int
    name_LONGEST_LENGTH_GT: Int
    name_LONGEST_LENGTH_GTE: Int
    name_LONGEST_LENGTH_LT: Int
    name_LONGEST_LENGTH_LTE: Int
    name_LONGEST_LT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
    name_LONGEST_LTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
    name_LT: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
    name_LTE: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
    name_SHORTEST_EQUAL: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
    name_SHORTEST_GT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
    name_SHORTEST_GTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
    name_SHORTEST_LENGTH_EQUAL: Int
    name_SHORTEST_LENGTH_GT: Int
    name_SHORTEST_LENGTH_GTE: Int
    name_SHORTEST_LENGTH_LT: Int
    name_SHORTEST_LENGTH_LTE: Int
    name_SHORTEST_LT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
    name_SHORTEST_LTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
}

input PostWhere {
    AND: [PostWhere!]
    NOT: PostWhere
    OR: [PostWhere!]
    author: UserWhere
    authorAggregate: PostAuthorAggregateInput
    authorConnection: PostAuthorConnectionWhere
    authorConnection_NOT: PostAuthorConnectionWhere
    author_NOT: UserWhere
    content: String
    content_CONTAINS: String
    content_ENDS_WITH: String
    content_IN: [String!]
    content_NOT: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
    content_NOT_CONTAINS: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
    content_NOT_ENDS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
    content_NOT_IN: [String!] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
    content_NOT_STARTS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
    content_STARTS_WITH: String
}

input UserAuthorAggregateInput {
    AND: [UserAuthorAggregateInput!]
    NOT: UserAuthorAggregateInput
    OR: [UserAuthorAggregateInput!]
    count: Int
    count_GT: Int
    count_GTE: Int
    count_LT: Int
    count_LTE: Int
    node: UserAuthorNodeAggregationWhereInput
}

input UserAuthorConnectionWhere {
    AND: [UserAuthorConnectionWhere!]
    NOT: UserAuthorConnectionWhere
    OR: [UserAuthorConnectionWhere!]
    node: UserWhere
    node_NOT: UserWhere @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
}

input UserAuthorNodeAggregationWhereInput {
    AND: [UserAuthorNodeAggregationWhereInput!]
    NOT: UserAuthorNodeAggregationWhereInput
    OR: [UserAuthorNodeAggregationWhereInput!]
    id_EQUAL: ID @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
    name_AVERAGE_EQUAL: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
    name_AVERAGE_GT: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
    name_AVERAGE_GTE: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
    name_AVERAGE_LENGTH_EQUAL: Float
    name_AVERAGE_LENGTH_GT: Float
    name_AVERAGE_LENGTH_GTE: Float
    name_AVERAGE_LENGTH_LT: Float
    name_AVERAGE_LENGTH_LTE: Float
    name_AVERAGE_LT: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
    name_AVERAGE_LTE: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
    name_EQUAL: String @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
    name_GT: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
    name_GTE: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
    name_LONGEST_EQUAL: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
    name_LONGEST_GT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
    name_LONGEST_GTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
    name_LONGEST_LENGTH_EQUAL: Int
    name_LONGEST_LENGTH_GT: Int
    name_LONGEST_LENGTH_GTE: Int
    name_LONGEST_LENGTH_LT: Int
    name_LONGEST_LENGTH_LTE: Int
    name_LONGEST_LT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
    name_LONGEST_LTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
    name_LT: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
    name_LTE: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
    name_SHORTEST_EQUAL: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
    name_SHORTEST_GT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
    name_SHORTEST_GTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
    name_SHORTEST_LENGTH_EQUAL: Int
    name_SHORTEST_LENGTH_GT: Int
    name_SHORTEST_LENGTH_GTE: Int
    name_SHORTEST_LENGTH_LT: Int
    name_SHORTEST_LENGTH_LTE: Int
    name_SHORTEST_LT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
    name_SHORTEST_LTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
}

input UserWhere {
    AND: [UserWhere!]
    NOT: UserWhere
    OR: [UserWhere!]
    author: UserWhere
    authorAggregate: UserAuthorAggregateInput
    authorConnection: UserAuthorConnectionWhere
    authorConnection_NOT: UserAuthorConnectionWhere
    author_NOT: UserWhere
    id: ID
    id_CONTAINS: ID
    id_ENDS_WITH: ID
    id_IN: [ID!]
    id_NOT: ID @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
    id_NOT_CONTAINS: ID @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
    id_NOT_ENDS_WITH: ID @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
    id_NOT_IN: [ID!] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
    id_NOT_STARTS_WITH: ID @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
    id_STARTS_WITH: ID
    name: String
    name_CONTAINS: String
    name_ENDS_WITH: String
    name_IN: [String!]
    name_NOT: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
    name_NOT_CONTAINS: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
    name_NOT_ENDS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
    name_NOT_IN: [String!] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
    name_NOT_STARTS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
    name_STARTS_WITH: String
}
```

#### JWT Payload filtering

The generated types for the directive will depend on the type labelled with `@jwtPayload`. Given the following:

```gql
type JWTPayload @jwtPayload {
  roles: [String!]!
  application1Groups: [String!]! @jwtClaim(path: "applications[0].groups")
}
```

For the purposes of filtering, this will generate the following input type:

```gql
input JWTPayloadWhere {
    AND: [JWTPayloadWhere!]
    NOT: JWTPayloadWhere
    OR: [JWTPayloadWhere!]
    iss: String
    iss_CONTAINS: String
    iss_ENDS_WITH: String
    iss_IN: [String!]
    iss_STARTS_WITH: String
    sub: String
    sub_CONTAINS: String
    sub_ENDS_WITH: String
    sub_IN: [String!]
    sub_STARTS_WITH: String
    aud: String
    aud_CONTAINS: String
    aud_ENDS_WITH: String
    aud_IN: [String!]
    aud_STARTS_WITH: String
    exp: Int
    exp_LT: Int
    exp_GT: Int
    exp_LTE: Int
    exp_GTE: Int
    exp_IN: [Int!]
    nbf: Int
    nbf_LT: Int
    nbf_GT: Int
    nbf_LTE: Int
    nbf_GTE: Int
    nbf_IN: [Int!]
    iat: Int
    iat_LT: Int
    iat_GT: Int
    iat_LTE: Int
    iat_GTE: Int
    iat_IN: [Int!]
    jti: String
    jti_CONTAINS: String
    jti_ENDS_WITH: String
    jti_IN: [String!]
    jti_STARTS_WITH: String
    roles: [String!]
    roles_INCLUDES: String
    application1Groups: [String!]
    application1Groups_INCLUDES: String
}
```

### Authorization directive definitions

Firstly, for `User`:

```gql
input UserAuthorizationWhere {
  OR: [UserAuthorizationWhere!]
  AND: [UserAuthorizationWhere!]
  NOT: UserAuthorizationWhere
  jwtPayload: JWTPayloadWhere
  node: UserWhere
}

enum AuthorizationFilterOperation {
  READ
  UPDATE
  DELETE
  CREATE_RELATIONSHIP
  DELETE_RELATIONSHIP
}

input UserAuthorizationFilterRule {
  operations: [AuthorizationFilterOperation!]! = [READ, UPDATE, DELETE, CREATE_RELATIONSHIP, DELETE_RELATIONSHIP]
  requireAuthentication: Boolean! = true
  where: UserAuthorizationWhere!
}

enum AuthorizationValidateOperation {
  READ
  CREATE
  UPDATE
  DELETE
  CREATE_RELATIONSHIP
  DELETE_RELATIONSHIP
}

enum AuthorizationValidateWhen {
  BEFORE
  AFTER
}

input UserAuthorizationValidateRule {
  operations: [AuthorizationValidateOperation!]! = [READ, CREATE, UPDATE, DELETE, CREATE_RELATIONSHIP, DELETE_RELATIONSHIP]
  when: [AuthorizationValidateStage!]! = [BEFORE, AFTER]
  requireAuthentication: Boolean! = true
  where: UserAuthorizationWhere!
}

directive @authorization(
  filter: [UserAuthorizationFilterRule!]
  validate: [UserAuthorizationValidateRule!]!
) on OBJECT | FIELD_DEFINITION | INTERFACE
```

And for `Post`:

```gql
input PostAuthorizationWhere {
  OR: [PostAuthorizationWhere!]
  AND: [PostAuthorizationWhere!]
  NOT: PostAuthorizationWhere
  jwtPayload: JWTPayloadWhere
  node: PostWhere
}

enum AuthorizationFilterOperation {
  READ
  UPDATE
  DELETE
  CREATE_RELATIONSHIP
  DELETE_RELATIONSHIP
}

input PostAuthorizationFilterRule {
  operations: [AuthorizationFilterOperation!]! = [READ, UPDATE, DELETE, CREATE_RELATIONSHIP, DELETE_RELATIONSHIP]
  requireAuthentication: Boolean! = true
  where: PostAuthorizationWhere!
}

enum AuthorizationValidateOperation {
  READ
  CREATE
  UPDATE
  DELETE
  CREATE_RELATIONSHIP
  DELETE_RELATIONSHIP
}

enum AuthorizationValidateWhen {
  BEFORE
  AFTER
}

input PostAuthorizationValidateRule {
  operations: [AuthorizationValidateOperation!]! = [READ, CREATE, UPDATE, DELETE, CREATE_RELATIONSHIP, DELETE_RELATIONSHIP]
  when: [AuthorizationValidateStage!]! = [BEFORE, AFTER]
  requireAuthentication: Boolean! = true
  where: PostAuthorizationWhere!
}

directive @authorization(
  filter: [PostAuthorizationFilterRule!]
  validate: [PostAuthorizationValidateRule!]!
) on OBJECT | FIELD_DEFINITION | INTERFACE
```

### Generic structure of the directive

From the above, it can be seen that there are some static enums for validation:

```gql
enum AuthorizationFilterOperation {
  READ
  UPDATE
  DELETE
  CREATE_RELATIONSHIP
  DELETE_RELATIONSHIP
}

enum AuthorizationValidateOperation {
  READ
  CREATE
  UPDATE
  DELETE
  CREATE_RELATIONSHIP
  DELETE_RELATIONSHIP
}

enum AuthorizationValidateWhen {
  BEFORE
  AFTER
}
```

And then some types which vary based on the type. Written as a template string where `typename` is the GraphQL type name:

```gql
input ${typename}AuthorizationWhere {
  OR: [${typename}AuthorizationWhere!]
  AND: [${typename}AuthorizationWhere!]
  NOT: ${typename}AuthorizationWhere
  jwtPayload: JWTPayloadWhere
  node: ${typename}Where
}

input ${typename}AuthorizationFilterRule {
  operations: [AuthorizationFilterOperation!]! = [READ, UPDATE, DELETE, CREATE_RELATIONSHIP, DELETE_RELATIONSHIP]
  requireAuthentication: Boolean! = true
  where: ${typename}AuthorizationWhere!
}

input ${typename}AuthorizationValidateRule {
  operations: [AuthorizationValidateOperation!]! = [READ, CREATE, UPDATE, DELETE, CREATE_RELATIONSHIP, DELETE_RELATIONSHIP]
  when: [AuthorizationValidateStage!]! = [BEFORE, AFTER]
  requireAuthentication: Boolean! = true
  where: ${typename}AuthorizationWhere!
}

directive @authorization(
  filter: [${typename}AuthorizationFilterRule!]
  validate: [${typename}AuthorizationValidateRule!]!
) on OBJECT | FIELD_DEFINITION | INTERFACE
```

### Validation of user input

Now that we have the above background information, we can take a look at how we can validate the input of our users.

Given the following `@authorization` directives from our users:

```gql
type Post @authorization(filter: [{ where: { node: { author: { id: "$jwt.sub" } } } }]) {
    content: String!
    author: User! @relationship(type: "HAS_AUTHOR", direction: OUT)
}

type User @authorization(filter: [{ where: { node: { id: "$jwt.sub" } } }]) {
    id: ID!
    name: String!
    author: User! @relationship(type: "HAS_AUTHOR", direction: IN)
}
```

For the purposes of validation, we can rename the directives as follows:

```gql
type Post @postAuthorization(filter: [{ where: { node: { author: { id: "$jwt.sub" } } } }]) {
    content: String!
    author: User! @relationship(type: "HAS_AUTHOR", direction: OUT)
}

type User @userAuthorization(filter: [{ where: { node: { id: "$jwt.sub" } } }]) {
    id: ID!
    name: String!
    author: User! @relationship(type: "HAS_AUTHOR", direction: IN)
}
```

With this renaming applied, we can now generate the directive definitions:

```gql
input PostAuthorizationWhere {
  OR: [PostAuthorizationWhere!]
  AND: [PostAuthorizationWhere!]
  NOT: PostAuthorizationWhere
  jwtPayload: JWTPayloadWhere
  node: PostWhere
}

input PostAuthorizationFilterRule {
  operations: [AuthorizationFilterOperation!]! = [READ, UPDATE, DELETE, CREATE_RELATIONSHIP, DELETE_RELATIONSHIP]
  requireAuthentication: Boolean! = true
  where: PostAuthorizationWhere!
}

input PostAuthorizationValidateRule {
  operations: [AuthorizationValidateOperation!]! = [READ, CREATE, UPDATE, DELETE, CREATE_RELATIONSHIP, DELETE_RELATIONSHIP]
  when: [AuthorizationValidateStage!]! = [BEFORE, AFTER]
  requireAuthentication: Boolean! = true
  where: PostAuthorizationWhere!
}

directive @postAuthorization(
  filter: [PostAuthorizationFilterRule!]
  validate: [PostAuthorizationValidateRule!]!
) on OBJECT | FIELD_DEFINITION | INTERFACE

input UserAuthorizationWhere {
  OR: [UserAuthorizationWhere!]
  AND: [UserAuthorizationWhere!]
  NOT: UserAuthorizationWhere
  jwtPayload: JWTPayloadWhere
  node: UserWhere
}

input UserAuthorizationFilterRule {
  operations: [AuthorizationFilterOperation!]! = [READ, UPDATE, DELETE, CREATE_RELATIONSHIP, DELETE_RELATIONSHIP]
  requireAuthentication: Boolean! = true
  where: UserAuthorizationWhere!
}

input UserAuthorizationValidateRule {
  operations: [AuthorizationValidateOperation!]! = [READ, CREATE, UPDATE, DELETE, CREATE_RELATIONSHIP, DELETE_RELATIONSHIP]
  when: [AuthorizationValidateStage!]! = [BEFORE, AFTER]
  requireAuthentication: Boolean! = true
  where: UserAuthorizationWhere!
}

directive @userAuthorization(
  filter: [UserAuthorizationFilterRule!]
  validate: [UserAuthorizationValidateRule!]!
) on OBJECT | FIELD_DEFINITION | INTERFACE
```

The above can now be combined with the generated schema, the `JWTPayload` type, the enums for authorization, and the renamed directives applied to the types.

GraphQL validation can now be applied across the combined schema, which will flag up any inconsistencies.

## Rules

There are three different points in the query lifecycle in which authorization checks can be injected using rules.

Each different rule type can be seen as being combined with a logical `AND`, and the rules within each type are combined with an `OR`.

### Filter

For Cypher queries that begin with a `MATCH`, these rules are inserted into the `WHERE` clause directly proceeding. They are combined with filters provided in GraphQL queries using a logical `AND`.

In the context of Subscriptions, these filters are applied when processing a new event, and they are also combined with user provided queries using an `AND`.

Using an example rule from the example above:

```gql
type User
  @authorization(
    filter: [{ where: { node: { id: "$jwt.sub" } } }]
  ) {
  id: String!
  name: String!
}
```

Given the following GraphQL query:

```gql
{
  users(where: { name: "Bob" }) {
    id
    name
  }
}
```

This will generate Cypher and parameters along the lines of the following:

```cypher
MATCH (this:User)
WHERE this.id = $jwt.sub
AND this.name = $name
RETURN this { .id, .name }
```

```json
{
  "jwt": {
    "sub": "123456"
  },
  "name": "Bob"
}
```

### Validate

Validate rules apply filters also, but throw an error in the case of reaching any data that breaches the predicate. The rules are applied using `apoc.util.validatePredicate`.

By default, a validate rule is applied both before and after every operation. For example, if validating that a `User` node matches the provided JWT by checking the ID matches the subject, the odds are that you are going to want to check this is still the case following the operation.

So given the following example:

```gql
type User
  @authorization(
    validate: [{ where: { node: { id: "$jwt.sub" } } }]
  ) {
  id: String!
  name: String!
}
```

And the following GraphQL query:

```gql
mutation {
  updateUsers(where: { name: "Bob" }, update: { id: "654321" }) {
    users {
      id
      name
    }
  }
}
```

This will generate Cypher and parameters along the lines of the following:

```cypher
MATCH (this:User)
WHERE this.name = $name
AND apoc.util.validatePredicate(NOT (this.id = $jwt.sub), "Unauthorized", [])
SET this.id = $update.id
WITH this
WHERE apoc.util.validatePredicate(NOT (this.id = $jwt.sub), "Unauthorized", [])
RETURN this { .id, .name }
```

```json
{
  "jwt": {
    "sub": "123456"
  },
  "name": "Bob",
  "update": {
    "id": "654321"
  }
}
```

If, following the Mutation operation, the rule is not satisfied, an error "Unauthorized" will be thrown.

#### Before operations

If a rule is only desired to run before operations, you can set the `when` value:

```gql
type User
  @authorization(
    validate: [{ when: [BEFORE], where: { node: { id: "$jwt.sub" } } }]
  ) {
  id: String!
  name: String!
}
```

Given the following GraphQL query:

```gql
{
  users(where: { name: "Bob" }) {
    id
    name
  }
}
```

This will generate Cypher and parameters along the lines of the following:

```cypher
MATCH (this:User)
WHERE this.name = $name
AND apoc.util.validatePredicate(NOT (this.id = $jwt.sub), "Unauthorized", [])
RETURN this { .id, .name }
```

```json
{
  "jwt": {
    "sub": "123456"
  },
  "name": "Bob"
}
```

If, following the user's filter application, the data to be returned does not satisfy the rule, the error "Unauthorized" will be thrown.

#### After operations

Similar to the above, you can set the `when` value to run only after an operation:

```gql
type User
  @authorization(
    validate: [{ when: [AFTER], where: { node: { id: "$jwt.sub" } } }]
  ) {
  id: String!
  name: String!
}
```

Given the following GraphQL query:

```gql
mutation {
  updateUsers(where: { name: "Bob" }, update: { id: "654321" }) {
    users {
      id
      name
    }
  }
}
```

This will generate Cypher and parameters along the lines of the following:

```cypher
MATCH (this:User)
WHERE this.name = $name
SET this.id = $update.id
WITH this
WHERE apoc.util.validatePredicate(NOT (this.id = $jwt.sub), "Unauthorized", [])
RETURN this { .id, .name }
```

```json
{
  "jwt": {
    "sub": "123456"
  },
  "name": "Bob",
  "update": {
    "id": "654321"
  }
}
```

If, following the Mutation operation, the rule is not satisfied, an error "Unauthorized" will be thrown.
