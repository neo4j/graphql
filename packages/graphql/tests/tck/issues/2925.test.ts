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

import { gql } from "apollo-server";
import { Neo4jGraphQL } from "../../../src";
import { formatCypher, translateQuery, formatParams } from "../utils/tck-test-utils";

describe("https://github.com/neo4j/graphql/issues/2925", () => {
    let neoSchema: Neo4jGraphQL;

    const typeDefs = gql`
        type Group {
            name: String
            hasGroupUser: [User!]! @relationship(type: "HAS_GROUP", direction: IN)
            hasRequiredGroupUser: [User!]! @relationship(type: "HAS_REQUIRED_GROUP", direction: IN)
        }

        type User {
            name: String
            hasGroup: Group @relationship(type: "HAS_GROUP", direction: OUT)
            hasRequiredGroup: Group! @relationship(type: "HAS_REQUIRED_GROUP", direction: OUT)
        }
    `;

    beforeAll(() => {
        neoSchema = new Neo4jGraphQL({
            typeDefs,
        });
    });

    test("should query relationship", async () => {
        const query = gql`
            query Query {
                users(where: { hasGroup: { name_IN: ["Group A"] } }) {
                    name
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:\`User\`)
            OPTIONAL MATCH (this)-[:HAS_GROUP]->(this0:\`Group\`)
            WHERE this0.name IN $param0
            RETURN this { .name } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": [
                    \\"Group A\\"
                ]
            }"
        `);
    });

    test("should query required relationship", async () => {
        const query = gql`
            query Query {
                users(where: { hasRequiredGroup: { name_IN: ["Group A"] } }) {
                    name
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:\`User\`)
            MATCH (this)-[:HAS_REQUIRED_GROUP]->(this0:\`Group\`)
            WHERE this0.name IN $param0
            RETURN this { .name } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": [
                    \\"Group A\\"
                ]
            }"
        `);
    });

    test("should query nested relationship", async () => {
        const query = gql`
            query Query {
                groups(where: { hasGroupUser: { hasGroup: { name_IN: ["Group A"] } } }) {
                    name
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:\`Group\`)
            CALL {
                WITH this
                MATCH (this)<-[:HAS_GROUP]-(this0:\`User\`)
                OPTIONAL MATCH (this0)-[:HAS_GROUP]->(this1:\`Group\`)
                WITH *
                WHERE this1.name IN $param0
                RETURN count(this0) > 0 AS var2
            }
            WITH *
            WHERE var2 = true
            RETURN this { .name } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": [
                    \\"Group A\\"
                ]
            }"
        `);
    });

    test("should query nested required relationship", async () => {
        const query = gql`
            query Query {
                groups(where: { hasGroupUser: { hasRequiredGroup: { name_IN: ["Group A"] } } }) {
                    name
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:\`Group\`)
            CALL {
                WITH this
                MATCH (this)<-[:HAS_GROUP]-(this0:\`User\`)
                MATCH (this0)-[:HAS_REQUIRED_GROUP]->(this1:\`Group\`)
                WITH *
                WHERE this1.name IN $param0
                RETURN count(this0) > 0 AS var2
            }
            WITH *
            WHERE var2 = true
            RETURN this { .name } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": [
                    \\"Group A\\"
                ]
            }"
        `);
    });
});
