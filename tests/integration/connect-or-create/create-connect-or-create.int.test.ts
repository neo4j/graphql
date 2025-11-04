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

import type { Integer, QueryResult } from "neo4j-driver";
import { TestHelper } from "../../utils/tests-helper";

async function runAndParseRecords<T extends Record<string, unknown>>(
    testHelper: TestHelper,
    cypher: string,
    params?: Record<string, unknown>
): Promise<T> {
    const result = await testHelper.executeCypher(cypher, params);
    return extractFirstRecord(result);
}

function extractFirstRecord<T>(records: QueryResult<Record<PropertyKey, any>>): T {
    const record = records.records[0];
    if (!record) throw new Error("Record is undefined, i.e. no columns returned from neo4j-driver in test");
    return record.toObject();
}

describe("Create -> ConnectOrCreate", () => {
    const testHelper = new TestHelper();
    let typeDefs: string;

    const typeMovie = testHelper.createUniqueType("Movie");
    const typeActor = testHelper.createUniqueType("Actor");

    beforeEach(async () => {
        typeDefs = /* GraphQL */ `
        type ${typeMovie.name} {
            title: String!
            id: Int! @unique
            ${typeActor.plural}: [${typeActor.name}!]! @relationship(type: "ACTED_IN", direction: IN, properties:"ActedIn")
        }

        type ${typeActor.name} {
            id: Int! @unique
            name: String
            ${typeMovie.plural}: [${typeMovie.name}!]! @relationship(type: "ACTED_IN", direction: OUT, properties:"ActedIn")
        }

        type ActedIn @relationshipProperties {
            screentime: Int
        }
        `;

        await testHelper.initNeo4jGraphQL({ typeDefs });
    });

    afterEach(async () => {
        await testHelper.close();
    });

    test("ConnectOrCreate creates new node", async () => {
        const query = /* GraphQL */ `
            mutation {
              ${typeActor.operations.create}(
                input: [
                  {
                    id: 22,
                    name: "Tom Hanks"
                    ${typeMovie.plural}: {
                      connectOrCreate: {
                        where: { node: { id: 5 } }
                        onCreate: { node: { title: "The Terminal", id: 5 } }
                      }
                    }
                  }
                ]
              ) {
                ${typeActor.plural} {
                  name
                }
              }
            }
            `;

        const gqlResult = await testHelper.executeGraphQL(query);
        expect(gqlResult.errors).toBeUndefined();
        expect((gqlResult as any).data[typeActor.operations.create][`${typeActor.plural}`]).toEqual([
            {
                name: "Tom Hanks",
            },
        ]);

        const movieTitleAndId = await runAndParseRecords<{ title: string; id: Integer }>(
            testHelper,
            `
          MATCH (m:${typeMovie.name} {id: 5})
          RETURN m.title as title, m.id as id
        `
        );

        expect(movieTitleAndId.title).toBe("The Terminal");
        expect(movieTitleAndId.id.toNumber()).toBe(5);

        const actedInRelation = await testHelper.executeCypher(`
            MATCH (:${typeMovie.name} {id: 5})<-[r:ACTED_IN]-(:${typeActor.name} {name: "Tom Hanks"})
            RETURN r.screentime as screentime
            `);

        expect(actedInRelation.records).toHaveLength(1);
    });

    test("ConnectOrCreate on existing node", async () => {
        const testActorName = "aRandomActor";
        await testHelper.executeCypher(`CREATE (m:${typeMovie.name} { title: "Terminator2", id: 2222})`);
        const query = /* GraphQL */ `
            mutation {
              ${typeActor.operations.create}(
                input: [
                  {
                    id: 234,
                    name: "${testActorName}"
                    ${typeMovie.plural}: {
                      connectOrCreate: {
                        where: { node: { id: 2222 } }
                        onCreate: { edge: { screentime: 105 }, node: { title: "The Terminal", id: 22224 } }
                      }
                    }
                  }
                ]
              ) {
                ${typeActor.plural} {
                  name
                }
              }
            }
            `;

        const gqlResult = await testHelper.executeGraphQL(query);
        expect(gqlResult.errors).toBeUndefined();
        expect((gqlResult as any).data[typeActor.operations.create][`${typeActor.plural}`]).toEqual([
            {
                name: testActorName,
            },
        ]);

        const actorsWithMovieCount = await runAndParseRecords<{ count: Integer }>(
            testHelper,
            `
          MATCH (a:${typeActor.name} {name: "${testActorName}"})-[]->(m:${typeMovie.name} {id: 2222})
          RETURN COUNT(a) as count
        `
        );

        expect(actorsWithMovieCount.count.toInt()).toBe(1);

        const moviesWithIdCount = await runAndParseRecords<{ count: Integer }>(
            testHelper,
            `
          MATCH (m:${typeMovie.name} {id: 2222})
          RETURN COUNT(m) as count
        `
        );

        expect(moviesWithIdCount.count.toInt()).toBe(1);

        const theTerminalMovieCount = await runAndParseRecords<{ count: Integer }>(
            testHelper,
            `
          MATCH (m:${typeMovie.name} {id: 2222, name: "The Terminal"})
          RETURN COUNT(m) as count
        `
        );

        expect(theTerminalMovieCount.count.toInt()).toBe(0);

        const actedInRelation = await runAndParseRecords<{ screentime: Integer }>(
            testHelper,
            `
            MATCH (:${typeMovie.name} {id: 2222})<-[r:ACTED_IN]-(:${typeActor.name} {name: "${testActorName}"})
            RETURN r.screentime as screentime
            `
        );

        expect(actedInRelation.screentime.toNumber()).toBe(105);

        const newIdMovieCount = await runAndParseRecords<{ count: Integer }>(
            testHelper,
            `
            MATCH (m:${typeMovie.name} {id: 22224})
            RETURN COUNT(m) as count
            `
        );
        expect(newIdMovieCount.count.toInt()).toBe(0);
    });

    test("ConnectOrCreate creates new node with edge data", async () => {
        const actorName = "Tommy Hanks The Little";
        const query = /* GraphQL */ `
            mutation {
              ${typeActor.operations.create}(
                input: [
                  {
                    id: 239,
                    name: "${actorName}"
                    ${typeMovie.plural}: {
                      connectOrCreate: {
                        where: { node: { id: 52 } }
                        onCreate: { edge: { screentime: 105 }, node: { title: "The Terminal 2", id: 52 } }
                      }
                    }
                  }
                ]
              ) {
                ${typeActor.plural} {
                  name
                }
              }
            }
            `;

        const gqlResult = await testHelper.executeGraphQL(query);
        expect(gqlResult.errors).toBeUndefined();
        expect((gqlResult as any).data[typeActor.operations.create][`${typeActor.plural}`]).toEqual([
            {
                name: actorName,
            },
        ]);

        const movieTitleAndId = await runAndParseRecords<{ title: string; id: Integer }>(
            testHelper,
            `
          MATCH (m:${typeMovie.name} {id: 52})
          RETURN m.title as title, m.id as id
        `
        );

        expect(movieTitleAndId.title).toBe("The Terminal 2");
        expect(movieTitleAndId.id.toNumber()).toBe(52);

        const actedInRelation = await runAndParseRecords<{ screentime: Integer }>(
            testHelper,
            `
            MATCH (:${typeMovie.name} {id: 52})<-[r:ACTED_IN]-(:${typeActor.name} {name: "${actorName}"})
            RETURN r.screentime as screentime
            `
        );

        expect(actedInRelation.screentime.toNumber()).toBe(105);
    });
    test("ConnectOrCreate creates a new node with the correct relationship direction", async () => {
        const query = /* GraphQL */ `
          mutation {
            ${typeMovie.operations.create}(
              input: [{
                id: 339,
                title: "The Matrix",
                ${typeActor.plural}: {
                  connectOrCreate: {
                    where: { node: { id: 305 } }
                    onCreate: { node: { id: 305, name: "Keanu" }, edge: { screentime: 105 } }
                  }
                }
              }]
            ) {
              ${typeMovie.plural} {
                id
                title
              }
            }
          }
      `;

        const gqlResult = await testHelper.executeGraphQL(query);

        expect(gqlResult.errors).toBeUndefined();
        expect((gqlResult as any).data[typeMovie.operations.create][`${typeMovie.plural}`]).toEqual([
            {
                id: 339,
                title: "The Matrix",
            },
        ]);

        const actorsRelation = await runAndParseRecords<{ screentime: Integer }>(
            testHelper,
            `
        MATCH (:${typeMovie.name} { id: 339 })<-[r:ACTED_IN]-(:${typeActor.name} { name: "Keanu" }) 
        RETURN r.screentime as screentime
      `
        );

        expect(actorsRelation.screentime.toNumber()).toBe(105);
    });
});
