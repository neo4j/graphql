/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { generate } from "randomstring";
import type { UniqueType } from "../../utils/graphql-types";
import { TestHelper } from "../../utils/tests-helper";

describe("https://github.com/neo4j/graphql/issues/433", () => {
    const testHelper = new TestHelper();
    let Movie: UniqueType;
    let Person: UniqueType;
    let typeDefs: string;

    beforeAll(() => {
        Movie = testHelper.createUniqueType("Movie");
        Person = testHelper.createUniqueType("Person");
    });

    afterAll(async () => {
        await testHelper.close();
    });

    test("should recreate issue and return correct data", async () => {
        typeDefs = `
            # Cannot use 'type Node'
            type ${Movie} @node {
                title: String
                actors: [${Person}!]! @relationship(type: "ACTED_IN", direction: IN)
            }

            type ${Person} @node {
                name: String
            }
        `;

        const movieTitle = generate({
            charset: "alphabetic",
        });

        const personName = generate({
            charset: "alphabetic",
        });

        await testHelper.initNeo4jGraphQL({ typeDefs });

        const query = `
            query {
               ${Movie.plural}(where: {title_EQ: "${movieTitle}"}) {
                    title
                    actorsConnection(where: {}) {
                      edges {
                        node {
                          name
                        }
                      }
                    }
                }
            }
        `;

        await testHelper.executeCypher(
            `
                    CREATE (:${Movie} {title: $movieTitle})<-[:ACTED_IN]-(:${Person} {name: $personName})
                `,
            { movieTitle, personName }
        );

        const result = await testHelper.executeGraphQL(query);

        expect(result.errors).toBeFalsy();

        expect(result.data as any).toEqual({
            [Movie.plural]: [
                {
                    title: movieTitle,
                    actorsConnection: {
                        edges: [{ node: { name: personName } }],
                    },
                },
            ],
        });
    });
});
