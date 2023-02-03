# Proposal for Auth 2.0

## Problem

`@auth` has too many responsibilities:

-- authentication

1. restrict access to resource for unauthenticated users : throw

-- authorization: restrict/ grant access to

2. restrict access to resource based on jwt claim value (roles) : throw
3. restrict access to resource based on node property = value : throw
4. restrict access to resource based on node property = jwt claim : throw
5. restrict access to resource based on jwt claim value (roles) : filter
6. restrict access to resource based on node property = value : filter
7. restrict access to resource based on node property = jwt claim : filter

-- validation: ensure data is sensible, applies rules to inputted data

8. rollback operation if post-state does not satisfy condition : throw (bind)
9. [3] do not execute operation if pre-state does not satisfy condition : throw
   -- where
10. add a default where filter to query that can be overriden : filter
11. add a default where filter to query that cannot be overriden : filter

For 5,6,7 previously decided between:

-   creating `@authentication` argument to specify behaviour THROW/FILTER
-   moving to `@where` directive bc it is essentially filtering.

Problems when favouring the `@where` directive:

-   Whether or not the user should be authenticated is ambiguous. Could work around by using the `@authenticated` directive:

    eg.

```gql
extend type User @auth(rules: [
    {
        roles: ["user"]
        where: { id: "$jwt.id" }
    }
    {
        roles: ["admin"]
    }
])

<!-- throws -->
extend type User @authorization(rules: [
  {
    OR: [
      {
        id: "$jwt.id",
        roles: ["user"]
      },
      {
        roles: ["admin"]
      }
    ]
  }
])
<!-- filters -->
extend type User @authenticated @where(filter: {
    OR: [
      {
        id: "$jwt.id",
        roles: ["user"]
      },
      {
        roles: ["admin"]
      }
    ]
})
```

-   How to combine rules that work for unauthenticated users with rules that require authentication?
    eg.

```gql
extend type BlogPost
    @auth(
        rules: [
            {
                operations: [READ]
                where: { OR: [{ publisher: "$jwt.sub" }, { published: true }] }
                allowUnauthenticated: true
            }
        ]
    )

# becomes...

extend type BlogPost
    @where(
        operations: [READ],
        filter: {
          OR: [{ publisher: "$jwt.sub" }, { published: true }]
        }
    )
    <!-- ... compose this via OR with: authenticated AND { visibility: "members" } ?! -->
```

-   Combining directives is hard and does not scale

## Solution

Move away from defining `@authorization` as building upon `@authenticated`.

Reason for `@auth`: Contains rules that control access to resources. [via apoc.util.validatePredicate]

## Previous @auth directive with transformation

Back to "generic" `@auth` with the following changes:

-   `allow` - Use allow to ensure that on matched nodes, there is equality between a value on the JWT and a property on each matched node.

    Keep as property, keep behaviour but introduce an `onDeny` argument to allow for customizing the behaviour.

    Acommodate for combinations with `allowUnauthenticated` by using the new argument `permission`: ANY.

    Acommodate for `isAuthenticated` by using `permission`: AUTHENTICATED.

-   `roles` - Use to specify the allowed roles for an operation

    Not a property any more, but part of the `permission` argument enum.

-   `bind` - Use bind to ensure that on creating or updating nodes, there is equality between a value on the JWT and a property on a matched node. This validation is done after the operation but inside a transaction. Throws if condition not fulfilled.

    Keep behaviour but extract to dedicated directive `@validate` bc it happens **after** resource was accessed, and not as part of accessing it.

    Attempt to expand `$jwt` if encountered, use a default value (null?) if not present. Be weary of possible user input.

-   `where` - Use the where argument on types to conceptually append predicates to the Cypher WHERE clause.

    Keep behaviour but extract to dedicated directive `@where` bc it is essentially filtering.

    Introduce new argument `mode` for customization on how to combine the filters found: at field level, on the implemented interface if applicable, on query/mutation level

## Solution description

1. `@auth` directive:

-   enforces access to resource for different operations: can be or not authenticated, allows client to specify mode of behaviour in case of deny
-   auth rule `allow` should always be APPEND-only, or at least !OVERWRITE-able over `@where`

```gql
enum Permissions {
  ANY
  AUTHENTICATED
  ROLE
  # allows for other values like GROUP
}

enum DenyStrategy {
  THROW
  FILTER
  HIDE  # return full response but "censor" the value of denied resource with a default value (null?)
}

enum Operations {
  READ
  CREATE
  UPDATE
  DELETE
  SUBSCRIBE
}

type Rule {
    permission: Permissions
    onDeny: DenyStrategy  # introduce an ARGUMENT directive like @message(text = "Yay, custom way of specifying error")?
    operations: Operations
    allow: {},
}

directive @auth(
    rules: [Rule]
) on OBJECT | FIELD_DEFINITION | SCHEMA | INTERFACE
```

2. `@where` directive:

-   allows for (default) filtering
-   alternative to `@auth + where`
-   allows client to specify how to combine with other `where` filters: field level, abstract type, query/mutation level, ..

```gql
@where {
  filter: {},
  operations: [READ | ...],
  mode: OVERWRITE | APPEND | ... ??
}
```

3. `@validate` directive

-   same-transaction post-operation predicate
-   throw and revert if false
-   pre-operation falls under @auth umbrella

```gql
@validate {
  expect: {},
  operations: [READ | ...]
}
```

## Examples

```gql
extend type BlogPost
    @auth(
        rules: [
            {
                permission: ANY
                operations: [READ]
                onDeny: FILTER
                allow: { OR: [{ publisher: "$jwt.sub" }, { published: true }] }
            }
            { permission: AUTHENTICATED, operations: [READ], onDeny: FILTER, allow: { visibility: "members" } }
        ]
    )
```

---

1.

```gql
@auth(rules: [
    { operations: [READ], allow unauthenticated: true, where: {isPublic: true}}
    { operations: [READ], roles: ["ADMIN"]}
])
```

--->

```cypher
MATCH (this:`ERsRAGkoPost`)
WHERE (
	(
		(this.published IS NOT NULL AND this.published = $auth_param0)
		OR
		any(auth_var1 IN ["ADMIN"] WHERE any(auth_var0 IN $auth.roles WHERE 	auth_var0 = auth_var1))
	)
	AND
	apoc.util.validatePredicate(
		NOT (any(var1 IN ["ADMIN"] WHERE any(var0 IN $auth.roles WHERE var0 = var1))), "@neo4j/graphql/FORBIDDEN", [0]
	)
)
```

2.

```gql
extend type User @auth(rules: [{ allow: { id: "$jwt.sub" } }])
extend type Post @auth(rules: [{ allow: { creator: { id: "$jwt.sub" } } }])
```

--->

```cypher
MATCH (this:\`User\`)
  WHERE apoc.util.validatePredicate(
    NOT (
      (this.id IS NOT NULL AND this.id = $param0)
    ),
    \\"@neo4j/graphql/FORBIDDEN\\", [0])
  CALL {
      WITH this
      MATCH (this)-[this_connection_postsConnectionthis0:HAS_POST]->(this_Post:\`Post\`)
      WHERE apoc.util.validatePredicate(
        NOT (
          (
            exists((this_Post)<-[:HAS_POST]-(:\`User\`))
            AND
            any(
              this_connection_postsConnectionthis1 IN [(this_Post)<-[:HAS_POST]-(this_connection_postsConnectionthis1:\`User\`) | this_connection_postsConnectionthis1]
              WHERE (this_connection_postsConnectionthis1.id IS NOT NULL AND this_connection_postsConnectionthis1.id = $this_connection_postsConnectionparam0)
            )
          )
        ),
        \\"@neo4j/graphql/FORBIDDEN\\", [0])
      WITH { node: { content: this_Post.content } } AS edge
      WITH collect(edge) AS edges
      WITH edges, size(edges) AS totalCount
      RETURN { edges: edges, totalCount: totalCount } AS this_postsConnection
  }
  RETURN this { .name, postsConnection: this_postsConnection } AS this
```

---

.

.

.

---

### Authentication - isAuthenticated

```gql
type Todo {
    id: ID
    title: String
}
extend type Todo @auth(rules: [{ isAuthenticated: true }])
```

### Authentication - allowUnauthenticated

```gql
type BlogPost
    @auth(
        rules: [
            {
                operations: [READ]
                where: { OR: [{ publisher: "$jwt.sub" }, { published: true }] }
                allowUnauthenticated: true
            }
        ]
    ) {
    id: ID!
    publisher: String!
    published: Boolean!
}
```

### Authorization - Allow

Restrict user1 from accessing user2:

```gql
type User {
    id: ID!
    name: String!
}

extend type User @auth(rules: [{ operations: [READ], allow: { id: "$jwt.sub" } }])
```

### Authorization - Allow across relationships

Grant update access to all Moderators, or the Creator of a Post:

```gql
type User {
    id: ID
    name: String
}

type Post {
    content: String
    moderators: [User!]! @relationship(type: "MODERATES_POST", direction: IN)
    creator: User! @relationship(type: "HAS_POST", direction: IN)
}

extend type Post
    @auth(
        rules: [
            {
                operations: [UPDATE]
                allow: { OR: [{ moderators: { id: "$jwt.sub" } }, { creator: { id: "$jwt.sub" } }] }
            }
        ]
    )
```

### Authorization - Allow at field level

Hide password for all users but the user himself:

```gql
type User {
    id: ID!
    name: String!
    password: String! @auth(rules: [{ allow: { id: "$jwt.sub" } }])
}
```

### Authorization - Roles

Admin role required for all update operations:

```gql
type User {
    id: ID
    name: String
}

extend type User @auth(rules: [{ operations: [UPDATE], roles: ["admin"] }])
```

### Authorization - Where

```gql
type User {
    id: ID
    name: String
}

extend type User @auth(rules: [{ where: { id: "$jwt.id" } }])
```

### Authorization - Where + Roles

JWTs with the user role can only see their own User node, as before, but now, those with the admin role can see all users:

```gql
type User {
    id: ID
    name: String
}

extend type User @auth(rules: [{ roles: ["user"], where: { id: "$jwt.id" } }, { roles: ["admin"] }])
```

.. equivalent to ..

```gql
type User {
    id: ID
    name: String
}

extend type User @auth(rules: [{ OR: [{ roles: ["user"], where: { id: "$jwt.id" } }, { roles: ["admin"] }] }])
```

### Authorization - Bind

After the update or creation of the node, it is validated that the property id on the node is equal to the jwt.sub property. If not, revert:

```gql
type User {
    id: ID!
    name: String!
}

extend type User @auth(rules: [{ operations: [UPDATE], bind: { id: "$jwt.sub" } }])
```

### Authorization - Bind across relationships

ensure that users only create Posts related to themselves:

```gql
type User {
    id: ID
    name: String
}

type Post {
    content: String
    creator: User! @relationship(type: "HAS_POST", direction: IN)
}

extend type Post @auth(rules: [{ operations: [CREATE], bind: { creator: { id: "$jwt.sub" } } }])
```

---

### 168: @auth + cypher fields / variable-length traversal in allow

```gql
type Collection
    @auth(
        rules: [
            {
                allow: {
                    OR: [
                        { team: { members: { _id: "$jwt.sub" } } }
                        { guests: { _id: "$jwt.sub" } }
                        { isGuest: true } # Issue 1: this is expected to be string
                    ]
                }
            }
        ]
    ) {
    _id: ID! @id
    name: String

    path: [Collection]
        @cypher(
            statement: """
            MATCH (this)-[:INSIDE_OF*]->(nodes:Collection)
            RETURN nodes
            """
        )
    team: Team @relationship(type: "TEAM", direction: OUT)

    isGuest: Boolean
        @cypher(
            statement: """
            MATCH (user:User { _id: "$auth.jwt.sub" })
            WITH (
              EXISTS((this)-[:SHARED_WITH]->(user)) OR
              EXISTS((this)-[:INSIDE_OF*]->(:Collection)-[:SHARED_WITH]->(user)) # Issue 2: has to be an @cypher field bc variable-length traversal here
            ) AS isGuest
            RETURN isGuest
            """
        )

    guests: [User] @relationship(type: "SHARED_WITH", direction: OUT)
    collections: [Collection] @relationship(type: "INSIDE_OF", direction: IN)
    posts: [Post] @relationship(type: "INSIDE_OF", direction: IN)
}
```

### 518: @auth where with connection field

```gql
type Person {
    name: String!
    rooms: [Room] @relationship(type: "MEMBER_OF", properties: "Permission", direction: OUT)
}

interface Permission @relationshipProperties {
    role: String
}

type Room {
    roomName: String!
    members: [Person] @relationship(type: "MEMBER_OF", properties: "Permission", direction: IN)
    # @auth(rules: [{ operations: [CREATE, UPDATE, DELETE, CONNECT, DISCONNECT], roles: ["admin"] }])
}

extend type Room
    @auth(
        rules: [
            {
                operations: [CONNECT]
                where: {
                    members: {
                        # If you change this, as expected, John will not be connected to the room "Kewl Room"
                        name: "John"

                        ##### --------> UNCOMMENT THE LINE TO CRASH THE LIBRARY ###### <--------
                        # roomsConnection: { edge: { role: "$context.test" } }
                    }
                }
            }
        ]
    )
```

### 258: allowUnauthenticated ignored when @auth role specified

```gql
type User
    @auth(
        rules: [
            { operations: [READ], allowUnauthenticated: true, where: { published: true } }
            { operations: [READ], roles: ["ADMIN"], where: {} }
        ]
    ) {
    userId: ID! @id
    isPublic: Boolean
}
```

generates:

```cypher
MATCH (this:`ERsRAGkoPost`)
WHERE (
	(
		(this.published IS NOT NULL AND this.published = $auth_param0)
		OR
		any(auth_var1 IN ["ADMIN"] WHERE any(auth_var0 IN $auth.roles WHERE 	auth_var0 = auth_var1))
	)
	AND
	apoc.util.validatePredicate(
		NOT (any(var1 IN ["ADMIN"] WHERE any(var0 IN $auth.roles WHERE var0 = var1))), "@neo4j/graphql/FORBIDDEN", [0]
	)
)
```
