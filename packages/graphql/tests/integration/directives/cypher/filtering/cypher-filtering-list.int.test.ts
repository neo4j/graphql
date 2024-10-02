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

import type { UniqueType } from "../../../../utils/graphql-types";
import { TestHelper } from "../../../../utils/tests-helper";

describe("cypher directive filtering", () => {
    let CustomType: UniqueType;

    const testHelper = new TestHelper();

    afterEach(async () => {
        await testHelper.close();
    });

    beforeEach(() => {
        CustomType = testHelper.createUniqueType("CustomType");
    });

    test.each([
        {
            title: "String List cypher field: INCLUDES",
            filter: `custom_cypher_list_INCLUDES: "a"`,
            type: "String",
            cypherStatement: "RETURN ['a', 'b', 'c'] as list",
        },
        {
            title: "Int List cypher field: INCLUDES",
            filter: `custom_cypher_list_INCLUDES: 2`,
            type: "Int",
            cypherStatement: "RETURN [1,2,3,4,5] as list",
        },
        {
            title: "Float List cypher field: INCLUDES",
            filter: `custom_cypher_list_INCLUDES: 2.0`,
            type: "Float",
            cypherStatement: "RETURN [1.0,2.0,3.0,4.0,5.0] as list",
        },
        {
            title: "Point List cypher field: INCLUDES",
            filter: `custom_cypher_list_INCLUDES: { latitude: 1, longitude: 2 }`,
            type: "Point",
            cypherStatement:
                "RETURN [point({ latitude: 1, longitude: 2 }), point({ latitude: 3, longitude: 4 })] as list",
        },
        {
            title: "CartesianPoint List cypher field: INCLUDES",
            filter: `custom_cypher_list_INCLUDES: { x: 1, y: 2, z: 3 }`,
            type: "CartesianPoint",
            cypherStatement: "RETURN [point({ x: 1, y: 2, z: 3 }), point({ x: 3, y: 4, z: 5 })] as list",
        },
        {
            title: "DateTime List cypher field: INCLUDES",
            filter: `custom_cypher_list_INCLUDES: "2021-01-01T00:00:00Z"`,
            type: "DateTime",
            cypherStatement: "RETURN [datetime('2021-01-01T00:00:00Z'), datetime('2021-01-02T00:00:00Z')] as list",
        },
        {
            title: "LocalDateTime List cypher field: INCLUDES",
            filter: `custom_cypher_list_INCLUDES: "2021-01-01T00:00:00"`,
            type: "LocalDateTime",
            cypherStatement:
                "RETURN [localdatetime('2021-01-01T00:00:00'), localdatetime('2021-01-02T00:00:00')] as list",
        },
        {
            title: "Date List cypher field: INCLUDES",
            filter: `custom_cypher_list_INCLUDES: "2021-01-01"`,
            type: "Date",
            cypherStatement: "RETURN [date('2021-01-01'), date('2021-01-02')] as list",
        },
        {
            title: "Time List cypher field: INCLUDES",
            filter: `custom_cypher_list_INCLUDES: "12:00:00"`,
            type: "Time",
            cypherStatement: "RETURN [time('12:00:00'), time('13:00:00')] as list",
        },
        {
            title: "LocalTime List cypher field: INCLUDES",
            filter: `custom_cypher_list_INCLUDES: "12:00:00"`,
            type: "LocalTime",
            cypherStatement: "RETURN [localtime('12:00:00'), localtime('13:00:00')] as list",
        },
    ] as const)("$title", async ({ filter, type, cypherStatement }) => {
        const typeDefs = `
            type ${CustomType} @node {
                title: String
                custom_cypher_list: [${type}] @cypher(statement: "${cypherStatement}", columnName: "list")
            }
        `;

        await testHelper.initNeo4jGraphQL({ typeDefs });
        await testHelper.executeCypher(`CREATE (m:${CustomType} { title: "test" })`, {});

        const query = `
            query {
                ${CustomType.plural}(where: { ${filter} }) {
                    title
                }
            }
        `;

        const gqlResult = await testHelper.executeGraphQL(query);

        expect(gqlResult.errors).toBeFalsy();
        expect(gqlResult?.data).toEqual({
            [CustomType.plural]: [
                {
                    title: "test",
                },
            ],
        });
    });
});
