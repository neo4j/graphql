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

import { Driver } from "neo4j-driver";
import { graphql } from "graphql";
import { generate } from "randomstring";
import pluralize from "pluralize";
import camelCase from "camelcase";
import neo4j from "../../neo4j";
import { Neo4jGraphQL } from "../../../../src/classes";

describe("aggregations-top_level-basic", () => {
    let driver: Driver;

    beforeAll(async () => {
        driver = await neo4j();
    });

    afterAll(async () => {
        await driver.close();
    });

    test("should count nodes", async () => {
        const session = driver.session();

        const typeMovie = `${generate({
            charset: "alphabetic",
            readable: true,
        })}Movie`;

        const typeActor = `${generate({
            charset: "alphabetic",
            readable: true,
        })}Actor`;

        const pluralMovie = pluralize(camelCase(typeMovie));
        const pluralActor = pluralize(camelCase(typeActor));

        const typeDefs = `
        type ${typeMovie} {
            title: String
            ${pluralActor}: [${typeActor}] @relationship(type: "ACTED_IN", direction: IN)
        }

        type ${typeActor} {
            name: String
            ${pluralMovie}: [${typeMovie}] @relationship(type: "ACTED_IN", direction: OUT)
        }
        `;

        const neoSchema = new Neo4jGraphQL({ typeDefs });

        try {
            await session.run(
                `CREATE (m:${typeMovie} {})<-[:ACTED_IN]-(:${typeActor} {})
                 CREATE (m)<-[:ACTED_IN]-(:${typeActor} {})
                `
            );

            const query = `
            query {
              ${pluralMovie} {
                  ${pluralActor} {
                      name
                  }
                ${pluralActor}Aggregate {
                  count
                }
              }
            }

            `;

            const gqlResult = await graphql({
                schema: neoSchema.schema,
                source: query,
                contextValue: { driver, driverConfig: { bookmarks: [session.lastBookmark()] } },
            });

            if (gqlResult.errors) {
                console.log(JSON.stringify(gqlResult.errors, null, 2));
            }

            expect(gqlResult.errors).toBeUndefined();
            console.log(JSON.stringify((gqlResult as any).data[pluralMovie], null, 2));
            expect((gqlResult as any).data[pluralMovie][0][`${pluralActor}Aggregate`]).toEqual({
                count: 2,
            });
        } finally {
            await session.close();
        }
    });
});
