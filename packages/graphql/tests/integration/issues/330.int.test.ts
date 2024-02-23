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

import type { Driver, Session } from "neo4j-driver";
import { graphql } from "graphql";
import Neo4jHelper from "../neo4j";
import { Neo4jGraphQL } from "../../../src/classes";
import { createBearerToken } from "../../utils/create-bearer-token";
import { UniqueType } from "../../utils/graphql-types";

// Reference: https://github.com/neo4j/graphql/pull/330
// Reference: https://github.com/neo4j/graphql/pull/303#discussion_r671148932
describe("unauthenticated-requests", () => {
    const secret = "secret";
    let driver: Driver;
    let session: Session;
    let neo4j: Neo4jHelper;
    let User: UniqueType;

    beforeAll(async () => {
        neo4j = new Neo4jHelper();
        driver = await neo4j.getDriver();
    });

    afterAll(async () => {
        await driver.close();
    });

    beforeEach(async () => {
        session = await neo4j.getSession();
        User = new UniqueType("User");
    });

    afterEach(async () => {
        await session.close();
    });

    test("should throw Unauthenticated when trying to pluck undefined value with allow", async () => {
        const typeDefs = `
            type ${User} {
                id: ID
            }

            extend type ${User} @authorization(validate: [{ when: BEFORE, where: { node: { id: "$jwt.sub" } } }])
        `;

        const query = `
            {
                ${User.plural} {
                    id
                }
            }
        `;

        await session.run(`CREATE (:${User} { id: "ID" })`);

        const neoSchema = new Neo4jGraphQL({
            typeDefs,
            features: {
                authorization: {
                    key: "secret",
                },
            },
        });

        const token = createBearerToken(secret);

        const gqlResult = await graphql({
            schema: await neoSchema.getSchema(),
            source: query,
            contextValue: neo4j.getContextValues({ token }),
        });

        expect((gqlResult.errors as any[])[0].message).toBe("Forbidden");
    });

    test("should throw Unauthenticated when trying to pluck undefined value with where", async () => {
        const typeDefs = `
            type ${User} {
                id: ID
            }

            extend type ${User} @authorization(filter: [{ where: { node: { id: "$jwt.sub" } } }])
        `;

        const query = `
            {
                ${User.plural} {
                    id
                }
            }
        `;

        await session.run(`CREATE (:${User} { id: "ID" })`);

        const neoSchema = new Neo4jGraphQL({
            typeDefs,
            features: {
                authorization: {
                    key: "secret",
                },
            },
        });

        const token = createBearerToken(secret);

        const gqlResult = await graphql({
            schema: await neoSchema.getSchema(),
            source: query,
            contextValue: neo4j.getContextValues({ token }),
        });

        expect(gqlResult.errors).toBeUndefined();
        expect(gqlResult.data).toEqual({
            [User.plural]: [],
        });
    });

    test("should throw Unauthenticated when trying to pluck undefined value with bind", async () => {
        const typeDefs = `
            type ${User} {
                id: ID
            }

            extend type ${User} @authorization(validate: [{ when: AFTER, where: { node: { id: "$jwt.sub" } } }])
        `;

        const query = `
            mutation {
                ${User.operations.create}(input: [{ id: "some-id" }]) {
                    ${User.plural} {
                        id
                    }
                }
            }
        `;

        const neoSchema = new Neo4jGraphQL({
            typeDefs,
            features: {
                authorization: {
                    key: "secret",
                },
            },
        });

        const token = createBearerToken(secret);

        const gqlResult = await graphql({
            schema: await neoSchema.getSchema(),
            source: query,
            contextValue: neo4j.getContextValues({ token }),
        });

        expect((gqlResult.errors as any[])[0].message).toBe("Forbidden");
    });

    // If the below test starts failing, we will need to change the default value that we use for non-existent JWT claims
    test("maps are not supported in the database and can be used as JWT default value", async () => {
        await expect(() => session.run(`CREATE (:${User} { shouldFail: {} })`)).rejects.toThrow(
            "Property values can only be of primitive types or arrays thereof. Encountered: Map{}."
        );
    });
});
