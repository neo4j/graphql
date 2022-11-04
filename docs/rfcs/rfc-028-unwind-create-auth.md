## Problem

Currently, the `unwind-create` does not support the auth capability, this RFC wants to extend the RFC-024 to fully support the auth mechanism.

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

As it's visible by the example, for every `CREATE` subquery the statement `apoc.util.validate` is introduced to check if the request is authorized or not.
This mechanism is not implemented in the first version of unwind create and this RFC wants to describe a possible implementation of it

## Proposed Solution

Authorization in the Neo4jGraphQL library is built on top of these mechanisms:

-   `Roles`
-   `Bind`
-   `Where`
-   `Allow`

`Where` and `Allow` seems to have no impact during creation, for this reason, this solution is focused on the `Bind` and `Roles` rule.

There is a common pattern in how the `@auth` directive could impact the create mutation depending on how it is used in the type definitions and could be resumed as:

-   ### Entity-type auth

    **Schema**

    ```graphql
    type User {
        id: ID
        name: String
    }

    type Post @auth(rules: [{ operations: [CREATE], roles: ["admin"] }]) {
        title: String
        content: String
        moderators: [User!]! @relationship(type: "MODERATES_POST", direction: IN)
    }
    ```

-   ### Entity-type auth - Field-level definition

    **Schema**

    ```graphql
    type User {
        id: ID
        name: String
    }

    type Post {
        title: String @auth(rules: [{ operations: [CREATE], roles: ["admin"] }])
        content: String
        moderators: [User!]! @relationship(type: "MODERATES_POST", direction: IN)
    }
    ```

-   ### Nested Entity-type auth

    **Schema**

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

-   ### Nested Entity-type auth - Field-level definition

    **Schema**

    ```graphql
    type User {
        id: ID @auth(rules: [{ operations: [CREATE], roles: ["admin"] }])
        name: String
    }

    type Post {
        title: String
        content: String
        moderators: [User!]! @relationship(type: "MODERATES_POST", direction: IN)
    }
    ```

-   ### Particular case: Entity-type Bind - across relationship

    **Schema**

    ```graphql
    type User {
        id: ID
        name: String
    }
    type Post @auth(rules: [{ operations: [CREATE], bind: { creator: { id: "$jwt.sub" } } }]) {
        title: String
        content: String
        creator: [User!]! @relationship(type: "MODERATES_POST", direction: IN)
    }
    ```

### Entity-type solution

Entity type `@auth` as well as Nested Entity type `@auth` no needs particular consideration when used in the unwind-create context.

It could be appended directly on the entity modified,
For instance, preventing a post is created by users without the `ADMIN` role, could be achieved as follow:

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

The validation could be achieved by appending the statement: `CALL apoc.util.validate(NOT (any(auth_var1 IN ["admin"] WHERE any(auth_var0 IN $auth.roles WHERE auth_var0 = auth_var1))), "@neo4j/graphql/FORBIDDEN", [0])` during the creation of the `Post`.

#### Nested Entity-type solution

As for the Entity type solution, when trying to create a new moderator starting from a `Post` create, could be achieved by statically applying the validation block to the `User` create block.

As follow:

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

As shown by the above the `@auth` mechanism can be statically applied to the Nested Entity with the statement `CALL apoc.util.validate(NOT (any(auth_var1 IN ["admin"] WHERE any(auth_var0 IN $auth.roles WHERE auth_var0 = auth_var1))), "@neo4j/graphql/FORBIDDEN", [0])`.

### Field-level definition auth

When `@auth` is applied directly to the field it needs to be considered that the validation should be applied only when the field is impacted by the mutation.

As we compress the whole input in a single query the previous mechanism should be changed accordingly.

Initially, the Cypher generated adds this validation only the `Posts` with the `@auth` fields were present as follow:

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

To achieve the same behavior in the unwind-create context, the validation needs to be changed in a way that is applied only for input with the field present.
This RFC proposes to change the validation string and prepend the statement
`{unwind field} IS NOT NULL and..` to it.

For instance, if we let the `Post` content be modified only by the `ADMIN` users the unwind creation will looks like this:

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

#### Nested Entity-type auth at field-level auth

The same mechanism described in the Field-level auth can be applied on nested create blocks.

For instance, preventing the field `name` of the type `User` is set in a `Post` creation can be achieved as follow:

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
        CALL apoc.util.validate(create_var4.name IS NOT NULL AND NOT (any(auth_var1 IN ["admin"] WHERE any(auth_var0 IN $auth.roles WHERE auth_var0 = auth_var1))), "@neo4j/graphql/FORBIDDEN", [0])
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

### Entity-type Bind - across relationship

Bind could be used across relationship, a valid use case it may be "ensure that users only create Posts related to themselves".

This could be achieved in the unwind-create context by adding the following validation block to the Entity where the `@auth` is definded:

```cypher
    WITH create_this1
    CALL {
            WITH create_this1
            CALL apoc.util.validate(
                NOT ((exists((create_this1)<-[:HAS_POST]-(:`User`)) 
                    AND 
            all(auth_this0 IN [(create_this1)<-[:HAS_POST]-(auth_this0:`User`) | auth_this0]
                 WHERE (auth_this0.id IS NOT NULL AND auth_this0.id = $this0auth_param0))))
                 , "@neo4j/graphql/FORBIDDEN", [0])
    }
```
For instance:

```cypher
UNWIND [
    {
      "title": "A wonderful title!",
      "content": "A wonderful post!",
      "creator": {
        "create": {
          "node": {
            "id": "1234567890",
            "name": "Simone"
          }
        }
      }
    }
  ] AS create_var2
CALL {
    WITH create_var2
    CREATE (create_this1:`Post`)
    SET
        create_this1.title = create_var2.title,
        create_this1.content = create_var2.content
    WITH create_this1, create_var2
    CALL {
        WITH create_this1, create_var2
        UNWIND create_var2.creator.create AS create_var3
        WITH create_var3.node AS create_var4, create_var3.edge AS create_var5, create_this1
        CREATE (create_this6:`User`)
        SET
            create_this6.id = create_var4.id,
            create_this6.name = create_var4.name
        MERGE (create_this6)-[create_this7:HAS_POST]->(create_this1)
        
        RETURN collect(NULL)
    }
    WITH create_this1
    CALL {
        WITH create_this1
        MATCH (create_this1)<-[create_this1_creator_User_unique:HAS_POST]-(:User)
        WITH count(create_this1_creator_User_unique) as c
        CALL apoc.util.validate(NOT (c = 1), '@neo4j/graphql/RELATIONSHIP-REQUIREDPost.creator required', [0])
        RETURN c AS create_this1_creator_User_unique_ignored
    }
    WITH create_this1
    CALL {
            WITH create_this1
            CALL apoc.util.validate(
                NOT ((exists((create_this1)<-[:HAS_POST]-(:`User`)) 
                    AND 
            all(auth_this0 IN [(create_this1)<-[:HAS_POST]-(auth_this0:`User`) | auth_this0]
                 WHERE (auth_this0.id IS NOT NULL AND auth_this0.id = $this0auth_param0))))
                 , "@neo4j/graphql/FORBIDDEN", [0])
            RETURN create_this1
    }
    RETURN create_this1
}
CALL {
    WITH create_this1
    MATCH (create_this1_creator:`User`)-[create_this0:HAS_POST]->(create_this1)
    WITH create_this1_creator { .id, .name } AS create_this1_creator
    RETURN head(collect(create_this1_creator)) AS create_this1_creator
}
RETURN collect(create_this1 { .title, .content, creator: create_this1_creator }) AS data
```


## Out of scope

-   Subscription rules.
-   `Allow` rules.
-   Rules on `connect` or `connectOrCreate` operations.

Full examples:

## Roles rule

**Schema**

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

**GraphQL**

```graphql
mutation CreatePosts {
    createPosts(input: [{ content: "What a wonderful post!" }]) {
        posts {
            content
        }
    }
}
```

**Current Cypher**

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

**Unwind Cypher**

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

### Roles rule - Field level definition

**Schema**

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

**GraphQL**

```graphql
mutation CreatePosts {
    createPosts(input: [{ content: "What a wonderful post!" }, { title: "An incredible title!" }]) {
        posts {
            content
        }
    }
}
```

**Current Cypher**

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

**Unwind Cypher**

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

### Nested Entity Roles rule

**Schema**

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

**GraphQL**

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

**Current Cypher**

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

**Unwind Cypher**

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

#### Nested Entity Roles rule - Field level definition

**Schema**

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

**GraphQL**

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

**Current Cypher**

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

**Unwind Cypher**

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
        CALL apoc.util.validate(create_var4.name IS NOT NULL AND NOT (any(auth_var1 IN ["admin"] WHERE any(auth_var0 IN $auth.roles WHERE auth_var0 = auth_var1))), "@neo4j/graphql/FORBIDDEN", [0])
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

## Bind rule

**Schema**

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

**GraphQL**

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

**Current Cypher**

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

**Unwind Cypher**

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

#### Bind rule - Field level definition

**Schema**

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

**GraphQL**

```graphql
mutation CreatePosts {
    createPosts(input: [{ authorId: "new-id-1", content: "A wonderful post!" }, { content: "A wonderful post!" }]) {
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

**Cypher**

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

**Unwind Cypher**

```
UNWIND $create_param0 AS create_var1
CALL {
    WITH create_var1
    CREATE (create_this0:`Post`)
    SET
        create_this0.authorId = create_var1.authorId,
        create_this0.content = create_var1.content
    WITH create_var1, create_this0
    CALL apoc.util.validate(create_var1.authorId IS NOT NULL and NOT ((create_this0.authorId IS NOT NULL AND create_this0.authorId = $this0auth_param0)), "@neo4j/graphql/FORBIDDEN", [0])
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

#### Bind rule - Nested Entity Bind rule

**Schema**

```graphql
type User @auth(rules: [{ operations: [CREATE], bind: { id: "$jwt.sub" } }]) {
    id: ID
    name: String
}

type Post {
    title: String
    content: String
    moderators: [User!]! @relationship(type: "MODERATES_POST", direction: IN)
}
```

**GraphQL**

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

**Current Cypher**

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
    CALL apoc.util.validate(NOT ((this0_moderators0_node.id IS NOT NULL AND this0_moderators0_node.id = $this0_moderators0_nodeauth_param0)), "@neo4j/graphql/FORBIDDEN", [0])
    MERGE (this0)<-[:MODERATES_POST]-(this0_moderators0_node)
    WITH this0
    CREATE (this0_moderators1_node:User)
    SET this0_moderators1_node.id = $this0_moderators1_node_id
    WITH this0, this0_moderators1_node
    CALL apoc.util.validate(NOT ((this0_moderators1_node.id IS NOT NULL AND this0_moderators1_node.id = $this0_moderators1_nodeauth_param0)), "@neo4j/graphql/FORBIDDEN", [0])
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
  "this0_moderators0_nodeauth_param0": "1234567890",
  "this0_moderators1_node_id": "new-id-2",
  "this0_moderators1_nodeauth_param0": "1234567890",
  "resolvedCallbacks": {}
}
```

**Unwind Cypher**

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
        WITH create_this6
        CALL apoc.util.validate(NOT ((create_this6.id IS NOT NULL AND create_this6.id = $auth_param)), "@neo4j/graphql/FORBIDDEN", [0])
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
              "id": "1234567890",
              "name": "Simone"
            }
          },
          {
            "node": {
              "id": "1234567890"
            }
          }
        ]
      }
    }
  ],
  "auth_param": "1234567890",
  "resolvedCallbacks": {}
}
```

#### Bind rule - Nested Entity Bind rule - Field-level definition

**Schema**

```graphql
type User {
    id: ID @auth(rules: [{ operations: [CREATE], bind: { id: "$jwt.sub" } }])
    name: String
}

type Post {
    title: String
    content: String
    moderators: [User!]! @relationship(type: "MODERATES_POST", direction: IN)
}
```

**GraphQL**

```graphql
mutation CreatePosts {
    createPosts(
        input: [
            {
                title: "A wonderful title!"
                content: "A wonderful post!"
                moderators: { create: [{ node: { id: "new-id-1" } }, { node: { name: "Simone" } }] }
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

**Current Cypher**

```cypher
CALL {
    CREATE (this0:Post)
    SET this0.title = $this0_title
    SET this0.content = $this0_content
    WITH this0
    CREATE (this0_moderators0_node:User)
    SET this0_moderators0_node.id = $this0_moderators0_node_id
    WITH this0, this0_moderators0_node
    CALL apoc.util.validate(NOT ((this0_moderators0_node.id IS NOT NULL AND this0_moderators0_node.id = $this0_moderators0_nodeauth_param0)), "@neo4j/graphql/FORBIDDEN", [0])
    MERGE (this0)<-[:MODERATES_POST]-(this0_moderators0_node)
    WITH this0
    CREATE (this0_moderators1_node:User)
    SET this0_moderators1_node.name = $this0_moderators1_node_name
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
  "this0_moderators0_nodeauth_param0": "1234567890",
  "this0_moderators0_node_id": "new-id-1",
  "this0_moderators1_node_name": "Simone",
  "resolvedCallbacks": {}
}
```

**Unwind Cypher**

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
        WITH this0, this0_moderators0_node
        CALL apoc.util.validate(create_var4.id IS NOT NULL AND NOT ((create_this6.id IS NOT NULL AND create_this6.id = $auth_jwt_sub)), "@neo4j/graphql/FORBIDDEN", [0])
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
              "id": "new-id-1"
            }
          },
          {
            "node": {
              "name": "Simone"
            }
          }
        ]
      }
    }
  ],
  "auth_jwt_sub": "123456789",
  "resolvedCallbacks": {}
}
```
