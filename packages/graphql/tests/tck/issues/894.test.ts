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

describe("https://github.com/neo4j/graphql/issues/894", () => {
    let typeDefs: string;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = /* GraphQL */ `
            type User @node {
                id: ID! @id @alias(property: "_id")
                name: String!
                activeOrganization: [Organization!]! @relationship(type: "ACTIVELY_MANAGING", direction: OUT)
            }

            type Organization @node {
                id: ID! @id @alias(property: "_id")
                name: String!
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
        });
    });

    test("Disconnect and connect", async () => {
        const query = /* GraphQL */ `
            mutation SwapSides {
                updateUsers(
                    where: { name: { eq: "Luke Skywalker" } }
                    update: {
                        activeOrganization: {
                            connect: { where: { node: { id: { eq: "test-id" } } } }
                            disconnect: { where: { node: { NOT: { id: { eq: "test-id" } } } } }
                        }
                    }
                ) {
                    users {
                        id
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            MATCH (this:User)
            WITH *
            WHERE this.name = $param0
            WITH *
            CALL (*) {
                CALL (this) {
                    MATCH (this0:Organization)
                    WHERE this0._id = $param1
                    CREATE (this)-[this1:ACTIVELY_MANAGING]->(this0)
                }
            }
            WITH *
            CALL (*) {
                CALL (this) {
                    OPTIONAL MATCH (this)-[this2:ACTIVELY_MANAGING]->(this3:Organization)
                    WHERE NOT (this3._id = $param2)
                    WITH *
                    DELETE this2
                }
            }
            WITH this
            RETURN this { id: this._id } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"Luke Skywalker\\",
                \\"param1\\": \\"test-id\\",
                \\"param2\\": \\"test-id\\"
            }"
        `);
    });
});
