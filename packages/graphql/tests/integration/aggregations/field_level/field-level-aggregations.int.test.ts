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

import { Driver, Session } from "neo4j-driver";
import { graphql } from "graphql";
import neo4j from "../../neo4j";
import { Neo4jGraphQL } from "../../../../src/classes";
import { generateUniqueType } from "../../../../src/utils/test/graphql-types";

describe("aggregations-field-level-basic", () => {
    let driver: Driver;
    let session: Session;
    let typeDefs: string;

    const typeMovie = generateUniqueType("Movie");
    const typeActor = generateUniqueType("Actor");

    let neoSchema: Neo4jGraphQL;

    beforeAll(async () => {
        driver = await neo4j();

        typeDefs = `
        type ${typeMovie.name} {
            title: String
            ${typeActor.plural}: [${typeActor.name}] @relationship(type: "ACTED_IN", direction: IN)
        }

        type ${typeActor.name} {
            name: String
            ${typeMovie.plural}: [${typeMovie.name}] @relationship(type: "ACTED_IN", direction: OUT)
        }
        `;

        neoSchema = new Neo4jGraphQL({ typeDefs });
    });

    beforeEach(() => {
        session = driver.session();
    });

    afterEach(async () => {
        await session.close();
    });

    afterAll(async () => {
        await driver.close();
    });

    test("should count nodes", async () => {
        await session.run(`CREATE (m:${typeMovie.name} { title: "Terminator"})<-[:ACTED_IN]-(:${typeActor.name} { name: "Arnold"})
             CREATE (m)<-[:ACTED_IN]-(:${typeActor.name} {name: "Linda"})`);

        const query = `
            query {
              ${typeMovie.plural} {
                ${typeActor.plural}Aggregate {
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

        expect(gqlResult.errors).toBeUndefined();
        expect((gqlResult as any).data[typeMovie.plural][0][`${typeActor.plural}Aggregate`]).toEqual({
            count: 2,
        });
    });

    test("shortest and longest node string", async () => {
        await session.run(`CREATE (m:${typeMovie.name} { title: "Terminator"})<-[:ACTED_IN]-(:${typeActor.name} { name: "Arnold"})
             CREATE (m)<-[:ACTED_IN]-(:${typeActor.name} {name: "Linda"})`);

        const query = `
            query {
              ${typeMovie.plural} {
                ${typeActor.plural}Aggregate {
                  node {
                    name {
                      longest
                      shortest
                    }
                  }
                }
              }
            }
            `;

        const gqlResult = await graphql({
            schema: neoSchema.schema,
            source: query,
            contextValue: { driver, driverConfig: { bookmarks: [session.lastBookmark()] } },
        });

        expect(gqlResult.errors).toBeUndefined();
        expect((gqlResult as any).data[typeMovie.plural][0][`${typeActor.plural}Aggregate`]).toEqual({
            node: {
                name: {
                    longest: "Arnold",
                    shortest: "Linda",
                },
            },
        });
    });
});
