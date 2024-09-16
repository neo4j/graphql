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

import type { DocumentNode } from "graphql";
import { gql } from "graphql-tag";
import { generate } from "randomstring";
import type { UniqueType } from "../../utils/graphql-types";
import { TestHelper } from "../../utils/tests-helper";

describe("https://github.com/neo4j/graphql/issues/387", () => {
    const testHelper = new TestHelper();
    let name: string;
    let url: string;
    let typeDefs: DocumentNode;
    let Place: UniqueType;

    beforeEach(async () => {
        Place = testHelper.createUniqueType("Place");

        name = generate({
            charset: "alphabetic",
        });
        url = generate({
            charset: "alphabetic",
        });
        typeDefs = gql`
        scalar URL

        type ${Place} {
            name: String
            url: URL
                @cypher(
                    statement: """
                    return '${url}' as res
                    """,
                    columnName: "res"
                )
            url_array: [URL]
                @cypher(
                    statement: """
                    return ['${url}', '${url}'] as res
                    """,
                    columnName: "res"
                )
        }


        type Query {
                url: URL
                    @cypher(
                        statement: """
                        return '${url}' as x
                        """,
                        columnName: "x"
                    )
                url_array: [URL]
                    @cypher(
                        statement: """
                        return ['${url}', '${url}'] as x
                        """,
                        columnName: "x"
                    )
            }
    `;

        await testHelper.executeCypher(`CREATE (:${Place.name} { name: "${name}" })`);
    });

    afterEach(async () => {
        await testHelper.close();
    });

    test("should return custom scalars from custom Cypher fields", async () => {
        await testHelper.initNeo4jGraphQL({ typeDefs });

        const query = `
            {
                ${Place.plural}(where: { name: "${name}" }) {
                    name
                    url
                    url_array
                }
            }
        `;

        const result = await testHelper.executeGraphQL(query);

        expect(result.errors).toBeFalsy();

        expect(result.data as any).toEqual({
            [Place.plural]: [
                {
                    name,
                    url,
                    url_array: [url, url],
                },
            ],
        });
    });

    test("should return custom scalars from root custom Cypher fields", async () => {
        await testHelper.initNeo4jGraphQL({ typeDefs });

        const query = `
            {
                url
                url_array
            }
        `;

        const result = await testHelper.executeGraphQL(query);

        expect(result.errors).toBeFalsy();

        expect(result.data as any).toEqual({
            url,
            url_array: [url, url],
        });
    });
});
