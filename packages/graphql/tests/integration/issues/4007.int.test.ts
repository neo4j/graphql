/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { gql } from "graphql-tag";
import { generate } from "randomstring";
import type { UniqueType } from "../../utils/graphql-types";
import { TestHelper } from "../../utils/tests-helper";

describe("https://github.com/neo4j/graphql/issues/4007", () => {
    const testHelper = new TestHelper();

    let typeMovie: UniqueType;
    let typeActor: UniqueType;

    beforeAll(() => {
        typeMovie = testHelper.createUniqueType("Movie");
        typeActor = testHelper.createUniqueType("Actor");
    });

    afterAll(async () => {
        await testHelper.close();
    });

    test("should return name from aliased selection", async () => {
        const typeDefs = gql`
            type ${typeMovie.name} @node {
                title: String!
                actors: [${typeActor.name}!]! @relationship(type: "ACTED_IN", direction: IN)
            }

            type ${typeActor.name} @node {
                name: String!
                movies: [${typeMovie.name}!]! @relationship(type: "ACTED_IN", direction: OUT)
            }
        `;

        await testHelper.initNeo4jGraphQL({ typeDefs });

        const movieTitle = generate({
            charset: "alphabetic",
        });

        const query = `
            {
                m:${typeMovie.plural}(where: { title_EQ: "${movieTitle}" }) {
                    t:actorsConnection {
                        e:edges {
                            no:node {
                                ne:name
                            }
                        }
                    }
                }
            }
        `;

        await testHelper.executeCypher(
            `
                    CREATE (m:${typeMovie.name} {title: $movieTitle})
                    CREATE (m)<-[:ACTED_IN]-(:${typeActor.name} {name: randomUUID()})
                    CREATE (m)<-[:ACTED_IN]-(:${typeActor.name} {name: randomUUID()})
                    CREATE (m)<-[:ACTED_IN]-(:${typeActor.name} {name: randomUUID()})
                `,
            {
                movieTitle,
            }
        );

        const result = await testHelper.executeGraphQL(query);

        expect(result.errors).toBeUndefined();

        expect((result.data as any).m[0].t.e[0].no.ne).toBeDefined();
    });
});
