# Global authentication

## Problem

For some use cases the GraphQL API needs to be secured globally to restrict access to any of the top-level declarations. This is also refered to as API-wide authorization.
https://www.apollographql.com/docs/apollo-server/security/authentication/#api-wide-authorization

## Proposed Solution

Add a configuration option, a boolean, to the `Neo4jGraphQL` class which allows for an opt-in for global authentication. The default value is `false`.
For each request (GraphQL query) check the existance of a valid `jwt` token.
Make sure `noVerify` in `Neo4jGraphQLJWT` is not set to `false`. Only verified JWT tokens can be accepted for global authentication. Throw an error in case `noVerify: false` and `globalAuth: true`.
When to perform the check?
During runtime on every request. `WrapResolver` https://github.com/neo4j/graphql/blob/dev/packages/graphql/src/schema/resolvers/wrapper.ts#L41 could be a plausible place to test it.
What happens if not authenticated?
Throw `Neo4jGraphQLAuthenticationError` error

### Alternative solution

A top-level schema directive for `query`, `mutation` or `subscription`.
Negative: Need to specify it three times, risk to forget to specify it for all three top-level types.
Positive: Granularity in providing authorization, f.e. can allow for read requests but preventing CUD operations

```
extend type Query @authenticatedOnly
extend type Mutation @authenticatedOnly
extend type Subscription @authenticatedOnly
```

### Usage Examples

## Risks

What risks might cause us to go over the appetite described above?

### Security consideration

Is checking the existance of a `jwt` enough? do we need to check for more information or content in the JWT token itself? Roles?
Needs to be thourghly tested with integration tests to prevent unauthorized access.

## Out of Scope

-
