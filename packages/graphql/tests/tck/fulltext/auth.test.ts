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

import { gql } from "graphql-tag";
import { Neo4jGraphQL } from "../../../src";
import { formatCypher, translateQuery } from "../utils/tck-test-utils";
import { createBearerToken } from "../../utils/create-bearer-token";

describe("Cypher -> fulltext -> Auth", () => {
    test("simple match with auth where", async () => {
        const typeDefs = gql`
            type Movie
                @fulltext(indexes: [{ name: "MovieTitle", fields: ["title"] }])
                @authorization(filter: [{ where: { node: { director: { id: "$jwt.sub" } } } }]) {
                title: String
                director: [Person!]! @relationship(type: "DIRECTED", direction: IN)
            }

            type Person {
                id: ID
            }
        `;

        const secret = "shh-its-a-secret";

        const sub = "my-sub";

        const neoSchema = new Neo4jGraphQL({
            typeDefs,
            features: { authorization: { key: secret } },
        });

        const query = gql`
            query {
                movies(fulltext: { MovieTitle: { phrase: "something AND something" } }) {
                    title
                }
            }
        `;

        const token = createBearerToken(secret, { sub });

        const result = await translateQuery(neoSchema, query, { token });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CALL db.index.fulltext.queryNodes(\\"MovieTitle\\", $param0) YIELD node AS this
            WITH *
            WHERE (\\"Movie\\" IN labels(this) AND ($isAuthenticated = true AND EXISTS {
                MATCH (this)<-[:DIRECTED]-(this0:\`Person\`)
                WHERE this0.id = coalesce($jwt.sub, $jwtDefault)
            }))
            RETURN this { .title } AS this"
        `);

        expect(result.params).toMatchInlineSnapshot(`
            Object {
              "isAuthenticated": true,
              "jwt": Object {
                "roles": Array [],
                "sub": "my-sub",
              },
              "jwtDefault": Object {},
              "param0": "something AND something",
            }
        `);
    });

    test("simple match with auth allow", async () => {
        const typeDefs = gql`
            type Movie
                @fulltext(indexes: [{ name: "MovieTitle", fields: ["title"] }])
                @authorization(validate: [{ when: [BEFORE], where: { node: { director: { id: "$jwt.sub" } } } }]) {
                title: String
                director: [Person!]! @relationship(type: "DIRECTED", direction: IN)
            }

            type Person {
                id: ID
            }
        `;

        const secret = "shh-its-a-secret";

        const sub = "my-sub";

        const neoSchema = new Neo4jGraphQL({
            typeDefs,
            features: { authorization: { key: secret } },
        });

        const query = gql`
            query {
                movies(fulltext: { MovieTitle: { phrase: "something AND something" } }) {
                    title
                }
            }
        `;

        const token = createBearerToken(secret, { sub });

        const result = await translateQuery(neoSchema, query, { token });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CALL db.index.fulltext.queryNodes(\\"MovieTitle\\", $param0) YIELD node AS this
            WITH *
            WHERE (\\"Movie\\" IN labels(this) AND apoc.util.validatePredicate(NOT ($isAuthenticated = true AND EXISTS {
                MATCH (this)<-[:DIRECTED]-(this0:\`Person\`)
                WHERE this0.id = coalesce($jwt.sub, $jwtDefault)
            }), \\"@neo4j/graphql/FORBIDDEN\\", [0]))
            RETURN this { .title } AS this"
        `);

        expect(result.params).toMatchInlineSnapshot(`
            Object {
              "isAuthenticated": true,
              "jwt": Object {
                "roles": Array [],
                "sub": "my-sub",
              },
              "jwtDefault": Object {},
              "param0": "something AND something",
            }
        `);
    });
});
