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

describe("cypher directive filtering - List", () => {
    const testHelper = new TestHelper();
    let CustomType: UniqueType;

    beforeEach(() => {
        CustomType = testHelper.createUniqueType("CustomType");
    });

    afterEach(async () => {
        await testHelper.close();
    });

    test("String List cypher field: INCLUDES", async () => {
        const typeDefs = /* GraphQL */ `
            type ${CustomType} @node {
                title: String
                custom_cypher_list: [String] @cypher(statement: 
                    """
                    MATCH (this)
                    RETURN this.custom_data as list
                    """
                    , columnName: "list")
            }
        `;

        await testHelper.initNeo4jGraphQL({ typeDefs });
        await testHelper.executeCypher(`
            CREATE (:${CustomType} { title: "test", custom_data: ['a', 'b', 'c'] })
            CREATE (:${CustomType} { title: "test2", custom_data: ['d', 'e', 'f'] })
        `);

        const query = /* GraphQL */ `
            query {
                ${CustomType.plural}(where: { custom_cypher_list_INCLUDES: "a" }) {
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

    test("Int List cypher field: INCLUDES", async () => {
        const typeDefs = /* GraphQL */ `
            type ${CustomType} @node {
                title: String
                custom_cypher_list: [Int] @cypher(statement: 
                    """
                    MATCH (this)
                    RETURN this.custom_data as list
                    """
                    , columnName: "list")
            }
        `;

        await testHelper.initNeo4jGraphQL({ typeDefs });
        await testHelper.executeCypher(`
            CREATE (:${CustomType} { title: "test", custom_data: [1, 2, 3] })
            CREATE (:${CustomType} { title: "test2", custom_data: [4, 5, 6] })
        `);

        const query = /* GraphQL */ `
            query {
                ${CustomType.plural}(where: { custom_cypher_list_INCLUDES: 2 }) {
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

    test("Float List cypher field: INCLUDES", async () => {
        const typeDefs = /* GraphQL */ `
            type ${CustomType} @node {
                title: String
                custom_cypher_list: [Float] @cypher(statement: 
                    """
                    MATCH (this)
                    RETURN this.custom_data as list
                    """
                    , columnName: "list")
            }
        `;

        await testHelper.initNeo4jGraphQL({ typeDefs });
        await testHelper.executeCypher(`
            CREATE (:${CustomType} { title: "test", custom_data: [10.0, 20.0, 30.0] })
            CREATE (:${CustomType} { title: "test2", custom_data: [40.0, 50.0, 60.0] })
        `);

        const query = /* GraphQL */ `
            query {
                ${CustomType.plural}(where: { custom_cypher_list_INCLUDES: 20.0 }) {
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

    test("Point List cypher field: INCLUDES", async () => {
        const typeDefs = /* GraphQL */ `
            type ${CustomType} @node {
                title: String
                custom_cypher_list: [Point] @cypher(statement: 
                    """
                    MATCH (this)
                    RETURN this.custom_data as list
                    """
                    , columnName: "list")
            }
        `;

        await testHelper.initNeo4jGraphQL({ typeDefs });
        await testHelper.executeCypher(`
            CREATE (:${CustomType} { title: "test", custom_data: [point({ latitude: 1, longitude: 2 }), point({ latitude: 3, longitude: 4 })] })
            CREATE (:${CustomType} { title: "test2", custom_data: [point({ latitude: 5, longitude: 6 }), point({ latitude: 7, longitude: 8 })] })
        `);

        const query = /* GraphQL */ `
            query {
                ${CustomType.plural}(where: { custom_cypher_list_INCLUDES: { latitude: 1, longitude: 2 } }) {
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

    test("CartesianPoint List cypher field: INCLUDES", async () => {
        const typeDefs = /* GraphQL */ `
            type ${CustomType} @node {
                title: String
                custom_cypher_list: [CartesianPoint] @cypher(statement: 
                    """
                    MATCH (this)
                    RETURN this.custom_data as list
                    """
                    , columnName: "list")
            }
        `;

        await testHelper.initNeo4jGraphQL({ typeDefs });
        await testHelper.executeCypher(`
            CREATE (:${CustomType} { title: "test", custom_data: [point({ x: 1, y: 2, z: 3 }), point({ x: 3, y: 4, z: 5 })] })
            CREATE (:${CustomType} { title: "test2", custom_data: [point({ x: 5, y: 6, z: 7 }), point({ x: 7, y: 8, z: 9 })] })
        `);

        const query = /* GraphQL */ `
            query {
                ${CustomType.plural}(where: { custom_cypher_list_INCLUDES: { x: 1, y: 2, z: 3 } }) {
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

    test("DateTime List cypher field: INCLUDES", async () => {
        const typeDefs = /* GraphQL */ `
            type ${CustomType} @node {
                title: String
                custom_cypher_list: [DateTime] @cypher(statement: 
                    """
                    MATCH (this)
                    RETURN this.custom_data as list
                    """
                    , columnName: "list")
            }
        `;

        await testHelper.initNeo4jGraphQL({ typeDefs });
        await testHelper.executeCypher(`
            CREATE (:${CustomType} { title: "test", custom_data: [datetime('2021-01-01T00:00:00Z'), datetime('2021-02-01T00:00:00Z')] })
            CREATE (:${CustomType} { title: "test2", custom_data: [datetime('2021-03-01T00:00:00Z'), datetime('2021-04-01T00:00:00Z')] })
        `);

        const query = /* GraphQL */ `
            query {
                ${CustomType.plural}(where: { custom_cypher_list_INCLUDES: "2021-01-01T00:00:00Z" }) {
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

    test("LocalDateTime List cypher field: INCLUDES", async () => {
        const typeDefs = /* GraphQL */ `
            type ${CustomType} @node {
                title: String
                custom_cypher_list: [LocalDateTime] @cypher(statement: 
                    """
                    MATCH (this)
                    RETURN this.custom_data as list
                    """
                    , columnName: "list")
            }
        `;

        await testHelper.initNeo4jGraphQL({ typeDefs });
        await testHelper.executeCypher(`
            CREATE (:${CustomType} { title: "test", custom_data: [localdatetime('2021-01-01T00:00:00'), localdatetime('2021-02-01T00:00:00')] })
            CREATE (:${CustomType} { title: "test2", custom_data: [localdatetime('2021-03-01T00:00:00'), localdatetime('2021-04-01T00:00:00')] })
        `);

        const query = /* GraphQL */ `
        query {
            ${CustomType.plural}(where: { custom_cypher_list_INCLUDES: "2021-01-01T00:00:00" }) {
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

    test("Date List cypher field: INCLUDES", async () => {
        const typeDefs = /* GraphQL */ `
            type ${CustomType} @node {
                title: String
                custom_cypher_list: [Date] @cypher(statement: 
                    """
                    MATCH (this)
                    RETURN this.custom_data as list
                    """
                    , columnName: "list")
            }
        `;

        await testHelper.initNeo4jGraphQL({ typeDefs });
        await testHelper.executeCypher(`
            CREATE (:${CustomType} { title: "test", custom_data: [date('2021-01-01'), date('2021-02-01')] })
            CREATE (:${CustomType} { title: "test2", custom_data: [date('2021-03-01'), date('2021-04-01')] })
        `);

        const query = /* GraphQL */ `
            query {
                ${CustomType.plural}(where: { custom_cypher_list_INCLUDES: "2021-01-01" }) {
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

    test("Time List cypher field: INCLUDES", async () => {
        const typeDefs = /* GraphQL */ `
            type ${CustomType} @node {
                title: String
                custom_cypher_list: [Time] @cypher(statement: 
                    """
                    MATCH (this)
                    RETURN this.custom_data as list
                    """
                    , columnName: "list")
            }
        `;

        await testHelper.initNeo4jGraphQL({ typeDefs });
        await testHelper.executeCypher(`
            CREATE (:${CustomType} { title: "test", custom_data: [time('12:00:00'), time('13:00:00')] })
            CREATE (:${CustomType} { title: "test2", custom_data: [time('14:00:00'), time('15:00:00')] })
        `);

        const query = /* GraphQL */ `
            query {
                ${CustomType.plural}(where: { custom_cypher_list_INCLUDES: "12:00:00" }) {
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

    test("LocalTime List cypher field: INCLUDES", async () => {
        const typeDefs = /* GraphQL */ `
            type ${CustomType} @node {
                title: String
                custom_cypher_list: [LocalTime] @cypher(statement: 
                    """
                    MATCH (this)
                    RETURN this.custom_data as list
                    """
                    , columnName: "list")
            }
        `;

        await testHelper.initNeo4jGraphQL({ typeDefs });
        await testHelper.executeCypher(`
            CREATE (:${CustomType} { title: "test", custom_data: [localtime('12:00:00'), localtime('13:00:00')] })
            CREATE (:${CustomType} { title: "test2", custom_data: [localtime('14:00:00'), localtime('15:00:00')] })
        `);

        const query = /* GraphQL */ `
            query {
                ${CustomType.plural}(where: { custom_cypher_list_INCLUDES: "12:00:00" }) {
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
