# Global authentication

## Problem

For some use cases the GraphQL API needs to be secured globally to restrict access to _any_ of the top-level types without prior authentication. This is also referred to as [API-wide authorization](https://www.apollographql.com/docs/apollo-server/security/authentication/#api-wide-authorization).
Currently to achieve this every type or union needs to be extended with an `@auth` directive: `@auth(rules: [{ isAuthenticated: true }])`.

## Proposed Solution

Add a configuration/input option, a boolean, to the `JWTPluginInput` for the `Neo4jGraphQLAuthJWTPlugin` which allows for an opt-in for global authentication. The default value is `false`.

```javascript
const neoSchema = new Neo4jGraphQL({
    config: {
        enableDebug: false,
        ...
    },
    typeDefs: typeDefs,
    driver,
    plugins: {
        auth: new Neo4jGraphQLAuthJWTPlugin({
            secret: "1234",
            noVerify: false,
            globalAuthentication: true,
        }),
    },
});
```

For each request (GraphQL query/mutation/subscription) check the existence of a valid `jwt` token.
The implementation for the `isAuthenticated` rule in the `@auth` directive checks whether there is any role present in the `jwt` token to determine the authentication state ([ref](https://github.com/neo4j/graphql/blob/dev/packages/graphql/src/translate/create-auth-param.ts#L37)). The implementation for global auth should follow the same principle.

Make sure `noVerify` in the `Neo4jGraphQLAuthJWTPlugin` plugin is not set to `true` when `globalAuthentication` is set to `true`. Only verified JWT tokens can be accepted for global authentication. Throw an error on startup of the server in case `noVerify: true` and `globalAuthentication: true`.

When to perform the check?
During runtime on every request. [`WrapResolver`](https://github.com/neo4j/graphql/blob/dev/packages/graphql/src/schema/resolvers/wrapper.ts#L41) could be a plausible place to put this logic.

What happens if a request does not contain a valid `jwt` token or does not fulfill the above mentioned criteria?
Throw a `Neo4jGraphQLAuthenticationError` error.

### Alternative solution

A top-level schema directive for `query`, `mutation` or `subscription`.

Downside: Need to specify it three times, the user runs at risk to forget to specify it for all three top-level types.

Positive: Granularity in providing authorization, f.e. can allow for read requests but prevents CUD operations.

Example:

```graphql
extend type Query @authenticatedOnly
extend type Mutation @authenticatedOnly
extend type Subscription @authenticatedOnly
```

## Risks

-   Spending too much time building a strong enough test cases/suite to be comfortable from a security perspective with the developed solution

### Security consideration

Needs to be thoroughly tested with integration tests to prevent unauthorized access.

## Out of Scope

-   Any modifications in the `@auth` directive
