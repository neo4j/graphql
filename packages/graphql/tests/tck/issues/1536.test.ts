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
import { formatCypher, formatParams, translateQuery } from "../utils/tck-test-utils";

describe("https://github.com/neo4j/graphql/issues/1536", () => {
    let typeDefs: string;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = /* GraphQL */ `
            type SomeNode {
                id: ID! @id @unique
                other: OtherNode! @relationship(type: "HAS_OTHER_NODES", direction: OUT)
            }

            type OtherNode {
                id: ID! @id @unique
                interfaceField: MyInterface! @relationship(type: "HAS_INTERFACE_NODES", direction: OUT)
            }

            interface MyInterface {
                id: ID!
            }

            type MyImplementation implements MyInterface {
                id: ID! @id @unique
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
        });
    });

    test("query nested interfaces", async () => {
        const query = /* GraphQL */ `
            query {
                someNodes {
                    id
                    other {
                        interfaceField {
                            id
                        }
                    }
                }
            }
        `;
        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:SomeNode)
            CALL {
                WITH this
                MATCH (this)-[this0:HAS_OTHER_NODES]->(this1:OtherNode)
                CALL {
                    WITH this1
                    CALL {
                        WITH *
                        MATCH (this1)-[this2:HAS_INTERFACE_NODES]->(this3:MyImplementation)
                        WITH this3 { .id, __resolveType: \\"MyImplementation\\", __id: id(this3) } AS this3
                        RETURN this3 AS var4
                    }
                    WITH var4
                    RETURN head(collect(var4)) AS var4
                }
                WITH this1 { interfaceField: var4 } AS this1
                RETURN head(collect(this1)) AS var5
            }
            RETURN this { .id, other: var5 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
    });
});
