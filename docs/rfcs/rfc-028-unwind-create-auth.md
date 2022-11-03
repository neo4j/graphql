## Problem

Currently, the `unwind-create` does not supports the auth capability, this RFC wants to extends the RFC-024 to support fully the auth mechanism.
The `@auth` directive implements both Authorization and Authentification mechanism, this RFC will consider only the Authorization mechanism as it seems
that are the only ones impacted by the unwind-create RFC.

### Examples

**Schema**

```graphql
type Actor @auth(rules: [{ allow: { id: "$jwt.sub" } }]) {
    id: ID! @id
    name: String
    movies: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT)
}

type Movie
    @auth(
        rules: [
            { operations: [CREATE, UPDATE], roles: ["admin"] }
            { operations: [CREATE, UPDATE, CONNECT], allow: { actors: { id: "$jwt.sub" } } }
        ]
    ) {
    id: ID
    title: String
    actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN)
}
```

**GraphQL**

```graphql
mutation Mutation {
    createMovies(input: [{ title: "The Matrix" }, { title: "The Matrix Resurrection" }]) {
        movies {
            title
        }
    }
}
```

**Cypher**

```cypher
CALL {
    CREATE (this0:Movie)
    SET this0.title = $this0_title
    WITH this0
    CALL apoc.util.validate(NOT (any(auth_var1 IN [\\"admin\\"] WHERE any(auth_var0 IN $auth.roles WHERE auth_var0 = auth_var1))), \\"@neo4j/graphql/FORBIDDEN\\", [0])
    WITH this0
    CALL {
    	WITH this0
    	MATCH (this0)-[this0_website_Website_unique:HAS_WEBSITE]->(:Website)
    	WITH count(this0_website_Website_unique) as c
    	CALL apoc.util.validate(NOT (c <= 1), '@neo4j/graphql/RELATIONSHIP-REQUIREDMovie.website must be less than or equal to one', [0])
    	RETURN c AS this0_website_Website_unique_ignored
    }
    RETURN this0
}
CALL {
    CREATE (this1:Movie)
    SET this1.title = $this1_title
    WITH this1
    CALL apoc.util.validate(NOT (any(auth_var1 IN ["admin"] WHERE any(auth_var0 IN $auth.roles WHERE auth_var0 = auth_var1))), \\"@neo4j/graphql/FORBIDDEN\\", [0])
    WITH this1
    CALL {
    	WITH this1
    	MATCH (this1)-[this1_website_Website_unique:HAS_WEBSITE]->(:Website)
    	WITH count(this1_website_Website_unique) as c
    	CALL apoc.util.validate(NOT (c <= 1), '@neo4j/graphql/RELATIONSHIP-REQUIREDMovie.website must be less than or equal to one', [0])
    	RETURN c AS this1_website_Website_unique_ignored
    }
    RETURN this1
}
RETURN [ this0 { .title }, this1 { .title }] AS data
```

As it's visible by the example, for every `CREATE` subquery the statement `CALL apoc.util.validate(NOT (any(auth_var1 IN [\\"admin\\"] WHERE any(auth_var0 IN $auth.roles WHERE auth_var0 = auth_var1))), \\"@neo4j/graphql/FORBIDDEN\\", [0])` is introduced to check if the request is authorised or not.

## Proposed Solution

Authorization in the Neo4jGraphQL library is built on top of these mechanism:

-   `Roles`
-   `Bind`
-   `Where`
-   `Allow`

As `Where` and `Allow` seems to have no impact on the unwind-create, this solution will focus on the `Bind` and `Roles` rule,

### Roles rule

Given the following typeDefinitions:

```graphql
type User {
    id: ID
    name: String
}

type Post @auth(rules: [{ operations: [CREATE], roles: ["admin"] }]) {
    content: String
    moderators: [User!]! @relationship(type: "MODERATES_POST", direction: IN)
}
```

the following mutation:

```graphql
mutation CreatePosts {
    createPosts(input: [{ content: "What a wonderful post!" }]) {
        posts {
            content
        }
    }
}
```

The current cypher generated is:

```cypher
CALL {
CREATE (this0:Post)
SET this0.content = $this0_content
WITH this0
CALL apoc.util.validate(NOT (any(auth_var1 IN ["admin"] WHERE any(auth_var0 IN $auth.roles WHERE auth_var0 = auth_var1))), "@neo4j/graphql/FORBIDDEN", [0])
RETURN this0
}
RETURN [this0 { .content }] AS data
```

params:

```javascript
{
  "this0_content": "What a wonderful post!",
  "resolvedCallbacks": {},
  "auth": {
    "isAuthenticated": true,
    "roles": [],
    "jwt": {
      "sub": "1234567890",
      "name": "John Doe",
      "iat": 1516239022
    }
  }
}
```

The same behaviour is achievable also in the unwind-create format, as:

```cypher
UNWIND $create_param0 AS create_var1
CALL {
    WITH create_var1
    CREATE (create_this0:`Post`)
    SET
        create_this0.content = create_var1.content
    WITH create_this0, create_var1
    CALL apoc.util.validate(NOT (any(auth_var1 IN ["admin"] WHERE any(auth_var0 IN $auth.roles WHERE auth_var0 = auth_var1))), "@neo4j/graphql/FORBIDDEN", [0])
    RETURN create_this0
}
RETURN collect(create_this0 { .content }) AS data
```

params:

```javascript
{
  "create_param0": [
    {
      "content": "What a wonderful world!"
    }
  ],
  "resolvedCallbacks": {}
}
```

### Field level definition

Given the following typeDefinitions:

```graphql
type User {
    id: ID
    name: String
}

type Post {
    title: String
    content: String @auth(rules: [{ operations: [CREATE], roles: ["admin"] }])
    moderators: [User!]! @relationship(type: "MODERATES_POST", direction: IN)
}
```

the following mutation:

```graphql
mutation CreatePosts {
    createPosts(input: [{ content: "What a wonderful post!" }, { title: "An incredible title!" }]) {
        posts {
            content
        }
    }
}
```

The current cypher generated is:

```cypher
CALL {
    CREATE (this0:Post)
    SET this0.content = $this0_content
    WITH this0
    CALL apoc.util.validate(NOT (any(auth_var1 IN ["admin"] WHERE any(auth_var0 IN $auth.roles WHERE auth_var0 = auth_var1))), "@neo4j/graphql/FORBIDDEN", [0])
    RETURN this0
}
CALL {
    CREATE (this1:Post)
    SET this1.title = $this1_title
    RETURN this1
}
RETURN [ this0 { .content }, this1 { .content }] AS data
```

params:

```javascript
{
  "this0_content": "What a wonderful world!",
  "this1_title": "An incredible title!",
  "resolvedCallbacks": {},
  "auth": {
    "isAuthenticated": true,
    "roles": [],
    "jwt": {
      "sub": "1234567890",
      "name": "John Doe",
      "iat": 1516239022
    }
  }
}
```

To achieve the same behaviour using the unwind-create format:

```cypher
UNWIND $create_param0 AS create_var1
CALL {
    WITH create_var1
    CREATE (create_this0:`Post`)
    SET
        create_this0.content = create_var1.content,
        create_this0.title = create_var1.title
    WITH create_var1, create_this0
    CALL apoc.util.validate(create_var1.content IS NOT NULL and NOT (any(auth_var1 IN ["admin"] WHERE any(auth_var0 IN $auth.roles WHERE auth_var0 = auth_var1))), "@neo4j/graphql/FORBIDDEN", [0])
    RETURN create_this0
}
RETURN collect(create_this0 { .content }) AS data
```

params:

```javascript
{
  "create_param0": [
    {
      "content": "What a wonderful world!"
    },
    {
      "title": "An incredible title!"
    }
  ],
  "resolvedCallbacks": {},
  "auth": {
    "isAuthenticated": true,
    "roles": [],
    "jwt": {
      "sub": "1234567890",
      "name": "John Doe",
      "iat": 1516239022
    }
  }
}
```

### Nested auth

Given the following type definitions:

```graphql
type User @auth(rules: [{ operations: [CREATE], roles: ["admin"] }]) {
    id: ID
    name: String
}

type Post {
    title: String
    content: String
    moderators: [User!]! @relationship(type: "MODERATES_POST", direction: IN)
}
```

```graphql
mutation CreatePosts {
    createPosts(
        input: [
            {
                title: "A wonderful title!"
                content: "A wonderful post!"
                moderators: { create: [{ node: { id: "new-id-1", name: "Simone" } }] }
            }
        ]
    ) {
        posts {
            title
            content
            moderators {
                name
            }
        }
    }
}
```

The current cypher generated is:

```cypher
CALL {
    CREATE (this0:Post)
    SET this0.title = $this0_title
    SET this0.content = $this0_content
    WITH this0
    CREATE (this0_moderators0_node:User)
    SET this0_moderators0_node.id = $this0_moderators0_node_id
    SET this0_moderators0_node.name = $this0_moderators0_node_name
    WITH this0, this0_moderators0_node
    CALL apoc.util.validate(NOT (any(auth_var1 IN ["admin"] WHERE any(auth_var0 IN $auth.roles WHERE auth_var0 = auth_var1))), "@neo4j/graphql/FORBIDDEN", [0])
    MERGE (this0)<-[:MODERATES_POST]-(this0_moderators0_node)
    RETURN this0
}
CALL {
    WITH this0
    MATCH (this0_moderators:`User`)-[create_this0:MODERATES_POST]->(this0)
    WITH this0_moderators { .name } AS this0_moderators
    RETURN collect(this0_moderators) AS this0_moderators
}
RETURN [this0 { .title, .content, moderators: this0_moderators }] AS data
```

params:

```javascript
{
  "this0_title": "An incredible title!",
  "this0_content": "What a wonderful world!",
  "this0_moderators0_node_id": "new-id-1",
  "this0_moderators0_node_name": "Simone",
  "resolvedCallbacks": {},
  "auth": {
    "isAuthenticated": true,
    "roles": [],
    "jwt": {
      "sub": "1234567890",
      "name": "John Doe",
      "iat": 1516239022
    }
  }
}
```

--- unwind

```cypher
UNWIND $create_param0 AS create_var2
CALL {
    WITH create_var2
    CREATE (create_this1:`Post`)
    SET
        create_this1.title = create_var2.title,
        create_this1.content = create_var2.content
    WITH create_this1, create_var2
    CALL {
        WITH create_this1, create_var2
        UNWIND create_var2.moderators.create AS create_var3
        WITH create_var3.node AS create_var4, create_var3.edge AS create_var5, create_this1
        CREATE (create_this6:`User`)
        SET
            create_this6.id = create_var4.id,
            create_this6.name = create_var4.name
        MERGE (create_this6)-[create_this7:MODERATES_POST]->(create_this1)
        WITH create_this1, create_var4
        CALL apoc.util.validate(NOT (any(auth_var1 IN ["admin"] WHERE any(auth_var0 IN $auth.roles WHERE auth_var0 = auth_var1))), "@neo4j/graphql/FORBIDDEN", [0])
        RETURN collect(NULL)
    }
    RETURN create_this1
}
CALL {
    WITH create_this1
    MATCH (create_this1_moderators:`User`)-[create_this0:MODERATES_POST]->(create_this1)
    WITH create_this1_moderators { .name } AS create_this1_moderators
    RETURN collect(create_this1_moderators) AS create_this1_moderators
}
RETURN collect(create_this1 { .title, .content, moderators: create_this1_moderators }) AS data
```

params:

```javascript
{
  "create_param0": [
    {
      "title": "A wonderful title!",
      "content": "A wonderful post!",
      "moderators": {
        "create": [
          {
            "node": {
              "id": "new-id-1",
              "name": "Simone"
            }
          }
        ]
      }
    }
  ],
  "resolvedCallbacks": {}
}
```

#### Field level definition

Given the following type definitions:

```graphql
type User {
    id: ID
    name: String @auth(rules: [{ operations: [CREATE], roles: ["admin"] }])
}

type Post {
    title: String
    content: String
    moderators: [User!]! @relationship(type: "MODERATES_POST", direction: IN)
}
```

```graphql
mutation CreatePosts {
    createPosts(
        input: [
            {
                title: "A wonderful title!"
                content: "A wonderful post!"
                moderators: { create: [{ node: { id: "new-id-1", name: "Simone" } }, { node: { id: "new-id-2" } }] }
            }
        ]
    ) {
        posts {
            title
            content
            moderators {
                name
            }
        }
    }
}
```

The current cypher generated is:

```cypher
CALL {
    CREATE (this0:Post)
    SET this0.title = $this0_title
    SET this0.content = $this0_content
    WITH this0
    CREATE (this0_moderators0_node:User)
    SET this0_moderators0_node.id = $this0_moderators0_node_id
    SET this0_moderators0_node.name = $this0_moderators0_node_name
    WITH this0, this0_moderators0_node
    CALL apoc.util.validate(NOT (any(auth_var1 IN ["admin"] WHERE any(auth_var0 IN $auth.roles WHERE auth_var0 = auth_var1))), "@neo4j/graphql/FORBIDDEN", [0])
    MERGE (this0)<-[:MODERATES_POST]-(this0_moderators0_node)
    WITH this0
    CREATE (this0_moderators1_node:User)
    SET this0_moderators1_node.id = $this0_moderators1_node_id
    MERGE (this0)<-[:MODERATES_POST]-(this0_moderators1_node)
    RETURN this0
}
CALL {
    WITH this0
    MATCH (this0_moderators:`User`)-[create_this0:MODERATES_POST]->(this0)
    WITH this0_moderators { .name } AS this0_moderators
    RETURN collect(this0_moderators) AS this0_moderators
}
RETURN [this0 { .title, .content, moderators: this0_moderators }] AS data
```

params:

```javascript
{
  "this0_title": "A wonderful title!",
  "this0_content": "A wonderful post!",
  "this0_moderators0_node_id": "new-id-1",
  "this0_moderators0_node_name": "Simone",
  "this0_moderators1_node_id": "new-id-2",
  "resolvedCallbacks": {},
  "auth": {
    "isAuthenticated": true,
    "roles": [],
    "jwt": {
      "sub": "1234567890",
      "name": "John Doe",
      "iat": 1516239022
    }
  }
}
```

--- unwind

```cypher
UNWIND $create_param0 AS create_var2
CALL {
    WITH create_var2
    CREATE (create_this1:`Post`)
    SET
        create_this1.title = create_var2.title,
        create_this1.content = create_var2.content
    WITH create_this1, create_var2
    CALL {
        WITH create_this1, create_var2
        UNWIND create_var2.moderators.create AS create_var3
        WITH create_var3.node AS create_var4, create_var3.edge AS create_var5, create_this1
        CREATE (create_this6:`User`)
        SET
            create_this6.id = create_var4.id,
            create_this6.name = create_var4.name
        WITH create_this6, create_this1, create_var4
        CALL apoc.util.validate(create_this6.name IS NOT NULL AND NOT (any(auth_var1 IN ["admin"] WHERE any(auth_var0 IN [] WHERE auth_var0 = auth_var1))), "@neo4j/graphql/FORBIDDEN", [0])
        MERGE (create_this6)-[create_this7:MODERATES_POST]->(create_this1)
        RETURN collect(NULL)
    }
    RETURN create_this1
}
CALL {
    WITH create_this1
    MATCH (create_this1_moderators:`User`)-[create_this0:MODERATES_POST]->(create_this1)
    WITH create_this1_moderators { .name } AS create_this1_moderators
    RETURN collect(create_this1_moderators) AS create_this1_moderators
}
RETURN collect(create_this1 { .title, .content, moderators: create_this1_moderators }) AS data
```

params:

```javascript
{
  "create_param0": [
    {
      "title": "A wonderful title!",
      "content": "A wonderful post!",
      "moderators": {
        "create": [
          {
            "node": {
              "id": "new-id-1",
              "name": "Simone"
            }
          },
          {
            "node": {
              "id": "new-id-2"
            }
          }
        ]
      }
    }
  ],
  "resolvedCallbacks": {}
}
```

### Bind

Given the following type definitions:

```graphql
type User {
    id: ID
    name: String
}

type Post @auth(rules: [{ operations: [CREATE], bind: { authorId: "$jwt.sub" } }]) {
    authorId: ID
    title: String
    content: String
    moderators: [User!]! @relationship(type: "MODERATES_POST", direction: IN)
}
```

```graphql
mutation CreatePosts {
    createPosts(input: [{ authorId: "new-id-1", content: "A wonderful post!" }]) {
        posts {
            title
            content
            moderators {
                name
            }
        }
    }
}
```

generates the following cypher:

```cypher
CALL {
    CREATE (this0:Post)
    SET this0.authorId = $this0_authorId
    SET this0.content = $this0_content
    WITH this0
    CALL apoc.util.validate(NOT ((this0.authorId IS NOT NULL AND this0.authorId = $this0auth_param0)), "@neo4j/graphql/FORBIDDEN", [0])
    RETURN this0
}
RETURN [this0 { .content }] AS data
```

params:

```javascript
{
  "this0_authorId": "new-id-1",
  "this0_content": "A wonderful post!",
  "this0auth_param0": "1234567890",
  "resolvedCallbacks": {}
}
```

-- unwind

```cypher
UNWIND $create_param0 AS create_var1
CALL {
    WITH create_var1
    CREATE (create_this0:`Post`)
    SET
        create_this0.authorId = create_var1.authorId,
        create_this0.content = create_var1.content
    WITH create_this0, create_var1
    CALL apoc.util.validate(NOT ((create_this0.authorId IS NOT NULL AND create_this0.authorId = $this0auth_param0)), "@neo4j/graphql/FORBIDDEN", [0])
    RETURN create_this0
}
RETURN collect(create_this0 { .content }) AS data
```

params:

```javascript
{
  "create_param0": [
    {
      "authorId": "new-id-1",
      "content": "A wonderful post!",
    }
  ],
  "resolvedCallbacks": {}
}
```
#### field level auth

Given the following type definitions:

```graphql
type User {
    id: ID
    name: String
}

type Post {
    authorId: ID @auth(rules: [{ operations: [CREATE], bind: { authorId: "$jwt.sub" } }])
    title: String
    content: String
    moderators: [User!]! @relationship(type: "MODERATES_POST", direction: IN)
}
```

```graphql
mutation CreatePosts {
    createPosts(input: [{ authorId: "new-id-1", content: "A wonderful post!" }, { content: "A wonderful post!" } ]) {
        posts {
            title
            content
            moderators {
                name
            }
        }
    }
}
```

it generates:

```cypher
CALL {
    CREATE (this0:Post)
    SET this0.authorId = $this0_authorId
    SET this0.content = $this0_content
    WITH this0
    CALL apoc.util.validate(NOT ((this0.authorId IS NOT NULL AND this0.authorId = $this0auth_param0)), "@neo4j/graphql/FORBIDDEN", [0])
    RETURN this0
}
CALL {
    CREATE (this1:Post)
    SET this1.content = $this1_content
    RETURN this1
}
RETURN [this0 { .content }, this1 { .content }] AS data
```

params:
```javascript
{
  "this0auth_param0": "new-id-1",
  "this0_authorId": "new-id-1",
  "this0_content": "A wonderful post!",
  "this1_content": "A wonderful post!",
  "resolvedCallbacks": {}
}
```

-- unwind

cypher:
```
UNWIND $create_param0 AS create_var1
CALL {
    WITH create_var1
    CREATE (create_this0:`Post`)
    SET
        create_this0.authorId = create_var1.authorId,
        create_this0.content = create_var1.content
    RETURN create_this0
}
RETURN collect(create_this0 { .content }) AS data
```

params:

```javascript
{
  "create_param0": [
    {
      "authorId": "new-id-1",
      "content": "A wonderful post!"
    },
    {
      "content": "A wonderful post!"
    }
  ],
  "resolvedCallbacks": {}
}
```


## TODO

-   `Allow` Semes out of scope
-   `Bind` To be implemented
-   `Roles` To be implemented in both Root and Nested
-   `Where` Seems to not be impacted
-   `Field level definition` To be implemented at least for Roles, only when the field is part of the input
