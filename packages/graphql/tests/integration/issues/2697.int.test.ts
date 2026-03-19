/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import type { UniqueType } from "../../utils/graphql-types";
import { TestHelper } from "../../utils/tests-helper";

describe("https://github.com/neo4j/graphql/issues/2697", () => {
    const testHelper = new TestHelper();

    let typeMovie: UniqueType;
    let typeActor: UniqueType;

    beforeAll(async () => {
        typeMovie = testHelper.createUniqueType("Movie");
        typeActor = testHelper.createUniqueType("Actor");

        const typeDefs = `
        type ${typeMovie.name} @node {
            title: String
            duration: Duration
            actors: [${typeActor.name}!]! @relationship(type: "ACTED_IN", direction: IN, properties: "ActedIn")
        }

        type ${typeActor.name} @node {
            name: String
            movies: [${typeMovie.name}!]! @relationship(type: "ACTED_IN", direction: OUT, properties: "ActedIn")
        }

        type ActedIn @relationshipProperties {
            screenTime: Duration
        }
        `;

        await testHelper.initNeo4jGraphQL({ typeDefs });
        await testHelper.executeCypher(`
            CREATE (t1:${typeMovie.name} { title: "Terminator 1", duration: duration("PT1H47M") }),
            (t2:${typeMovie.name} { title: "Terminator 2", duration: duration("PT2H15M") }),
            (arnold:${typeActor.name} { name: "Arnold"}),
            (linda:${typeActor.name} { name: "Linda"}),
            (arnold)-[:ACTED_IN { screenTime: duration("PT1H20M") }]->(t1),
            (arnold)-[:ACTED_IN { screenTime: duration("PT2H01M") }]->(t2),
            (linda)-[:ACTED_IN { screenTime: duration("PT30M") }]->(t1),
            (linda)-[:ACTED_IN { screenTime: duration("PT20M") }]->(t2)
            `);
    });

    afterAll(async () => {
        await testHelper.close();
    });

    test("Aggregate on node duration", async () => {
        const query = `
            query {
                ${typeActor.plural}(where: { moviesAggregate: { node: {duration_AVERAGE_GT: "PT1H" } } } ) {
                    name
                }
            }
        `;

        const gqlResult = await testHelper.executeGraphQL(query);

        expect(gqlResult.errors).toBeUndefined();
        expect((gqlResult as any).data[typeActor.plural]).toEqual(
            expect.toIncludeAllMembers([
                {
                    name: "Arnold",
                },
                {
                    name: "Linda",
                },
            ])
        );
    });

    test("Aggregate on edge duration", async () => {
        const query = `
            query {
                ${typeActor.plural}(where: { moviesAggregate: { edge: {screenTime_AVERAGE_GT: "PT1H" } } } ) {
                    name
                }
            }
        `;

        const gqlResult = await testHelper.executeGraphQL(query);

        expect(gqlResult.errors).toBeUndefined();
        expect((gqlResult as any).data[typeActor.plural]).toEqual([
            {
                name: "Arnold",
            },
        ]);
    });
});
