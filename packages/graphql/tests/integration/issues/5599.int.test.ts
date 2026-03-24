/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { createBearerToken } from "../../utils/create-bearer-token";
import type { UniqueType } from "../../utils/graphql-types";
import { TestHelper } from "../../utils/tests-helper";

describe("https://github.com/neo4j/graphql/issues/5599", () => {
    const testHelper = new TestHelper();

    const secret = "dontpanic";

    let Movie: UniqueType;
    let LeadActor: UniqueType;
    let Extra: UniqueType;

    beforeEach(async () => {
        Movie = testHelper.createUniqueType("Movie");
        LeadActor = testHelper.createUniqueType("LeadActor");
        Extra = testHelper.createUniqueType("Extra");

        const typeDefs = /* GraphQL */ `
            type ${Movie} @node {
                title: String!
                actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN)
            }

            type ${LeadActor} @node {
                name: String!
                actedIn: [${Movie}!]! @relationship(type: "ACTED_IN", direction: OUT)
            }

            type ${Extra} @node {
                name: String
                actedIn: [${Movie}!]! @relationship(type: "ACTED_IN", direction: OUT)
            }

            union Actor = ${LeadActor} | ${Extra}
        `;
        await testHelper.initNeo4jGraphQL({
            typeDefs,
        });
    });

    afterEach(async () => {
        await testHelper.close();
    });

    test("update with nested delete of an union", async () => {
        await testHelper.executeCypher(`
        CREATE(m:${Movie} { title: "The Matrix"})<-[:ACTED_IN]-(:${LeadActor} {name: "Actor1"})
        CREATE(m)<-[:ACTED_IN]-(:${LeadActor} {name: "Actor2"})
        CREATE(m)<-[:ACTED_IN]-(:${Extra} {name: "Actor1"})
            `);

        const query = /* GraphQL */ `
            mutation UpdateMovies {
                ${Movie.operations.update}(
                    update: { actors: { ${LeadActor}: [{ delete: [{ where: { node: { name_EQ: "Actor1" } } }] }] } }
                ) {
                    ${Movie.plural} {
                        title
                    }
                }
            }
        `;

        const token = createBearerToken(secret, { sub: "1234" });
        const response = await testHelper.executeGraphQLWithToken(query, token);
        const remainingLeadActors = await testHelper.executeCypher(`MATCH(m:${LeadActor}) RETURN m`);
        const remainingExtras = await testHelper.executeCypher(`MATCH(m:${Extra}) RETURN m`);

        expect(response.errors).toBeFalsy();
        expect(remainingLeadActors.records).toHaveLength(1);
        expect(remainingExtras.records).toHaveLength(1);
        expect(response.data).toEqual({
            [Movie.operations.update]: {
                [Movie.plural]: [
                    {
                        title: "The Matrix",
                    },
                ],
            },
        });
    });

    test("update with nested delete of an union with multiple concrete entities", async () => {
        await testHelper.executeCypher(`
        CREATE(m:${Movie} { title: "The Matrix"})<-[:ACTED_IN]-(:${LeadActor} {name: "Actor1"})
        CREATE(m)<-[:ACTED_IN]-(:${LeadActor} {name: "Actor2"})
        CREATE(m)<-[:ACTED_IN]-(:${Extra} {name: "Actor2"})
            `);

        const query = /* GraphQL */ `
            mutation UpdateMovies {
                ${Movie.operations.update}(
                    update: { actors: { ${LeadActor}: [{ delete: [{ where: { node: { name_EQ: "Actor1" } } }] }], ${Extra}: [{ delete: [{ where: { node: { name_EQ: "Actor2" } } }] }] } }
                ) {
                    ${Movie.plural} {
                        title
                    }
                }
            }
        `;

        const token = createBearerToken(secret, { sub: "1234" });
        const response = await testHelper.executeGraphQLWithToken(query, token);
        const remainingLeadActors = await testHelper.executeCypher(`MATCH(m:${LeadActor}) RETURN m`);
        const remainingExtras = await testHelper.executeCypher(`MATCH(m:${Extra}) RETURN m`);

        expect(response.errors).toBeFalsy();
        expect(remainingLeadActors.records).toHaveLength(1);
        expect(remainingExtras.records).toHaveLength(0);
        expect(response.data).toEqual({
            [Movie.operations.update]: {
                [Movie.plural]: [
                    {
                        title: "The Matrix",
                    },
                ],
            },
        });
    });
});
