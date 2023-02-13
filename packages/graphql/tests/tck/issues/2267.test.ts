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
import type { DocumentNode } from "graphql";
import { Neo4jGraphQL } from "../../../src";
import { formatCypher, translateQuery, formatParams } from "../utils/tck-test-utils";

describe("https://github.com/neo4j/graphql/issues/2267", () => {
    let typeDefs: DocumentNode;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = gql`
            type Place {
                displayName: String!
                activity: [Publication!]! @relationship(type: "ACTIVITY", direction: IN)
            }

            interface Publication {
                name: String
                activity: [Place!]! @relationship(type: "ACTIVITY", direction: OUT)
            }

            type Post implements Publication {
                name: String
                activity: [Place!]!
            }

            type Story implements Publication {
                name: String
                activity: [Place!]!
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
        });
    });

    test("sort should be correct when querying interface relationship field", async () => {
        const query = gql`
            query {
                places(options: { sort: { displayName: ASC } }) {
                    displayName
                    activity {
                        name
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:\`Place\`)
            WITH *
            ORDER BY this.displayName ASC
            CALL {
                WITH this
                CALL {
                    WITH *
                    MATCH (this)<-[this0:ACTIVITY]-(this_activity:\`Post\`)
                    WITH this_activity { __resolveType: \\"Post\\",  .name } AS this_activity
                    RETURN this_activity AS this_activity
                    UNION
                    WITH *
                    MATCH (this)<-[this1:ACTIVITY]-(this_activity:\`Story\`)
                    WITH this_activity { __resolveType: \\"Story\\",  .name } AS this_activity
                    RETURN this_activity AS this_activity
                }
                WITH this_activity
                RETURN collect(this_activity) AS this_activity
            }
            RETURN this { .displayName, activity: this_activity } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
    });
});
