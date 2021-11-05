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

import pluralize from "pluralize";
import { Driver, Session, Integer } from "neo4j-driver";
import { graphql } from "graphql";
import neo4j from "../neo4j";
import { Neo4jGraphQL } from "../../../src";
import { generateUniqueType } from "../../../src/utils/test/graphql-types";

describe("Create -> ConnectOrCreate", () => {
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
            title: String!
            id: Int! @unique
            ${typeActor.plural}: [${typeActor.name}] @relationship(type: "ACTED_IN", direction: IN, properties:"ActedIn")
        }

        type ${typeActor.name} {
            name: String
            ${typeMovie.plural}: [${typeMovie.name}] @relationship(type: "ACTED_IN", direction: OUT, properties:"ActedIn")
        }

        interface ActedIn {
            screentime: Int
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

    test("ConnectOrCreate creates new node", async () => {
        const query = `
            mutation {
              create${pluralize(typeActor.name)}(
                input: [
                  {
                    name: "Tom Hanks"
                    ${typeMovie.plural}: {
                      connectOrCreate: {
                        where: { node: { id: 5 } }
                        onCreate: { edge: { screentime: 105 }, node: { title: "The Terminal", id: 5 } }
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
            schema: neoSchema.schema,
            source: query,
            contextValue: { driver, driverConfig: { bookmarks: [session.lastBookmark()] } },
        });
        expect(gqlResult.errors).toBeUndefined();
        expect((gqlResult as any).data[`create${pluralize(typeActor.name)}`][`${typeActor.plural}`]).toEqual([
            {
                name: "Tom Hanks",
            },
        ]);

        const movieTitleAndId = await session.run(`
          MATCH (m:${typeMovie.name} {id: 5})
          RETURN m.title as title, m.id as id
        `);

        expect(movieTitleAndId.records).toHaveLength(1);
        expect(movieTitleAndId.records[0].toObject().title).toEqual("The Terminal");
        expect((movieTitleAndId.records[0].toObject().id as Integer).toNumber()).toEqual(5);

        const actedInRelation = await session.run(`
            MATCH (:${typeMovie.name} {id: 5})<-[r:ACTED_IN]-(:${typeActor.name} {name: "Tom Hanks"})
            RETURN r.screentime as screentime
            `);

        expect(actedInRelation.records).toHaveLength(1);
        expect((actedInRelation.records[0].toObject().screentime as Integer).toNumber()).toEqual(105);
    });

    test("ConnectOrCreate on existing node", async () => {
        const testActorName = "aRandomActor";
        await session.run(`CREATE (m:${typeMovie.name} { title: "Terminator2", id: 2222})`);
        const query = `
            mutation {
              create${pluralize(typeActor.name)}(
                input: [
                  {
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
            schema: neoSchema.schema,
            source: query,
            contextValue: { driver, driverConfig: { bookmarks: [session.lastBookmark()] } },
        });
        expect(gqlResult.errors).toBeUndefined();
        expect((gqlResult as any).data[`create${pluralize(typeActor.name)}`][`${typeActor.plural}`]).toEqual([
            {
                name: testActorName,
            },
        ]);

        const actorsWithMovieCount = await session.run(`
          MATCH (a:${typeActor.name} {name: "${testActorName}"})-[]->(m:${typeMovie.name} {id: 2222})
          RETURN COUNT(a) as count
        `);

        expect(actorsWithMovieCount.records[0].toObject().count.toInt()).toEqual(1);

        const moviesWithIdCount = await session.run(`
          MATCH (m:${typeMovie.name} {id: 2222})
          RETURN COUNT(m) as count
        `);

        expect(moviesWithIdCount.records[0].toObject().count.toInt()).toEqual(1);

        const theTerminalMovieCount = await session.run(`
          MATCH (m:${typeMovie.name} {id: 2222, name: "The Terminal"})
          RETURN COUNT(m) as count
        `);

        expect(theTerminalMovieCount.records[0].toObject().count.toInt()).toEqual(0);

        const actedInRelation = await session.run(`
            MATCH (:${typeMovie.name} {id: 2222})<-[r:ACTED_IN]-(:${typeActor.name} {name: "${testActorName}"})
            RETURN r.screentime as screentime
            `);

        expect(actedInRelation.records).toHaveLength(1);
        expect((actedInRelation.records[0].toObject().screentime as Integer).toNumber()).toEqual(105);

        const newIdMovieCount = await session.run(`
            MATCH (m:${typeMovie.name} {id: 22224})
            RETURN COUNT(m) as count
            `);
        expect(newIdMovieCount.records[0].toObject().count.toInt()).toEqual(0);
    });
});
