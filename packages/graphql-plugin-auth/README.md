# @neo4j/graphql-plugin-auth

Auth decode plugins for @neo4j/graphql

1. [Documentation](https://neo4j.com/docs/graphql-manual/current/auth/)

## Installation

```
$ npm install @neo4j/graphql-plugin-auth
```

## Usage

### `Neo4jGraphQLAuthJWTPlugin`

```ts
import { Neo4jGraphQL } from "@neo4j/graphql";
import { Neo4jGraphQLAuthJWTPlugin } from "@neo4j/graphql-plugin-auth";

const neoSchema = new Neo4jGraphQL({
    typeDefs,
    plugins: {
        auth: new Neo4jGraphQLAuthJWTPlugin({
            secret: "super-secret",
        }),
    },
});
```

### `Neo4jGraphQLAuthJWKSPlugin`

```ts
import { Neo4jGraphQL } from "@neo4j/graphql";
import { Neo4jGraphQLAuthJWKSPlugin } from "@neo4j/graphql-plugin-auth";

const neoSchema = new Neo4jGraphQL({
    typeDefs,
    plugins: {
        auth: new Neo4jGraphQLAuthJWKSPlugin({
            jwksEndpoint: "https://YOUR_DOMAIN/well-known/jwks.json",
        }),
    },
});
```

## Licence

[Apache 2.0](https://github.com/neo4j/graphql/blob/master/packages/graphql-plugin-auth/LICENSE.txt)
