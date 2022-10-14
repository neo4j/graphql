/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 *
 * This file is part of Neo4j.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import Neo4jGraphQLFederationPlugin from "./Neo4jGraphQLFederationPlugin";

describe("Neo4jGraphQLFederationPlugin", () => {
    test("something", () => {
        const t = `
            type User @key(fields: "id") {
                id: ID!
            }

            extend type User @key(fields: "name") {
                name: String!
            }
        `;

        const plugin = new Neo4jGraphQLFederationPlugin({ typeDefs: t, directives: ["@key"] });

        const { typeDefs, resolvers } = plugin.getTypeDefsAndResolvers(t);

        expect(typeDefs).toMatchInlineSnapshot(`
            "schema @link(url: \\"https://specs.apollo.dev/link/v1.0\\") @link(url: \\"https://specs.apollo.dev/federation/v2.0\\", import: [\\"@key\\"]) {
              query: Query
            }

            directive @link(url: String, as: String, for: link__Purpose, import: [link__Import]) repeatable on SCHEMA

            directive @key(fields: federation__FieldSet!, resolvable: Boolean = true) repeatable on OBJECT | INTERFACE

            directive @federation__requires(fields: federation__FieldSet!) on FIELD_DEFINITION

            directive @federation__provides(fields: federation__FieldSet!) on FIELD_DEFINITION

            directive @federation__external(reason: String) on OBJECT | FIELD_DEFINITION

            directive @federation__tag(name: String!) repeatable on FIELD_DEFINITION | OBJECT | INTERFACE | UNION | ARGUMENT_DEFINITION | SCALAR | ENUM | ENUM_VALUE | INPUT_OBJECT | INPUT_FIELD_DEFINITION

            directive @federation__extends on OBJECT | INTERFACE

            directive @federation__shareable on OBJECT | FIELD_DEFINITION

            directive @federation__inaccessible on FIELD_DEFINITION | OBJECT | INTERFACE | UNION | ARGUMENT_DEFINITION | SCALAR | ENUM | ENUM_VALUE | INPUT_OBJECT | INPUT_FIELD_DEFINITION

            directive @federation__override(from: String!) on FIELD_DEFINITION

            directive @federation__composeDirective(name: String) repeatable on SCHEMA

            type User @key(fields: \\"name\\") {
              id: ID!
              name: String!
            }

            enum link__Purpose {
              \\"\\"\\"
              \`SECURITY\` features provide metadata necessary to securely resolve fields.
              \\"\\"\\"
              SECURITY
              \\"\\"\\"
              \`EXECUTION\` features provide metadata necessary for operation execution.
              \\"\\"\\"
              EXECUTION
            }

            scalar link__Import

            scalar federation__FieldSet

            scalar _Any

            type _Service {
              sdl: String
            }

            union _Entity = User

            type Query {
              _entities(representations: [_Any!]!): [_Entity]!
              _service: _Service!
            }"
        `);

        expect(resolvers).toMatchInlineSnapshot(`
            Object {
              "Query": Object {
                "_entities": Object {
                  "resolve": [Function],
                },
                "_service": Object {
                  "resolve": [Function],
                },
              },
              "User": Object {},
              "_Any": "_Any",
              "_Entity": Object {
                "__resolveType": [Function],
              },
              "_Service": Object {},
              "federation__FieldSet": "federation__FieldSet",
              "link__Import": "link__Import",
              "link__Purpose": Object {
                "EXECUTION": "EXECUTION",
                "SECURITY": "SECURITY",
              },
            }
        `);
    });
});

/*

```
type User @key(fields: "id") {
    id: ID!
}

extend type User @key(fields: "name") {
    name: String!
}
```


Should throw error:
```
interface Animal @key(fields: "colour") {
    colour: String!
}

type Dog implements Animal {
    colour: String
}
```


*/
