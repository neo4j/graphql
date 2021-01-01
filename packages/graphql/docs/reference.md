# Reference

This is the reference documentation for @neo4j/graphql. It covers the programming model, APIs, concepts, annotations and technical details of the library.

This document is split into zones;

1. Setup - Importable functions and classes & how to setup schema
2. Schema - How to define your GraphQL Schema
3. Querying - How to Query your data

## Setup

Importable functions and classes & how to setup schema

### makeAugmentedSchema

Main Entry to the library. Use to construct an instance of `NeoSchema`.

```js
const { makeAugmentedSchema } = require("@neo4j/graphql");

const neoSchema = makeAugmentedSchema({
    typeDefs,
    resolvers?,
    schemaDirectives?,
    debug?,
});
```

### NeoSchema

Core class of the library. Holds all metadata about schema plus access to the OGM.

#### With Apollo Server

```js
const neo4j = require("neo4j-driver");
const { makeAugmentedSchema } = require("@neo4j/graphql");
const { ApolloServer } = require("apollo-server");

const neoSchema = makeAugmentedSchema({
    typeDefs,
    resolvers?,
    context?,
    schemaDirectives?,
    debug?,
});

const driver = neo4j.driver(
    config.NEO_URL,
    neo4j.auth.basic("admin", "password")
);

const apolloServer = new ApolloServer({
    schema: neoSchema.schema,
    context: { driver }
});
```

#### With OGM

```js
const neo4j = require("neo4j-driver");
const { makeAugmentedSchema } = require("@neo4j/graphql");

const driver = neo4j.driver(
    config.NEO_URL,
    neo4j.auth.basic("admin", "password")
);


const neoSchema = makeAugmentedSchema({
    typeDefs,
    resolvers?,
    schemaDirectives?,
    debug?,
});

const Model = neoSchema.model("MODEL_NAME_HERE");

// await Model.find();
// await Model.create();
// await Model.update();
// await Model.delete();
```

### translate

Used to translate the `resolveInfo` object of a custom resolver into cypher and params. Only to be used on custom/overridden resolvers. Using this function can act as both a pre and post mechanism for your resolvers.

```js
const { makeAugmentedSchema, translate } = require("@neo4j/neo4j-graphql");

const typeDefs = `
    type User {
        name: String
    }
`;

const resolvers = {
    Query: {
        Users: (root, args, context, resolveInfo) => {
            // pre
            const [cypher, params] = translate({
                context,
                resolveInfo,
            });
            // post
        },
    },
};

const neoSchema = makeAugmentedSchema({ typeDefs, resolvers });
```

## Schema

### Nodes

To represent a node in the GraphQL schema use the `type` definition;

```graphql
type Node {
    id: ID
}
```

### Relationships

To represent a relationship between two nodes use the `@relationship` directive.

_Usage_

```graphql
type Node {
    id: ID
    related: [Node] @relationship(type: "RELATED", direction: "OUT")
}
```

_Definition_

> You do not need to define this. It is for documentation purposes only.

```graphql
directive @relationship(type: String!, direction: String) on FIELD
```

### @auth

Once specified it will ‘wrap’ generated Queries & Mutations, interacting with an incoming JWT, adding predicates to the generated cypher.

#### Setup

This implementation only accepts JWT's in the request. You can use ENV `JWT_SECRET` to specificity the JWT secret and use `JWT_NO_VERIFY=true` to disable the verification of the JWT, handy for development. The accepted token type should be Bearer where the header should be authorization.

_Example HTTP Request_

```
POST / HTTP/1.1
authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJyb2xlcyI6WyJ1c2VyX2FkbWluIiwicG9zdF9hZG1pbiIsImdyb3VwX2FkbWluIl19.IY0LWqgHcjEtOsOw60mqKazhuRFKroSXFQkpCtWpgQI
content-type: application/json
```

You will need to inject the request object into the contex before you can use auth. Here is an example using Apollo Sever.

```js
const neoSchema = makeAugmentedSchema({});

const server = new ApolloServer({
    schema: neoSchema.schema,
    context: ({ req }) => ({ req }),
});
```

#### Placement

One has to specify the directive somewhere lets take look at where it should and should not be placed;

```
type User @auth() { // ✅ here is fine
    name: String
}
```

```
type User {
    name: String @auth() // ❌ not here
}
```

```
type User {
    posts: [Post] @relationship(...) @auth() // ❌ not here
}
```

```
type User @auth() @auth() { // ⚠ Only the first one will be used
    name: String
}
```

#### rules

The only, required, parameter as part of the directive. Each rule allows you to specify the following properties;

```ts
rules: {
    operations: ("create" | "read" | "update" | "delete" | "connect" | "disconnect")[];
    roles?: string[];
    isAuthenticated?: boolean
    allow?: any | "*";
    bind?: any | "*";
}[]
```

#### operations

Array of either `"create" | "read" | "update" | "delete" | "connect" | "disconnect"` the corresponding `allow`, `bind` and `roles` will be checked on each subsequent operation.

#### roles

Array of strings to be checked against the JWT roles.

```graphql
type User @auth(rules: [{ operations: ["update"], roles: ["admin"] }]) {
    id: ID
    name: String
}
```

#### isAuthenticated

A boolean to specify if the user should have a valid JWT on specified operations. It only really makes sense to have this as true and setting to false is for semantics only;

```graphql
type User
    @auth(
        rules: [{ operations: ["create", "update"], isAuthenticated: true }]
    ) {
    id: ID
    name: String
}
```

#### allow

`allow` is a map used to compare a property on the incoming JTW against a property on a node. Allow is called before matching a node, this includes updating, deleting and projecting. Given the following `auth` users can only update there own node;

```graphql
type User
    @auth(
        rules: [
            {
                operations: ["update"]
                allow: { id: "sub" } ## sub being 'jwt.sub'
            }
        ]
    ) {
    id: ID
    username: String
}
```

You can traverse relationships in the directive to satisfy complex authorization 'questions' such as; "grant update access to all moderators of a post";

```graphql
type User {
  id: ID!
  username: String!
}

type Post @auth(rules: [
  {
    allow: [{ "moderator.id": "sub"}], # "sub" being "req.jwt.sub"
    operations: ["update"]
  }
]) {
  id: ID!
  title: String!
  moderator: User @relationship(type: "MODERATES_POST", direction: "IN")
}
```

#### bind

`bind` is a map used to enforce a value on a node vs property on the incoming JTW. If the value is not bound then error is thrown. Bind is called just after a operation on a node, inside a transaction. Bind only is called when updating nodes.

```graphql
type User
    @auth(
        rules: [
            {
                operations: ["update"]
                bind: { id: "sub" } ## sub being 'jwt.sub'
            }
        ]
    ) {
    id: ID
    username: String
}
```

Above we are enforcing that users cannot change there ID. You can traverse relationships with bind too see [`allow`](#allow)

### DateTime

This library supports the DateTime scalar. Fields with the scalar will map to a [datetime](https://neo4j.com/docs/cypher-manual/current/functions/temporal/#functions-datetime) temporal type.

```graphql
type Flight {
    id: ID
    createdAt: DateTime
    delayed: DateTime
}
```

You can filter using equality;

```
query {
    Flights(where: { createdAt: "2021-01-01T20:26:08.748Z" }) {
        id
    }
}
```

You can also filter on dates using the following;

1. createdAt_LT
2. createdAt_LTE
3. createdAt_GT
4. createdAt_GTE

#### @timestamps

Appends properties createdAt & updatedAt on specified nodes. You are able to filter, sort and query by timestamps too! Timestamps use the [datetime](https://neo4j.com/docs/cypher-manual/current/functions/temporal/#functions-datetime) temporal type and are generated from within the database.

```graphql
type Flight @timestamps {
    id: ID
    delayed: DateTime
}
```

#### @readonly

Specify what fields cant be modified. You can still create readonly fields.

```graphql
type Post {
    id: ID!
    content: String!
    author: User @relationship(type: "HAS_POST", direction: "IN") @readonly
}
```

#### @autogenerated

On creating, if not specified, will create a [`randomUUID`](https://neo4j.com/docs/cypher-manual/current/functions/scalar/#functions-randomuuid).

```graphql
type User {
    id: ID! @autogenerated
}
```

## Querying

1. Finding
2. Creating
3. Updating
4. Deleting
