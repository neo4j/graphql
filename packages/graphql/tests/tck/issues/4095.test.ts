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

import { Neo4jGraphQL } from "../../../src";
import { createBearerToken } from "../../utils/create-bearer-token";
import { formatCypher, formatParams, translateQuery } from "../utils/tck-test-utils";

describe("https://github.com/neo4j/graphql/issues/4095", () => {
    const secret = "sssh!";
    let typeDefs: string;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = /* GraphQL */ `
            type User @node {
                id: ID! @unique
            }

            type Family @node {
                id: ID! @id @unique
                members: [Person!]! @relationship(type: "MEMBER_OF", direction: IN)
                creator: User! @relationship(type: "CREATOR_OF", direction: IN)
            }

            type Person @authorization(filter: [{ where: { node: { creator: { id: "$jwt.uid" } } } }]) @node {
                id: ID! @id @unique
                creator: User! @relationship(type: "CREATOR_OF", direction: IN, nestedOperations: [CONNECT])
                family: Family! @relationship(type: "MEMBER_OF", direction: OUT)
            }
            extend schema @authentication
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
            features: {
                authorization: {
                    key: secret,
                },
            },
        });
    });

    test("query with nested aggregate count", async () => {
        const query = /* GraphQL */ `
            query Family {
                families {
                    id
                    membersAggregate {
                        count
                    }
                }
            }
        `;
        const token = createBearerToken(secret, { sub: "michel", roles: ["admin"] });
        const result = await translateQuery(neoSchema, query, { token });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Family)
            CALL {
                WITH this
                MATCH (this)<-[this0:MEMBER_OF]-(this1:Person)
                OPTIONAL MATCH (this1)<-[:CREATOR_OF]-(this2:User)
                WITH *, count(this2) AS creatorCount
                WITH *
                WHERE ($isAuthenticated = true AND (creatorCount <> 0 AND ($jwt.uid IS NOT NULL AND this2.id = $jwt.uid)))
                RETURN count(this1) AS var3
            }
            RETURN this { .id, membersAggregate: { count: var3 } } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"isAuthenticated\\": true,
                \\"jwt\\": {
                    \\"roles\\": [
                        \\"admin\\"
                    ],
                    \\"sub\\": \\"michel\\"
                }
            }"
        `);
    });
});
