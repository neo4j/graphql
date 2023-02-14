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

describe("https://github.com/neo4j/graphql/issues/847", () => {
    test("should be able to query multiple interface relations", async () => {
        const typeDefs = gql`
            interface Entity {
                id: String!
            }

            type Person implements Entity {
                id: String! @unique
                name: String!
            }

            type Place implements Entity {
                id: String! @unique
                location: Point!
            }

            type Interaction {
                id: ID! @id
                kind: String!
                subjects: [Entity!]! @relationship(type: "ACTED_IN", direction: IN)
                objects: [Entity!]! @relationship(type: "ACTED_IN", direction: OUT)
            }
        `;

        const neoSchema = new Neo4jGraphQL({
            typeDefs,
            config: { enableRegex: true },
        });

        const query = gql`
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
            "MATCH (this:\`Interaction\`)
            WITH *
            CALL {
            WITH *
            CALL {
                WITH this
                MATCH (this)<-[this0:ACTED_IN]-(this_Person:\`Person\`)
                RETURN { __resolveType: \\"Person\\", __id: id(this_Person), id: this_Person.id } AS this_subjects
                UNION
                WITH this
                MATCH (this)<-[this1:ACTED_IN]-(this_Place:\`Place\`)
                RETURN { __resolveType: \\"Place\\", __id: id(this_Place), id: this_Place.id } AS this_subjects
            }
            RETURN collect(this_subjects) AS this_subjects
            }
            WITH *
            CALL {
            WITH *
            CALL {
                WITH this
                MATCH (this)-[this2:ACTED_IN]->(this_Person:\`Person\`)
                RETURN { __resolveType: \\"Person\\", __id: id(this_Person), id: this_Person.id } AS this_objects
                UNION
                WITH this
                MATCH (this)-[this3:ACTED_IN]->(this_Place:\`Place\`)
                RETURN { __resolveType: \\"Place\\", __id: id(this_Place), id: this_Place.id } AS this_objects
            }
            RETURN collect(this_objects) AS this_objects
            }
            RETURN this { .id, subjects: this_subjects, objects: this_objects } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
    });
});
