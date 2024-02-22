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

import type { GraphQLSchema } from "graphql";
import { graphql } from "graphql";
import type { Driver } from "neo4j-driver";
import Neo4jHelper from "../neo4j";
import { Neo4jGraphQL } from "../../../src";
import { UniqueType } from "../../utils/graphql-types";
import { runCypher } from "../../utils/run-cypher";
import { createBearerToken } from "../../utils/create-bearer-token";

describe("https://github.com/neo4j/graphql/issues/1115", () => {
    const parentType = new UniqueType("Parent");
    const childType = new UniqueType("Child");

    let schema: GraphQLSchema;
    let driver: Driver;
    let neo4j: Neo4jHelper;

    beforeAll(async () => {
        neo4j = new Neo4jHelper();
        driver = await neo4j.getDriver();

        const typeDefs = `
            type JWTPayload @jwt {
                roles: [String!]!
            }

            type ${parentType} {
                children: [${childType}!]! @relationship(type: "HAS", direction: IN)
            }

            type ${childType} {
                tcId: String @unique
            }

            extend type ${childType}
                @authorization(
                    validate: [
                        { operations: [READ, CREATE, UPDATE, DELETE, CREATE_RELATIONSHIP, DELETE_RELATIONSHIP], where: { jwt: { roles_INCLUDES: "upstream" } } }
                        { operations: [READ], where: { jwt: { roles_INCLUDES: "downstream" } } }
                    ]
                )
        `;
        const neoGraphql = new Neo4jGraphQL({
            typeDefs,
            driver,
            features: {
                authorization: {
                    key: "secret",
                },
            },
        });
        schema = await neoGraphql.getSchema();
    });

    afterAll(async () => {
        await driver.close();
    });

    test("should not throw on multiple connectOrCreate with auth", async () => {
        const session = await neo4j.getSession();
        await runCypher(session, `CREATE (:${parentType})<-[:HAS]-(:${childType} {tcId: "123"})`);

        const token = createBearerToken("secret", { roles: ["upstream"] });
        const query = `
        mutation {
          ${parentType.operations.update}(
            connectOrCreate: {
              children: [
                {
                  where: { node: { tcId: "123" } }
                  onCreate: { node: { tcId: "123" } }
                }
                {
                  where: { node: { tcId: "456" } }
                  onCreate: { node: { tcId: "456" } }
                }
              ]
            }
          ) {
            info {
              nodesCreated
            }
          }
        }
        `;

        const res = await graphql({
            schema,
            source: query,
            contextValue: neo4j.getContextValues({ token }),
        });

        expect(res.errors).toBeUndefined();
        expect(res.data).toEqual({
            [parentType.operations.update]: { info: { nodesCreated: 1 } },
        });
    });
});
