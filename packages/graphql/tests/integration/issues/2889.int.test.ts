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
import Neo4j from "../neo4j";
import { Neo4jGraphQL } from "../../../src";
import { UniqueType } from "../../utils/graphql-types";
import { cleanNodes } from "../../utils/clean-nodes";
import { Neo4jGraphQLAuthJWTPlugin } from "../../../../plugins/graphql-plugin-auth/src";

describe("https://github.com/neo4j/graphql/issues/2889", () => {
    let driver: Driver;
    let neo4j: Neo4j;
    let neoSchema: Neo4jGraphQL;
    let session: Session;

    let MyEnumHolder: UniqueType;

    beforeAll(async () => {
        neo4j = new Neo4j();
        driver = await neo4j.getDriver();
    });

    beforeEach(async () => {
        session = await neo4j.getSession();

        MyEnumHolder = new UniqueType("MyEnumHolder");

        const typeDefs = `
            enum MyEnum {
                FIRST
                SECOND
            }

            type ${MyEnumHolder} {
                myEnums: [MyEnum!]!
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
            driver,
            plugins: {
                auth: new Neo4jGraphQLAuthJWTPlugin({
                    secret: "secret"
                })
            }
        });
    });

    afterEach(async () => {
        await cleanNodes(session, [MyEnumHolder]);
        await session.close();
    });

    afterAll(async () => {
        await driver.close();
    });

    test("should be able to create node with list of enums", async () => {
        const query = `
            mutation {
                ${MyEnumHolder.operations.create}(input: [{ myEnums: [FIRST, SECOND] }]) {
                    ${MyEnumHolder.plural} {
                        myEnums
                    }
                }
            }
        `;

        const result = await graphql({
            schema: await neoSchema.getSchema(),
            source: query,
            contextValue: neo4j.getContextValues()
        });

        expect(result.errors).toBeFalsy();
        expect((result.data?.[MyEnumHolder.operations.create] as any)[MyEnumHolder.plural]).toEqual([
            { myEnums: ["FIRST", "SECOND"] }
        ]);
    });
});
