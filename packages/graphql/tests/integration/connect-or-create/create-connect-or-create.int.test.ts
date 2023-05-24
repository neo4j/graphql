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

import type { Driver, Session, Integer } from "neo4j-driver";
import { gql } from "graphql-tag";
import type { DocumentNode } from "graphql";
import { graphql } from "graphql";
import Neo4j from "../neo4j";
import { Neo4jGraphQL } from "../../../src";
import { UniqueType } from "../../utils/graphql-types";
import { getQuerySource } from "../../utils/get-query-source";
import { runAndParseRecords } from "../../utils/run-and-parse-records";

describe("Create -> ConnectOrCreate", () => {
    let driver: Driver;
    let neo4j: Neo4j;
    let session: Session;
    let typeDefs: DocumentNode;

    const typeMovie = new UniqueType("Movie");
    const typeActor = new UniqueType("Actor");

    let neoSchema: Neo4jGraphQL;

    beforeAll(async () => {
        neo4j = new Neo4j();
        driver = await neo4j.getDriver();

        typeDefs = gql`
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

        interface ActedIn {
            screentime: Int
        }
        `;

        neoSchema = new Neo4jGraphQL({ typeDefs });
    });

    beforeEach(async () => {
        session = await neo4j.getSession();
    });

    afterEach(async () => {
        await session.close();
    });

    afterAll(async () => {
        await driver.close();
    });

    test("ConnectOrCreate creates new node", async () => {
        const query = gql`
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

        const gqlResult = await graphql({
            schema: await neoSchema.getSchema(),
            source: getQuerySource(query),
            contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
        });
        expect(gqlResult.errors).toBeUndefined();
        expect((gqlResult as any).data[typeActor.operations.create][`${typeActor.plural}`]).toEqual([
            {
                name: "Tom Hanks",
            },
        ]);

        const movieTitleAndId = await runAndParseRecords<{ title: string; id: Integer }>(
            session,
            `
          MATCH (m:${typeMovie.name} {id: 5})
          RETURN m.title as title, m.id as id
        `
        );

        expect(movieTitleAndId.title).toBe("The Terminal");
        expect(movieTitleAndId.id.toNumber()).toBe(5);

        const actedInRelation = await session.run(`
            MATCH (:${typeMovie.name} {id: 5})<-[r:ACTED_IN]-(:${typeActor.name} {name: "Tom Hanks"})
            RETURN r.screentime as screentime
            `);

        expect(actedInRelation.records).toHaveLength(1);
    });

    test("ConnectOrCreate on existing node", async () => {
        const testActorName = "aRandomActor";
        await session.run(`CREATE (m:${typeMovie.name} { title: "Terminator2", id: 2222})`);
        const query = gql`
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

        const gqlResult = await graphql({
            schema: await neoSchema.getSchema(),
            source: getQuerySource(query),
            contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
        });
        expect(gqlResult.errors).toBeUndefined();
        expect((gqlResult as any).data[typeActor.operations.create][`${typeActor.plural}`]).toEqual([
            {
                name: testActorName,
            },
        ]);

        const actorsWithMovieCount = await runAndParseRecords<{ count: Integer }>(
            session,
            `
          MATCH (a:${typeActor.name} {name: "${testActorName}"})-[]->(m:${typeMovie.name} {id: 2222})
          RETURN COUNT(a) as count
        `
        );

        expect(actorsWithMovieCount.count.toInt()).toBe(1);

        const moviesWithIdCount = await runAndParseRecords<{ count: Integer }>(
            session,
            `
          MATCH (m:${typeMovie.name} {id: 2222})
          RETURN COUNT(m) as count
        `
        );

        expect(moviesWithIdCount.count.toInt()).toBe(1);

        const theTerminalMovieCount = await runAndParseRecords<{ count: Integer }>(
            session,
            `
          MATCH (m:${typeMovie.name} {id: 2222, name: "The Terminal"})
          RETURN COUNT(m) as count
        `
        );

        expect(theTerminalMovieCount.count.toInt()).toBe(0);

        const actedInRelation = await runAndParseRecords<{ screentime: Integer }>(
            session,
            `
            MATCH (:${typeMovie.name} {id: 2222})<-[r:ACTED_IN]-(:${typeActor.name} {name: "${testActorName}"})
            RETURN r.screentime as screentime
            `
        );

        expect(actedInRelation.screentime.toNumber()).toBe(105);

        const newIdMovieCount = await runAndParseRecords<{ count: Integer }>(
            session,
            `
            MATCH (m:${typeMovie.name} {id: 22224})
            RETURN COUNT(m) as count
            `
        );
        expect(newIdMovieCount.count.toInt()).toBe(0);
    });

    test("ConnectOrCreate creates new node with edge data", async () => {
        const actorName = "Tommy Hanks The Little";
        const query = gql`
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

        const gqlResult = await graphql({
            schema: await neoSchema.getSchema(),
            source: getQuerySource(query),
            contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
        });
        expect(gqlResult.errors).toBeUndefined();
        expect((gqlResult as any).data[typeActor.operations.create][`${typeActor.plural}`]).toEqual([
            {
                name: actorName,
            },
        ]);

        const movieTitleAndId = await runAndParseRecords<{ title: string; id: Integer }>(
            session,
            `
          MATCH (m:${typeMovie.name} {id: 52})
          RETURN m.title as title, m.id as id
        `
        );

        expect(movieTitleAndId.title).toBe("The Terminal 2");
        expect(movieTitleAndId.id.toNumber()).toBe(52);

        const actedInRelation = await runAndParseRecords<{ screentime: Integer }>(
            session,
            `
            MATCH (:${typeMovie.name} {id: 52})<-[r:ACTED_IN]-(:${typeActor.name} {name: "${actorName}"})
            RETURN r.screentime as screentime
            `
        );

        expect(actedInRelation.screentime.toNumber()).toBe(105);
    });
    test("ConnectOrCreate creates a new node with the correct relationship direction", async () => {
        const query = gql`
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

        const gqlResult = await graphql({
            schema: await neoSchema.getSchema(),
            source: getQuerySource(query),
            contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
        });

        expect(gqlResult.errors).toBeUndefined();
        expect((gqlResult as any).data[typeMovie.operations.create][`${typeMovie.plural}`]).toEqual([
            {
                id: 339,
                title: "The Matrix",
            },
        ]);

        const actorsRelation = await runAndParseRecords<{ screentime: Integer }>(
            session,
            `
        MATCH (:${typeMovie.name} { id: 339 })<-[r:ACTED_IN]-(:${typeActor.name} { name: "Keanu" }) 
        RETURN r.screentime as screentime
      `
        );

        expect(actorsRelation.screentime.toNumber()).toBe(105);
    });
});
