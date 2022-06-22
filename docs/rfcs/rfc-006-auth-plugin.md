# Auth Plugin

## Problem

Neo4j GraphQL uses the [Node.js `crypto`](https://nodejs.org/api/crypto.html) library to decode an incoming JWT, and If this usage could be extracted into a 'plugin' it would path the way for future developer tools surrounding Neo4j GraphQL such as Neo4j Desktop interoperability.

## Proposed Solution

Extract the current auth decoding functionally into a new package `@neo4j/graphql-plugin-auth`, this package would be deployed independently to NPM.

### Monorepo Packages Structure:

```
║
╚═packages
    ║
    ╠══ graphql- @neo4j/graphql
    ║
    ╠══ ogm - @neo4j/graphql-ogm
    ║
    ╠══ introspector - @neo4j/introspector
    ║
    ╠══ plugins - @neo4j/graphql-plugin-auth
    ║
    ╚══ package-tests
```

### Versioning

The new package can be versioned independently from `@neo4j/graphql`.

### Neo4j GraphQL Constructor

When constructing the `Neo4jGraphQL` users should specify the property 'plugins' and when inside they can set the ‘auth’ property. The auth property must meet the interface:

```ts
interface Neo4jGraphQLAuthPlugin {
    rolesPath?: string;

    decode<T>(token: string | any): Promise<T | undefined>;
}
```

Users are already using the existing JWT decode functionally and it has proven to work so, instead of forcing upgrading users to write their own JWT functionally, let's expose our own `Neo4jGraphQLAuthJWTPlugin` plugin. The ‘core’ `Neo4jGraphQLAuthJWTPlugin` plugin should be exported from the new library `@neo4j/graphql-plugin-auth`:

```js
import { Neo4jGraphQL } from "@neo4j/graphql";
import { Neo4jGraphQLAuthJWTPlugin } from "@neo4j/graphql-plugin-auth";

const typeDefs = `
    type User @auth(rules: [{ isAuthenticated: true }]) {
      id: ID!
      username: String!
    }
`;

const neoSchema = new Neo4jGraphQL({
    typeDefs,
    driver,
    plugins: {
        auth: new Neo4jGraphQLAuthJWTPlugin({ secret: "super-secret" }),
    },
});
```

If you want to use JWKS then use the `Neo4jGraphQLAuthJWKSPlugin`:

```js
import { Neo4jGraphQL } from "@neo4j/graphql";
import { Neo4jGraphQLAuthJWKSPlugin } from "@neo4j/graphql-plugin-auth";

const typeDefs = `
    type User @auth(rules: [{ isAuthenticated: true }]) {
      id: ID!
      username: String!
    }
`;

const neoSchema = new Neo4jGraphQL({
    typeDefs,
    driver,
    plugins: {
        auth: new Neo4jGraphQLAuthJWKSPlugin({ jwksEndpoint: "https://YOUR_DOMAIN/.well-known/jwks.json"; }),
    },
});
```

Below is an example of creating your own auth plugin:

```js
import { Neo4jGraphQL, Neo4jGraphQLAuthPlugin } from "@neo4j/graphql";

const typeDefs = `
    type User @auth(rules: [{ isAuthenticated: true }]) {
      id: ID!
      username: String!
    }
`;

class CustomAuthPlugin extends Neo4jGraphQLAuthPlugin {
    private secret: string;

    constructor(s) {
        secret = s;
    }

    async decode() {}
}

const neoSchema = new Neo4jGraphQL({
    typeDefs,
    driver,
    plugins: {
        auth: new CustomAuthPlugin("secret"),
    },
});
```

## Notes

-   Testing would require some form of headless browser
-   Requires lots of effort for migrating users
