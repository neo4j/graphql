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

import { graphql } from "graphql";
import type { Driver, Session } from "neo4j-driver";
import { Neo4jGraphQL } from "../../../src";
import { cleanNodes } from "../../utils/clean-nodes";
import { createBearerToken } from "../../utils/create-bearer-token";
import { UniqueType } from "../../utils/graphql-types";
import Neo4jHelper from "../neo4j";

describe("https://github.com/neo4j/graphql/issues/4099", () => {
    let driver: Driver;
    let neo4j: Neo4jHelper;
    let neoSchema: Neo4jGraphQL;
    let session: Session;
    const secret = "secret";

    let User: UniqueType;
    let Person: UniqueType;

    beforeAll(async () => {
        neo4j = new Neo4jHelper();
        driver = await neo4j.getDriver();
    });

    beforeEach(async () => {
        session = await neo4j.getSession();

        User = new UniqueType("User");
        Person = new UniqueType("Person");

        const typeDefs = /* GraphQL */ `
            type JWT @jwt {
                isAdmin: Boolean!
            }

            type ${User} @authorization(filter: [{ operations: [READ], where: { jwt: { isAdmin: true } } }]) {
                id: ID @id
            }

            type ${Person} @authorization(filter: [{ operations: [READ], where: { jwt: { isAdmin_NOT: true } } }]) {
                id: ID @id
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
            driver,
            features: {
                authorization: {
                    key: secret,
                },
            },
        });
    });

    beforeEach(async () => {
        await session.run(`
            CREATE (:${User} { id: 1 })
            CREATE (:${Person} { id: 1 })
        `);
    });

    afterEach(async () => {
        await cleanNodes(driver, [User, Person]);
        await session.close();
    });

    afterAll(async () => {
        await driver.close();
    });

    test("returns users if isAdmin true", async () => {
        const query = /* GraphQL */ `
            query {
                ${User.plural} {
                    id
                }
            }
        `;

        const token = createBearerToken(secret, { isAdmin: true });

        const result = await graphql({
            schema: await neoSchema.getSchema(),
            source: query,
            contextValue: neo4j.getContextValues({ token }),
        });

        expect(result.errors).toBeUndefined();

        expect((result.data as any)[User.plural]).toEqual([
            {
                id: "1",
            },
        ]);
    });

    test("does not return users if isAdmin false", async () => {
        const query = /* GraphQL */ `
            query {
                ${User.plural} {
                    id
                }
            }
        `;

        const token = createBearerToken(secret, { isAdmin: false });

        const result = await graphql({
            schema: await neoSchema.getSchema(),
            source: query,
            contextValue: neo4j.getContextValues({ token }),
        });

        expect(result.errors).toBeUndefined();

        expect((result.data as any)[User.plural]).toEqual([]);
    });

    test("returns people if isAdmin false", async () => {
        const query = /* GraphQL */ `
            query {
                ${Person.plural} {
                    id
                }
            }
        `;

        const token = createBearerToken(secret, { isAdmin: false });

        const result = await graphql({
            schema: await neoSchema.getSchema(),
            source: query,
            contextValue: neo4j.getContextValues({ token }),
        });

        expect(result.errors).toBeUndefined();

        expect((result.data as any)[Person.plural]).toEqual([
            {
                id: "1",
            },
        ]);
    });

    test("does not return people if isAdmin true", async () => {
        const query = /* GraphQL */ `
            query {
                ${Person.plural} {
                    id
                }
            }
        `;

        const token = createBearerToken(secret, { isAdmin: true });

        const result = await graphql({
            schema: await neoSchema.getSchema(),
            source: query,
            contextValue: neo4j.getContextValues({ token }),
        });

        expect(result.errors).toBeUndefined();

        expect((result.data as any)[Person.plural]).toEqual([]);
    });
});
