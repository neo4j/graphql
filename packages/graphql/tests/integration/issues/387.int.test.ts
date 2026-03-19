/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
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

        type ${Place} @node {
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
                ${Place.plural}(where: { name_EQ: "${name}" }) {
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
