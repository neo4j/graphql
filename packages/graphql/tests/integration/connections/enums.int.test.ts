/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { generate } from "randomstring";
import type { UniqueType } from "../../utils/graphql-types";
import { TestHelper } from "../../utils/tests-helper";

describe("Enum Relationship Properties", () => {
    const testHelper = new TestHelper();
    let Movie: UniqueType;
    let Actor: UniqueType;

    beforeEach(async () => {
        Movie = testHelper.createUniqueType("Movie");
        Actor = testHelper.createUniqueType("Actor");
        const typeDefs = `
            type ${Actor} @node {
                name: String!
                movies: [${Movie}!]! @relationship(type: "ACTED_IN", direction: OUT, properties: "ActedIn")
            }
    
            type ${Movie} @node {
                title: String!
                actors: [${Actor}!]! @relationship(type: "ACTED_IN", direction: IN, properties: "ActedIn")
            }
    
            enum RoleType {
                LEADING
                SUPPORTING
            }
    
            type ActedIn @relationshipProperties {
                roleType: RoleType!
            }
        `;
        const roleTypeResolver = {
            LEADING: "Leading",
            SUPPORTING: "Supporting",
        };

        await testHelper.initNeo4jGraphQL({
            typeDefs,
            resolvers: { RoleType: roleTypeResolver },
        });
    });

    afterEach(async () => {
        await testHelper.close();
    });

    test("should create a movie and an actor, with an enum as a relationship property", async () => {
        const title = generate({
            charset: "alphabetic",
        });

        const name = generate({
            charset: "alphabetic",
        });

        const create = /* GraphQL */ `
            mutation CreateMovies($title: String!, $name: String!) {
                ${Movie.operations.create}(
                    input: [
                        { title: $title, actors: { create: [{ edge: { roleType: LEADING }, node: { name: $name } }] } }
                    ]
                ) {
                    ${Movie.plural} {
                        title
                        actorsConnection {
                            edges {
                                properties {
                                    roleType
                                }
                                node {
                                    name
                                }
                            }
                        }
                    }
                }
            }
        `;

        const gqlResult = await testHelper.executeGraphQL(create, {
            variableValues: { title, name },
        });

        expect(gqlResult.errors).toBeFalsy();

        expect(gqlResult.data).toEqual({
            [Movie.operations.create]: {
                [Movie.plural]: [
                    {
                        title,
                        actorsConnection: { edges: [{ properties: { roleType: "LEADING" }, node: { name } }] },
                    },
                ],
            },
        });

        const result = await testHelper.executeCypher(`
                MATCH (m:${Movie})<-[ai:ACTED_IN]-(a:${Actor})
                WHERE m.title = "${title}" AND a.name = "${name}"
                RETURN ai
            `);

        expect((result.records[0]?.toObject() as any).ai.properties).toEqual({ roleType: "Leading" });
    });
});
