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

            type ${Movie} {
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

            type ${Movie} {
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

            type ${Movie} {
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

            type ${Movie} {
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
