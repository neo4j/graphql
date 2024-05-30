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

import gql from "graphql-tag";
import { Neo4jGraphQL } from "../../../src";
import { formatCypher, formatParams, translateQuery } from "../utils/tck-test-utils";

describe("https://github.com/neo4j/graphql/issues/4667", () => {
    test("when passed null as an argument of a relationship filter should check that a relationship does not exist", async () => {
        const typeDefs = /* GraphQL */ `
            type MyThing {
                id: ID! @id
                stuff: MyStuff @relationship(type: "THE_STUFF", direction: OUT)
            }

            type MyStuff {
                id: ID! @id
                thing: MyThing @relationship(type: "THE_STUFF", direction: IN)
            }
        `;

        const neoSchema = new Neo4jGraphQL({ typeDefs });

        const query = /* GraphQL */ gql`
            query {
                myThings(where: { stuff: null }) {
                    id
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:MyThing)
            WHERE NOT (EXISTS {
                MATCH (this)-[:THE_STUFF]->(this0:MyStuff)
            })
            RETURN this { .id } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
    });
});
