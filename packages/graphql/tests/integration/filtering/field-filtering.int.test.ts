/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { gql } from "graphql-tag";
import { generate } from "randomstring";
import { TestHelper } from "../../utils/tests-helper";

describe("field-filtering", () => {
    const testHelper = new TestHelper();

    afterAll(async () => {
        await testHelper.close();
    });

    test("should use connection filter on field", async () => {
        const Movie = testHelper.createUniqueType("Movie");
        const Series = testHelper.createUniqueType("Series");
        const Genre = testHelper.createUniqueType("Genre");

        const typeDefs = gql`
            type ${Movie} @node {
                title: String!
                genres: [${Genre}!]! @relationship(type: "IN_GENRE", direction: OUT)
            }

            type ${Genre} @node {
                name: String!
                series: [${Series}!]! @relationship(type: "IN_SERIES", direction: OUT)
            }

            type ${Series} @node {
                name: String!
            }
        `;

        await testHelper.initNeo4jGraphQL({ typeDefs });

        const movieTitle = generate({
            charset: "alphabetic",
        });

        const genreName1 = generate({
            charset: "alphabetic",
        });
        const genreName2 = generate({
            charset: "alphabetic",
        });

        const seriesName = generate({
            charset: "alphabetic",
        });

        const query = `
            {
                ${Movie.plural}(where: { title_EQ: "${movieTitle}" }) {
                    title
                    genres(where: { seriesConnection_SOME: { node: { name_EQ: "${seriesName}" } } }) {
                        name
                        series {
                            name
                        }
                    }
                }
            }
        `;

        const cypher = `
            CREATE (m:${Movie} {title:$movieTitle})-[:IN_GENRE]->(:${Genre} {name:$genreName1})-[:IN_SERIES]->(:${Series} {name:$seriesName})
            CREATE (m)-[:IN_GENRE]->(:${Genre} {name:$genreName2})
        `;

        await testHelper.executeCypher(cypher, { movieTitle, genreName1, seriesName, genreName2 });

        const gqlResult = await testHelper.executeGraphQL(query);

        if (gqlResult.errors) {
            console.log(JSON.stringify(gqlResult.errors, null, 2));
        }

        expect(gqlResult.errors).toBeUndefined();

        expect((gqlResult.data as any)[Movie.plural]).toEqual([
            { title: movieTitle, genres: [{ name: genreName1, series: [{ name: seriesName }] }] },
        ]);
    });
});
