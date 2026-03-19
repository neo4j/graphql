/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { generate } from "randomstring";
import type { UniqueType } from "../utils/graphql-types";
import { TestHelper } from "../utils/tests-helper";

describe("enums", () => {
    const testHelper = new TestHelper();
    let Movie: UniqueType;

    beforeEach(() => {
        Movie = testHelper.createUniqueType("Movie");
    });

    afterEach(async () => {
        await testHelper.close();
    });

    test("should create a movie (with a custom enum)", async () => {
        const typeDefs = `
            enum Status {
                ACTIVE
            }

            type ${Movie} @node {
              id: ID
              status: Status
            }
        `;

        await testHelper.initNeo4jGraphQL({ typeDefs });

        const id = generate({
            charset: "alphabetic",
        });

        const create = `
            mutation {
                ${Movie.operations.create}(input:[{id: "${id}", status: ACTIVE}]) {
                    ${Movie.plural} {
                        id
                    }
                }
            }
        `;

        const gqlResult = await testHelper.executeGraphQL(create);

        expect(gqlResult.errors).toBeFalsy();

        const result = await testHelper.executeCypher(`
                MATCH (m:${Movie} {id: "${id}"})
                RETURN m {.id, .status} as m
            `);

        expect(result.records[0]?.toObject().m).toEqual({ id, status: "ACTIVE" });
    });

    test("should create a movie (with a default enum)", async () => {
        const typeDefs = `
            enum Status {
                ACTIVE
                INACTIVE
                EATING
            }

            type ${Movie} @node {
              id: ID
              status: Status @default(value: ACTIVE)
            }
        `;

        await testHelper.initNeo4jGraphQL({ typeDefs });

        const id = generate({
            charset: "alphabetic",
        });

        const create = `
            mutation {
                ${Movie.operations.create}(input:[{id: "${id}"}]) {
                    ${Movie.plural} {
                        id
                    }
                }
            }
        `;

        const gqlResult = await testHelper.executeGraphQL(create);

        expect(gqlResult.errors).toBeFalsy();

        const result = await testHelper.executeCypher(`
                MATCH (m:${Movie} {id: "${id}"})
                RETURN m {.id, .status} as m
            `);

        expect(result.records[0]?.toObject().m).toEqual({ id, status: "ACTIVE" });
    });

    test("should create a movie (with custom enum and resolver)", async () => {
        const statusResolver = {
            ACTIVE: "active",
        };

        const typeDefs = `
            enum Status {
                ACTIVE
            }

            type ${Movie} @node {
              id: ID
              status: Status
            }
        `;

        await testHelper.initNeo4jGraphQL({ typeDefs, resolvers: { Status: statusResolver } });

        const id = generate({
            charset: "alphabetic",
        });

        const create = `
            mutation {
                ${Movie.operations.create}(input:[{id: "${id}", status: ACTIVE}]) {
                    ${Movie.plural} {
                        id
                    }
                }
            }
        `;

        const gqlResult = await testHelper.executeGraphQL(create);

        expect(gqlResult.errors).toBeFalsy();

        const result = await testHelper.executeCypher(`
                MATCH (m:${Movie} {id: "${id}"})
                RETURN m {.id, .status} as m
            `);

        expect(result.records[0]?.toObject().m).toEqual({ id, status: "active" });
    });

    test("should create a movie (with a default enum and custom resolver)", async () => {
        const statusResolver = {
            ACTIVE: "active",
        };

        const typeDefs = `
            enum Status {
                ACTIVE
                INACTIVE
                EATING
            }

            type ${Movie} @node {
              id: ID
              status: Status @default(value: ACTIVE)
            }
        `;

        await testHelper.initNeo4jGraphQL({ typeDefs, resolvers: { Status: statusResolver } });

        const id = generate({
            charset: "alphabetic",
        });

        const create = `
            mutation {
                ${Movie.operations.create}(input:[{id: "${id}"}]) {
                    ${Movie.plural} {
                        id
                    }
                }
            }
        `;

        const gqlResult = await testHelper.executeGraphQL(create);

        expect(gqlResult.errors).toBeFalsy();

        const result = await testHelper.executeCypher(`
                MATCH (m:${Movie} {id: "${id}"})
                RETURN m {.id, .status} as m
            `);

        expect(result.records[0]?.toObject().m).toEqual({ id, status: "active" });
    });
});
