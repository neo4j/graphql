# Reference

This is the reference documentation for @neo4j/graphql. It covers the programming model, APIs, concepts, annotations and technical details of the library.

This document is split into zones;

1. Setup - Importable functions and classes
2. Schema - Defining your GraphQL Schema
3. Querying - Interacting with the generated schema
4. Developer Notes - Some tips, pointers and gotchas pointed out

## Setup

Importable functions and classes

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

### Implementing Custom Resolvers

This library will auto-generate resolvers for queries and mutations, you don't need to implement resolvers yourself, however if you have some custom code you can specify custom resolvers.

#### Custom Field Resolver

```js
const typeDefs = `
    type User {
        userId: ID!
        firstName: String
        lastName: String
        fullName: String
    }
`;

const resolvers = {
    User: {
        fullName(root, params, ctx, resolveInfo) {
            return `${root.firstName} ${root.lastName}`;
        },
    },
};

const schema = makeAugmentedSchema({
    typeDefs,
    resolvers,
});
```

#### Custom Query Resolver

> Same applies for Mutations and Subscriptions

```js
const typeDefs = `
    type User {
        userId: ID!
    }

    type Query {
        users: [User]
    }
`;

const resolvers = {
    Query: {
        users: () => // do some logic
    }
};

const schema = makeAugmentedSchema({
    typeDefs,
    resolvers,
});
```

### NeoSchema

Core class of the library. Holds all metadata about schema.

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
    context: ({ req }) => ({ req, driver })
});
```

> Notice `context` driver injection

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

Defining your GraphQL Schema.

### Nodes

To represent a node in the GraphQL schema use the `type` definition;

```graphql
type Node {
    id: ID
}
```

### Relationships

To represent a relationship between two nodes use the `@relationship` directive;

```graphql
type Node {
    id: ID
    related: [Node] @relationship(type: "RELATED", direction: "OUT")
}
```

### @cypher

GraphQL schema directive that can be used to bind a GraphQL field to the results of a Cypher query. For example, let's add a field similarMovies to our Movie which is bound to a Cypher query to find other movies with an overlap of actors;

```graphql
type Actor {
    actorId: ID!
    name: String
    movies: [Movie] @relationship(type: "ACTED_IN", direction: "OUT")
}

type Movie {
    movieId: ID!
    title: String
    description: String
    year: Int
    actors(limit: Int = 10): [Actor]
        @relationship(type: "ACTED_IN", direction: "IN")
    similarMovies(limit: Int = 10): [Movie]
        @cypher(
            statement: """
            MATCH (this)<-[:ACTED_IN]-(:Actor)-[:ACTED_IN]->(rec:Movie)
            WITH rec, COUNT(*) AS score ORDER BY score DESC
            RETURN rec LIMIT $limit
            """
        )
}
```

As well as fields on types you can also define a custom `@cypher` directive on a custom Query or Mutation;

```graphql
type Actor {
    actorId: ID!
    name: String
}

type Query {
    allActors: [Actor]
        @cypher(
            statement: """
            MATCH (a:Actor)
            RETURN a
            """
        )
}
```

#### Statement Globals

Global variables available inside the `@cypher` statement.

1. `this` - bound to the currently resolved node
2. `jwt` - decoded JWT object or `{}`

#### Returning from the cypher statement

You must return a single value representing corresponding type;

_Primitives_

```graphql
type Query {
    randomNumber: Int @cypher(statement: "RETURN rand()") ## ✅ Supported
}
```

_Nodes_

```graphql
type Query {
    users: [User]
        @cypher(
            statement: """
            MATCH (u:User)
            RETURN u
            """
        ) ## ✅ Supported
}
```

_Objects_

```graphql
type User {
    id
}

type Query {
    users: [User] @cypher(statement: """
        MATCH (u:User)
        RETURN {
            id: u.id
        }
    """) ## ✅ Supported
}
```

_Multiple Rows_ ❌

```graphql
type User {
    id
}

type Query {
    users: [User] @cypher(statement: """
        MATCH (u:User)-[:HAS_POST]->(p:Post)
        RETURN u, p
    """) ## ❌ Not Supported
}
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

⚠ You will need to inject the request object into the context before you can use auth. Here is an example using Apollo Sever.

```js
const neoSchema = makeAugmentedSchema({});

const server = new ApolloServer({
    schema: neoSchema.schema,
    context: ({ req }) => ({ req }),
});
```

#### Placement

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
    operations: ("create" | "read" | "update" | "delete")[];
    roles?: string[];
    isAuthenticated?: boolean
    allow?: any | "*";
    bind?: any | "*";
}[]
```

#### operations

Array of either `"create" | "read" | "update" | "delete"` the corresponding `allow` and `roles` will be checked on each subsequent operation.

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

type Post
    @auth(
        rules: [
            {
                allow: [{ moderator: { id: "sub" } }] # "sub" being "req.jwt.sub"
                operations: ["update"]
            }
        ]
    ) {
    id: ID!
    title: String!
    moderator: User @relationship(type: "MODERATES_POST", direction: "IN")
}
```

## Querying

Interacting with the generated schema. For the purposes of this section we will use the following schema;

```graphql
type Post @timestamps {
    id: ID! @autogenerated
    content: String!
    creator: User @relationship(type: "HAS_POST", direction: "IN")
}

type User @timestamps {
    id: ID! @autogenerated
    name: String
    posts: [Post] @relationship(type: "HAS_POST", direction: "OUT")
}
```

You are highly encouraged to 'spin up' a playground and experiment will the full generated schema. You can also checkout the [TCK test's](https://github.com/neo4j/graphql/tree/master/packages/graphql/tests/tck/tck-test-files) for more a detailed view.

### Reading

```graphql
query {
    Users {
        id
        name
    }
}
```

### Reading Relationships

```graphql
query {
    Users {
        posts {
            content
        }
    }
}
```

### Filtering

> Checkout [TCK](https://github.com/neo4j/graphql/blob/master/packages/graphql/tests/tck/tck-test-files/cypher-advanced-filtering.md) for more advanced querying.

Use the `where` argument;

```graphql
query {
    Users(where: { id: "123" }) {
        id
        name
    }
}
```

### Filtering Relationships

Use the `where` argument, on the field;

```graphql
query {
    Users {
        id
        name
        posts(where: { id: "123" }) {
            content
        }
    }
}
```

### Sorting

Sort using the `options` argument;

```graphql
query {
    Users(options: { sort: createdAt_DESC }) {
        id
        name
        createdAt
    }
}
```

### Sorting Relationships

Sort using the `options` argument, on the field;

```graphql
query {
    Users {
        id
        name
        posts(options: { sort: createdAt_DESC }) {
            content
        }
    }
}
```

### Limiting

Limit using the `options` argument;

```graphql
query {
    Users(options: { limit: 10 }) {
        id
        name
        createdAt
    }
}
```

### Limiting Relationships

Limit using the `options` argument, on the field;

```graphql
query {
    Users {
        id
        name
        posts(options: { limit: 10 }) {
            content
        }
    }
}
```

### Skipping

Limit using the `options` argument;

```graphql
query {
    Users(options: { skip: 10 }) {
        id
        name
        createdAt
    }
}
```

### Skipping Relationships

Limit using the `options` argument, on the field;

```graphql
query {
    Users {
        id
        name
        posts(options: { skip: 10 }) {
            content
        }
    }
}
```

### Creating

```graphql
mutation {
    createUsers(input: [{ name: "dan" }]) {
        id
        name
    }
}
```

### Creating a relationship (Create Mutation)

```graphql
mutation {
    createUsers(
        input: [
            {
                name: "dan"
                posts: { create: [{ content: "cool nested mutations" }] }
            }
        ]
    ) {
        id
        name
    }
}
```

### Connecting a relationship (Create Mutation)

```graphql
mutation {
    createUsers(
        input: [
            {
                name: "dan"
                posts: {
                    connect: { where: { content: "cool nested mutations" } }
                }
            }
        ]
    ) {
        id
        name
    }
}
```

### Updating

```graphql
mutation {
    updateUsers(where: { name: "dan" }, update: { name: "dan" }) {
        id
        name
    }
}
```

### Creating a relationship (Update Mutation)

```graphql
mutation {
    updateUsers(
        where: { name: "dan" }
        create: { posts: [{ content: "cool nested mutations" }] }
    ) {
        id
        name
    }
}
```

### Connecting a relationship (Update Mutation)

```graphql
mutation {
    updateUsers(
        where: { name: "dan" }
        connect: { posts: { where: { content: "cool nested mutations" } } }
    ) {
        id
        name
    }
}
```

### Disconnecting a relationship

```graphql
mutation {
    updateUsers(
        where: { name: "dan" }
        disconnect: { posts: { where: { content: "cool nested mutations" } } }
    ) {
        id
        name
    }
}
```

### Deleting

```graphql
mutation {
    deleteUsers(where: { name: "dan" }) {
        nodesDeleted
    }
}
```

## Developer Notes

Some tips, pointers and gotchas pointed out

### Large Mutations

There is no lie that nested mutations are very powerful. We have to generate complex cypher to provide the abstractions such as `connect` and `disconnect`. Due to the complexity and size of the cypher we generate its not advised to abuse it. Using the Generated GraphQL schema, If you were to attempt the creation of say one hundred nodes and relations at once Neo4j may throw memory errors. This is simply because of the size of the cypher we generate. If you need to do large edits to the graph you may be better using cypher directly, that being said the abstraction's provided should be fine for most use cases.

> If memory issues are a regular occurrence. You can edit the `dbms.memory.heap.max_size` in the DBMS settings
