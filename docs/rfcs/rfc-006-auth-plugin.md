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

The new package can be versioned independently from `@neo4j/graphql`, however, **note that `@neo4j/graphql` will be a dependency of `@neo4j/graphql-plugin-auth`.**

### Abstract Class

The current `@neo4j/graphql` library should expose an `abstract` `Neo4jGraphQLAuthPlugin` class where it can be extended to implement custom functionally and type-checked when provided.

```ts
abstract class Neo4jGraphQLAuth {
    secret: string;

    decode<T = Record<string, unknown>>(jwt: string): Promise<T>;
}
```

### Neo4j GraphQL Constructor

When constructing the `Neo4jGraphQL` users should specify the property 'plugins' and when inside they can set the ‘auth’ property. The auth property must be an instance of `Neo4jGraphQLAuthPlugin`:

```js
import { Neo4jGraphQL, Neo4jGraphQLAuthPlugin } from "@neo4j/graphql";

const typeDefs = `
    type User @auth(rules: [{ isAuthenticated: true }]) {
      id: ID!
      username: String!
    }
`;

class CustomAuthPlugin extends Neo4jGraphQLAuthPlugin {
    async decodeJWT() {}
}

const neoSchema = new Neo4jGraphQL({
    typeDefs,
    driver,
    plugins: {
        auth: new CustomAuthPlugin(),
    },
});
```

### Core Plugins

Users are already using the existing JWT decode functionally and it has proven to work so, instead of forcing upgrading users to write their own JWT functionally, let's expose our own `Auth` plugin that extends the `Neo4jGraphQLAuthPlugin`. The ‘core’ `Auth` plugin should be exported from the new library `@neo4j/graphql-plugin-auth`:

```js
import { Neo4jGraphQL } from "@neo4j/graphql";
import { Auth } from "@neo4j/graphql-plugin-auth";

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
        auth: new Auth({ secret: "super-secret" }),
    },
});
```

## Notes

-   Testing would require some form of headless browser
-   Requires lots of effort for migrating users
