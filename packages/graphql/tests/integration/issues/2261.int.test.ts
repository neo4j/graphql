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

import type { UniqueType } from "../../utils/graphql-types";
import { TestHelper } from "../../utils/tests-helper";

describe("https://github.com/neo4j/graphql/issues/2261", () => {
    const testHelper = new TestHelper();

    let ProgrammeItem: UniqueType;
    let Edition: UniqueType;

    beforeEach(async () => {
        ProgrammeItem = testHelper.createUniqueType("ProgrammeItem");
        Edition = testHelper.createUniqueType("Edition");

        const typeDefs = `
            interface Product {
                id: ID!
                uri: String!
            }

            type ${ProgrammeItem} implements Product {
                id: ID! @id @unique
                uri: String! @cypher(statement: "RETURN 'example://programme-item/' + this.id as x", columnName: "x")
                editions: [${Edition}!]! @relationship(type: "HAS_EDITION", direction: OUT)
            }

            type ${Edition} {
                id: ID! @id @unique
                uri: String! @cypher(statement: "RETURN 'example://edition/' + this.id as x", columnName: "x")
                product: Product! @relationship(type: "HAS_EDITION", direction: IN)
            }
        `;

        await testHelper.initNeo4jGraphQL({
            typeDefs,
            features: {
                subscriptions: true,
            },
        });
    });

    afterEach(async () => {
        await testHelper.close();
    });

    test("nested query with top level @cypher directive with subscriptions should return valid Cypher", async () => {
        await testHelper.executeCypher(
            `CREATE (e:${Edition} {id: "ed-id"})<-[:HAS_EDITION]-(p:${ProgrammeItem} {id: "p-id"})`
        );

        const query = `
            query {
                ${Edition.plural} {
                    id
                    uri
                    product {
                        __typename
                    }
                }
            }
        `;

        const result = await testHelper.executeGraphQL(query);

        expect(result.errors).toBeFalsy();
        expect(result.data).toEqual({
            [Edition.plural]: [
                {
                    id: "ed-id",
                    uri: "example://edition/ed-id",
                    product: {
                        __typename: ProgrammeItem.name,
                    },
                },
            ],
        });
    });
});
