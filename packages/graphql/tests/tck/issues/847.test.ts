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

describe("https://github.com/neo4j/graphql/issues/847", () => {
    test("should be able to query multiple interface relations", async () => {
        const typeDefs = /* GraphQL */ `
            interface Entity {
                id: String!
            }

            type Person implements Entity @node {
                id: String! @unique
                name: String!
            }

            type Place implements Entity @node {
                id: String! @unique
                location: Point!
            }

            type Interaction @node {
                id: ID! @id @unique
                kind: String!
                subjects: [Entity!]! @relationship(type: "ACTED_IN", direction: IN)
                objects: [Entity!]! @relationship(type: "ACTED_IN", direction: OUT)
            }
        `;

        const neoSchema = new Neo4jGraphQL({
            typeDefs,
        });

        const query = /* GraphQL */ `
            query {
                interactions {
                    id
                    subjects {
                        id
                    }
                    objects {
                        id
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query, {});

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Interaction)
            CALL {
                WITH this
                CALL {
                    WITH *
                    MATCH (this)<-[this0:ACTED_IN]-(this1:Person)
                    WITH this1 { .id, __resolveType: \\"Person\\", __id: id(this1) } AS this1
                    RETURN this1 AS var2
                    UNION
                    WITH *
                    MATCH (this)<-[this3:ACTED_IN]-(this4:Place)
                    WITH this4 { .id, __resolveType: \\"Place\\", __id: id(this4) } AS this4
                    RETURN this4 AS var2
                }
                WITH var2
                RETURN collect(var2) AS var2
            }
            CALL {
                WITH this
                CALL {
                    WITH *
                    MATCH (this)-[this5:ACTED_IN]->(this6:Person)
                    WITH this6 { .id, __resolveType: \\"Person\\", __id: id(this6) } AS this6
                    RETURN this6 AS var7
                    UNION
                    WITH *
                    MATCH (this)-[this8:ACTED_IN]->(this9:Place)
                    WITH this9 { .id, __resolveType: \\"Place\\", __id: id(this9) } AS this9
                    RETURN this9 AS var7
                }
                WITH var7
                RETURN collect(var7) AS var7
            }
            RETURN this { .id, subjects: var2, objects: var7 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
    });
});
