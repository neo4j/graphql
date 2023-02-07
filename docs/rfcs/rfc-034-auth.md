# Authentication and Authorization

## API

### Instantiation

Authentication and authorization features are currently exposed by a browser-incompatible plugin.

As part of our efforts to simplify interaction with the library and allow users to experiment with features in the GraphQL Toolbox, we should strive to once again build these features directly into the library.

This will be achievable by substituting our use of [jsonwebtoken](https://www.npmjs.com/package/jsonwebtoken) for [jose](https://www.npmjs.com/package/jose). It has been validated that `jose` will be able to decode and verify tokens as we currently do, and it is browser compatible.

#### Proposal

The following is a type proposal for auth configuration:

```ts
type JWKS = {
  uri: string;
}

type AuthConfig = {
  secret: string | JWKS
  verify: boolean;
  jwtPayload: Schema;
}
```

`AuthConfig.secret` will assume symmetric type if passed a string, or other types by passing in different objects. This will allow us to use the same configuration for a variety of secret types. `jose` also supports SPKI encoded RSA keys.

`AuthConfig.verify` will be `true` by default, but can be set to `false` if the desired behaviour is to decode only.

`AuthConfig.jwtPayload` is of type `Schema` from the `jsonschema` library. This will allow users to define the structure of their JWT payload using a JSON schema.

To configure auth with a symmetric secret "banana", the following can be executed:

```ts
new Neo4jGraphQL({
  typeDefs,
  options: {
    auth: {
      secret: "banana",
    }
  }
})
```

### Usage

Authentication and authorization features will be configured by two directives, `@authentication` and `@authorization`.

#### Authentication

The `@authentication` directive will have a definition as follows:

```gql
enum AuthenticationOperation {
  READ
  CREATE
  UPDATE
  DELETE
  SUBSCRIBE
}

directive @authentication(
  enabled: Boolean! = true
  operations: [AuthenticationOperation!]! = [READ, CREATE, UPDATE, DELETE, SUBSCRIBE]
) on OBJECT | FIELD_DEFINITION | SCHEMA | INTERFACE
```

The arguments have the following utility:

* `enabled` is `true` by default, but can be set to `false` if for instance, you want to disable global authentication for a particular type
* `operations` is used to specify which operations require authentication, and it specifies all by default

The operations for authentication are not as fine-grained as for authorization, and they can be seen as linking directly to root-level operations, rather than nested operations such as `connect` and `disconnect`.

The directive can be applied to individual objects, interfaces and fields, but can also be applied as a schema extension to enable global authentication.

#### PROPOSAL: JWT payload specification

Allow users to provide a schema describing what their JWT payload looks like. For example, this could be a JSON schema passed into the auth configuration:

```jsonschema
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "sub": {
      "type": "string"
    },
    "roles": {
      "type": "array",
      "items": {
        "type": "string"
      },
    }
  },
  "required": [ "sub" ]
}
```

#### PROPOSAL: Access control

##### Option 1: dedicated directive

Sitting between authentication and authorization evaluation, access control rules will control who can access which top-level operations, as assessed at the beginning of resolver execution.

```gql
input StringWhere {
  OR: [StringWhere!]
  AND: [StringWhere!]
  NOT: StringWhere
  equals: String
  in: [String!]
  matches: String
  contains: String
  startsWith: String
  endsWith: String
}

input StringListWhere {
  OR: [StringListWhere!]
  AND: [StringListWhere!]
  NOT: StringListWhere
  all: [String!]
  some: [String!]
  single: String
}

input JWTPayloadWhere {
  OR: [JWTPayloadWhere!]
  AND: [JWTPayloadWhere!]
  NOT: JWTPayloadWhere
  sub: StringWhere
  roles: StringListWhere
}

input AccessControlWhere {
  OR: [AccessControlWhere!]
  AND: [AccessControlWhere!]
  NOT: AccessControlWhere
  jwtPayload: JWTPayloadWhere
}

enum AccessControlOperation {
  READ
  CREATE
  UPDATE
  DELETE
  SUBSCRIBE
}

input AccessControlAllowRule {
  operations: [AccessControlOperation!]! = [READ, CREATE, UPDATE, DELETE, SUBSCRIBE]
  requireAuthentication: Boolean! = true
  where: AccessControlWhere!
}

directive @accessControl(
  allow: [AccessControlAllowRule!]
) on OBJECT | FIELD_DEFINITION | INTERFACE | SCHEMA
```

The proposal is that this will _only_ be in relation to top-level operations, and not when performing a nested operation on a type. Authorization rules as described below should be used for this use case.

Giving an example of using the above, to prevent a `User` type having its delete Mutation called by anyone but an administrator, one could do:

```gql
type User @accessControl(allow: [{ operations: [DELETE], where: { jwtPayload: { roles: { single: "ADMIN" } } } }]) {
  id: ID!
}
```

This would perform a check of the JWT claim at the beginning of the resolver to check that the user has the appropriate role.

##### Option 2: well documented third party solution

By implementing anything ourselves, we will be implementing something which has been achieved countless times in various third party products.

We could fulfil this requirement through the production of some high quality documentation and examples of how this could be achieved through a third party product, for example, GraphQL Shield.

If we load API client's decoded JWT into the context, the following could be done by the user to, for instance, ensure all clients trying to subscribe have the "SUBSCRIBER" role:

```js
import { shield, rule } from "graphql-shield";
import { applyMiddleware } from "graphql-middleware";

const isSubscriber = rule()(async (parent, args, ctx, info) => {
  return ctx.jwt.roles.includes("SUBSCRIBER")
})

const permissions = shield({
  Subscription: {
    "*": isSubscriber
  }
})

// where schema is the output of Neo4jGraphQL.getSchema()
schema = applyMiddleware(schema, permissions)
```

This approach could also be used to validate authentication status so that we only have to worry about Cypher level validation.

#### Authorization

The `@authorization` directive will not have a static definition, as the definition will be different depending on which location it has been applied in.

The usage of the `@authorization` directive implies that authentication is required.

##### Directive

To explain this, we will use the JWT payload definition from above and the following type definition:

```gql
type User {
  id: String!
  name: String!
}
```

NOTE: This definition uses the filtering proposals from [#2730](https://github.com/neo4j/graphql/pulls/2730).

The complete definition for this type will be:

```gql
input StringWhere {
  OR: [StringWhere!]
  AND: [StringWhere!]
  NOT: StringWhere
  equals: String
  in: [String!]
  matches: String
  contains: String
  startsWith: String
  endsWith: String
}

input StringListWhere {
  OR: [StringListWhere!]
  AND: [StringListWhere!]
  NOT: StringListWhere
  all: [String!]
  some: [String!]
  single: String
}

input JWTPayloadWhere {
  OR: [JWTPayloadWhere!]
  AND: [JWTPayloadWhere!]
  NOT: JWTPayloadWhere
  sub: StringWhere
  roles: StringListWhere
}

input UserWhere {
  OR: [UserWhere!]
  AND: [UserWhere!]
  NOT: UserWhere
  id: StringWhere
  name: StringWhere
}

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

enum AuthorizationPreValidateOperation {
  READ
  CREATE
  UPDATE
  DELETE
  CREATE_RELATIONSHIP
  DELETE_RELATIONSHIP
}

input UserAuthorizationPreValidateRule {
  operations: [AuthorizationPreValidateOperation!]! = [READ, UPDATE, DELETE, CREATE_RELATIONSHIP, DELETE_RELATIONSHIP]
  requireAuthentication: Boolean! = true
  where: UserAuthorizationWhere!
}

enum AuthorizationPostValidateOperation {
  CREATE
  UPDATE
  DELETE
  CREATE_RELATIONSHIP
  DELETE_RELATIONSHIP
}

input UserAuthorizationPostValidateRule {
  operations: [AuthorizationPostValidateOperation!]! = [CREATE, UPDATE, DELETE, CREATE_RELATIONSHIP, DELETE_RELATIONSHIP]
  requireAuthentication: Boolean! = true
  where: UserAuthorizationWhere!
}

input UserAuthorizationValidateRules {
  pre: [UserAuthorizationPreValidateRule!]
  post: [UserAuthorizationPostValidateRule!]
}

directive @authorization(
  filter: [UserAuthorizationFilterRule!]
  validate: UserAuthorizationValidateRules
) on OBJECT | FIELD_DEFINITION | INTERFACE
```

When an instance of the library is instantiated, for each type with an `@authorization` directive, the input types from above will be generated in isolation. The `@authorization` directive will then be validated against the generated input types. This will happen for each type with the directive.

Points to note from above:

* Each lifecycle hook has different operation compatibility:
  * Filter:
    * READ
    * UPDATE
    * DELETE
    * CREATE_RELATIONSHIP
    * DELETE_RELATIONSHIP
  * Pre validate:
    * READ
    * UPDATE
    * DELETE
    * CREATE_RELATIONSHIP
    * DELETE_RELATIONSHIP
  * Post validate:
    * CREATE
    * UPDATE
    * DELETE
    * CREATE_RELATIONSHIP
    * DELETE_RELATIONSHIP
* The generated `JWTPayloadWhere` input type maps directly to the definitions in the JSON schema provided for the JWT payload

##### Rules

There are three different points in the query lifecycle in which authorization checks can be injected using rules.

Each different rule type can be seen as being combined with a logical `AND`, and the rules within each type are combined with an `OR`.

###### Filter

For Cypher queries that begin with a `MATCH`, these rules are inserted into the `WHERE` clause directly proceeding. They are combined with filters provided in GraphQL queries using a logical `AND`.

In the context of Subscriptions, these filters are applied when processing a new event, and they are also combined with user provided queries using an `AND`.

Using an example rule from the example above:

```gql
type User
  @authorization(filter: [{ where: { node: { id: { equals: "$jwt.sub" } } } }]) {
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

###### Pre validate

Pre validate rules occur before the return of data for a Query, and before executing an operation for a Mutation. The rules are applied using `apoc.util.validatePredicate`.

Using the following example:

```gql
type User
  @authorization(
    validate: { pre: [{ where: { node: { id: { equals: "$jwt.sub" } } } }] }
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

###### Post validate

Post validate rules occur following a Mutation operation and before the return of data. The rules are applied using `apoc.util.validatePredicate`.

Using the following example:

```gql
type User
  @authorization(
    validate: { post: [{ where: { node: { id: { equals: "$jwt.sub" } } } }] }
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

#### Subscriptions

Subscriptions pose a very different authorization problem to the rest of the operations. Filter rules do not get applied in Cypher, but instead in JavaScript when handling events. Additionally, they do not support matching on properties of related nodes. There are different options for how this could be approached.

The access control rules proposal above will deal with access to the root-level Subscription operations.

##### Additional authorization rules for Subcriptions

This approach would add a new argument, `filterSubscriptions`, to the proposal above. This will deal with the specific filtering requirements of Subscriptions.

The example below builds on the above example, but only includes the relevant additions:

```gql
input StringWhere {
  OR: [StringWhere!]
  AND: [StringWhere!]
  NOT: StringWhere
  equals: String
  in: [String!]
  matches: String
  contains: String
  startsWith: String
  endsWith: String
}

input StringListWhere {
  OR: [StringListWhere!]
  AND: [StringListWhere!]
  NOT: StringListWhere
  all: [String!]
  some: [String!]
  single: String
}

input JWTPayloadWhere {
  OR: [JWTPayloadWhere!]
  AND: [JWTPayloadWhere!]
  NOT: JWTPayloadWhere
  sub: StringWhere
  roles: StringListWhere
}

input UserSubscriptionWhere {
  OR: [UserSubscriptionWhere!]
  AND: [UserSubscriptionWhere!]
  NOT: UserSubscriptionWhere
  id: StringWhere
  name: StringWhere
}

input UserAuthorizationSubscriptionWhere {
  OR: [UserAuthorizationSubscriptionWhere!]
  AND: [UserAuthorizationSubscriptionWhere!]
  NOT: UserAuthorizationSubscriptionWhere
  jwtPayload: JWTPayloadWhere
  node: UserSubscriptionWhere
}

input UserAuthorizationFilterSubscriptionsRule {
  requireAuthentication: Boolean! = true
  where: UserAuthorizationSubscriptionWhere!
}

directive @authorization(
  filter: [UserAuthorizationFilterRule!]
  filterSubscriptions: [UserAuthorizationFilterSubscriptionsRule!]
  validate: UserAuthorizationValidateRules
) on OBJECT | FIELD_DEFINITION | INTERFACE
```

This could include optional operations to allow for the application of filters to particular event types.

Advantages:

* All authorization rules are specified in the same place

Disadvantages:

* More rules to reason with in the `@authorization` directive

##### A directive purely for Subscriptions authorization

Similar the first proposal, but avoids dirtying the `@authorization` directive by introducing a Subscriptions specific authorization directive:

```gql
input StringWhere {
  OR: [StringWhere!]
  AND: [StringWhere!]
  NOT: StringWhere
  equals: String
  in: [String!]
  matches: String
  contains: String
  startsWith: String
  endsWith: String
}

input StringListWhere {
  OR: [StringListWhere!]
  AND: [StringListWhere!]
  NOT: StringListWhere
  all: [String!]
  some: [String!]
  single: String
}

input JWTPayloadWhere {
  OR: [JWTPayloadWhere!]
  AND: [JWTPayloadWhere!]
  NOT: JWTPayloadWhere
  sub: StringWhere
  roles: StringListWhere
}

input UserSubscriptionWhere {
  OR: [UserSubscriptionWhere!]
  AND: [UserSubscriptionWhere!]
  NOT: UserSubscriptionWhere
  id: StringWhere
  name: StringWhere
}

input UserAuthorizationSubscriptionWhere {
  OR: [UserAuthorizationSubscriptionWhere!]
  AND: [UserAuthorizationSubscriptionWhere!]
  NOT: UserAuthorizationSubscriptionWhere
  jwtPayload: JWTPayloadWhere
  node: UserSubscriptionWhere
}

input UserAuthorizationFilterSubscriptionsRule {
  requireAuthentication: Boolean! = true
  where: UserAuthorizationSubscriptionWhere!
}

directive @subscriptionsAuthorization(
  filter: [UserAuthorizationFilterSubscriptionsRule!]
) on OBJECT | FIELD_DEFINITION | INTERFACE
```

Advantages:

* Highlights that Subscriptions authorization is somewhat different

Disadvantages:

* Even more directives, is it really that much of a burden to have an argument that some people won't use in a directive?

##### A directive for configuring Subscriptions, with authorization within

```gql
input StringWhere {
  OR: [StringWhere!]
  AND: [StringWhere!]
  NOT: StringWhere
  equals: String
  in: [String!]
  matches: String
  contains: String
  startsWith: String
  endsWith: String
}

input StringListWhere {
  OR: [StringListWhere!]
  AND: [StringListWhere!]
  NOT: StringListWhere
  all: [String!]
  some: [String!]
  single: String
}

input JWTPayloadWhere {
  OR: [JWTPayloadWhere!]
  AND: [JWTPayloadWhere!]
  NOT: JWTPayloadWhere
  sub: StringWhere
  roles: StringListWhere
}

input UserSubscriptionWhere {
  OR: [UserSubscriptionWhere!]
  AND: [UserSubscriptionWhere!]
  NOT: UserSubscriptionWhere
  id: StringWhere
  name: StringWhere
}

input UserAuthorizationSubscriptionWhere {
  OR: [UserAuthorizationSubscriptionWhere!]
  AND: [UserAuthorizationSubscriptionWhere!]
  NOT: UserAuthorizationSubscriptionWhere
  jwtPayload: JWTPayloadWhere
  node: UserSubscriptionWhere
}

input UserSubscriptionsAuthorizationRule {
  requireAuthentication: Boolean! = true
  where: UserAuthorizationSubscriptionWhere!
}

directive @subscriptions(
  authorization: [UserAuthorizationFilterSubscriptionsRule!]
) on OBJECT | FIELD_DEFINITION | INTERFACE
```

Advantages:

* Highlights that Subscriptions authorization is somewhat different

Disadvantages:

* This is pretty much an anti-pattern - directives are meant to be specific instructions, and not generic objects like this

#### Examples

##### Combining rules

The following type definition defines a type which automatically has a filter for active records. It also only allows access to a user's own records, and doesn't allow them to change their `id` to anything not matching their JWT subject.

```gql
type User
  @authorization(
    filter: [{ where: { node: { isActive: true } } }]
    validate: {
      pre: [{ where: { node: { id: { equals: "$jwt.sub" } } } }]
      post: [{ where: { node: { id: { equals: "$jwt.sub" } } } }]
    }
  ) {
  id: String!
  name: String!
  isActive: Boolean!
}
```

When executing the following GraphQL query:

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
WHERE this.isActive = true
AND this.name = $name
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

#### Combining rules mixing authentication requirements

In [#2548](https://github.com/neo4j/graphql/issues/2548), the user reported that rules using the previous `allowUnauthenticated` are ignored when role-based rules are also present.

They gave the following type definitions as an example of where this would be a problem:

```gql
type User
  @auth(
    rules: [
      {
        operations: [READ]
        allowUnauthenticated: true
        where: { isPublic: true }
      }
      { operations: [READ], where: { roles: ["ADMIN"] } }
    ]
  ) {
  userId: ID! @id
  isPublic: Boolean
}
```

In the new solution, the following type definitions would be strictly equivalent:

```gql
type User
  @authorization(
    filter: [
      {
        operations: [READ]
        requireAuthentication: false
        where: { node: { isPublic: true } }
      }
    ]
    validate: {
      pre: [{ operations: [READ], where: { jwtPayload: { roles: { some: ["ADMIN"] } } } }]
    }
  ) {
  userId: ID! @id
  isPublic: Boolean
}
```

However, the intent is highly likely to instead be:

```gql
type User
  @authorization(
    filter: [
      {
        operations: [READ]
        requireAuthentication: false
        where: { node: { isPublic: true } }
      }
      {
        operations: [READ]
        where: { jwtPayload: { roles: { single: "ADMIN" } } }
      }
    ]
  ) {
  userId: ID! @id
  isPublic: Boolean
}
```

This is because, unlike the previous implementation, it's now possible to perform checking against JWT payload values such as `roles` at any point in the query lifecycle.

#### Combining `where` with roles

In [#1889](https://github.com/neo4j/graphql/issues/1889), we once again have a user attempting to combine `roles` rules as a filter rather than a validate. The following example was given:

```gql
type Person {
  id: ID @id
  name: String
  email: String
  roles: [String]
}

type Document {
  id: ID @id
  title: String
  owner: Person @relationship(type: "OWN", direction: IN)
}

extend type Document
  @auth(rules: [{ where: { owner: { id: "$jwt.sub" } } }, { roles: ["admin"] }])
```

Making the same previous assumption that both of these should rules be a `filter`, we can propose the following:

```gql
type Person {
  id: ID @id
  name: String
  email: String
  roles: [String]
}

type Document {
  id: ID @id
  title: String
  owner: Person @relationship(type: "OWN", direction: IN)
}

extend type Document
  @authorization(
    filter: [
      { where: { node: { owner: { id: { equals: "$jwt.sub" } } } } }
      { where: { jwtPayload: { roles: { single: "admin" } } } }
    ]
  )
```
