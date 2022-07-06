# Global authentication

## Problem

For some use cases the GraphQL API needs to be secured globally, on the top most level. This would allow or prevent any querying of the API as a whole.
https://www.apollographql.com/docs/apollo-server/security/authentication/#api-wide-authorization

Outside of GraphQL:
https://www.apollographql.com/docs/apollo-server/security/authentication/#outside-of-graphql

## Proposed Solution

-   config boolean
-   directive?
-   check the user token

enable authentication on the root query type. By providing no role or policy names we’re simply saying the user must be authenticated.

packages/graphql/src/schema/resolvers/wrapper.ts
packages/graphql/src/classes/Neo4jGraphQL.ts

Feel free to add/remove subheadings below as appropriate:

### Usage Examples

## Risks

What risks might cause us to go over the appetite described above?

### Security consideration

Please take some time to think about potential security issues/considerations for the proposed solution.
For example: How can a malicious user abuse this? How can we prevent that in such case?

## Out of Scope

What are we definitely not going to implement in this solution?
