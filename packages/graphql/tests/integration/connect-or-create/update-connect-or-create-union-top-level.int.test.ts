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
import { gql } from "apollo-server";
import { Driver, Session, Integer } from "neo4j-driver";
import { graphql, DocumentNode } from "graphql";
import neo4j from "../neo4j";
import { Neo4jGraphQL } from "../../../src";
import { generateUniqueType } from "../../../src/utils/test/graphql-types";
import { getQuerySource } from "../../utils";

describe("Update -> ConnectOrCreate union top level", () => {
    let driver: Driver;
    let session: Session;
    let typeDefs: DocumentNode;

    const typeMovie = generateUniqueType("Movie");
    const typeSeries = generateUniqueType("Series");
    const typeActor = generateUniqueType("Actor");

    let neoSchema: Neo4jGraphQL;

    beforeAll(async () => {
        driver = await neo4j();

        typeDefs = gql`
        type ${typeMovie.name} {
        	title: String!
        	isan: String! @unique
        }

        type ${typeSeries.name} {
            title: String!
        	isan: String! @unique
        }

        union Production = ${typeMovie.name} | ${typeSeries.name}

        interface ActedIn @relationshipProperties {
        	screentime: Int!
        }

        type ${typeActor.name} {
          name: String!
          actedIn: [Production!]! @relationship(type: "ACTED_IN", direction: OUT, properties: "ActedIn")
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

    test("ConnectOrCreate creates new nodes", async () => {
        await session.run(`CREATE (:${typeActor.name} { name: "Tom Hanks"})`);
        const movieIsan = "0000-0000-03B6-0000-O-0000-0006-P";
        const seriesIsan = "0000-0001-ECC5-0000-8-0000-0001-B";

        const query = gql`
            mutation {
                update${pluralize(typeActor.name)}(
                    update: {
                            name: "Tom Hanks"
                    },
                    connectOrCreate: {
                        actedIn: {
                            ${typeMovie.name}: {
                                where: { node: { isan: "${movieIsan}" } }
                                onCreate: {
                                    edge: { screentime: 105 }
                                    node: { title: "Forrest Gump", isan: "${movieIsan}" }
                                }
                            }
                            ${typeSeries.name}: {
                                where: { node: { isan: "${seriesIsan}" } }
                                onCreate: {
                                    edge: { screentime: 126 }
                                    node: {
                                        title: "Band of Brothers"
                                        isan: "${seriesIsan}"
                                    }
                                }
                            }
                        }
                }){
                    ${typeActor.plural} {
                        name
                    }
                }
            }
        `;

        const gqlResult = await graphql({
            schema: neoSchema.schema,
            source: getQuerySource(query),
            contextValue: { driver, driverConfig: { bookmarks: [session.lastBookmark()] } },
        });
        expect(gqlResult.errors).toBeUndefined();
        expect((gqlResult as any).data[`update${pluralize(typeActor.name)}`][`${typeActor.plural}`]).toEqual([
            {
                name: "Tom Hanks",
            },
        ]);

        const movieTitle = await session.run(`
          MATCH (m:${typeMovie.name} {isan: "${movieIsan}"})
          RETURN m.title as title
        `);

        expect(movieTitle.records).toHaveLength(1);
        expect(movieTitle.records[0].toObject().title).toEqual("Forrest Gump");

        const movieActedInRelation = await session.run(`
            MATCH (:${typeMovie.name} {isan: "${movieIsan}"})<-[r:ACTED_IN]-(:${typeActor.name} {name: "Tom Hanks"})
            RETURN r.screentime as screentime
            `);

        expect(movieActedInRelation.records).toHaveLength(1);
        expect((movieActedInRelation.records[0].toObject().screentime as Integer).toNumber()).toEqual(105);

        const seriesTitle = await session.run(`
          MATCH (m:${typeSeries.name} {isan: "${seriesIsan}"})
          RETURN m.title as title
        `);

        expect(seriesTitle.records).toHaveLength(1);
        expect(seriesTitle.records[0].toObject().title).toEqual("Band of Brothers");

        const seriesActedInRelation = await session.run(`
            MATCH (:${typeSeries.name} {isan: "${seriesIsan}"})<-[r:ACTED_IN]-(:${typeActor.name} {name: "Tom Hanks"})
            RETURN r.screentime as screentime
            `);

        expect(seriesActedInRelation.records).toHaveLength(1);
        expect((seriesActedInRelation.records[0].toObject().screentime as Integer).toNumber()).toEqual(126);
    });

    test("ConnectOrCreate on existing node", async () => {
        const movieIsan = "xx0000-0000-03B6-0000-O-0000-0006-P";
        const seriesIsan = "xx0000-0001-ECC5-0000-8-0000-0001-B";
        const actorName = "Tom Hanks evil twin";

        await session.run(`CREATE (:${typeActor.name} { name: "${actorName}"})`);
        await session.run(`CREATE (m:${typeMovie.name} { title: "Forrest Gump", isan:"${movieIsan}"})`);
        await session.run(`CREATE (m:${typeSeries.name} { title: "Band of Brothers", isan:"${seriesIsan}"})`);

        const query = gql`
            mutation {
                update${pluralize(typeActor.name)}(
                    update: {
                            name: "${actorName}"
                    },
                    connectOrCreate: {
                        actedIn: {
                            ${typeMovie.name}: {
                                where: { node: { isan: "${movieIsan}" } }
                                onCreate: {
                                    edge: { screentime: 105 }
                                    node: { title: "Forrest Gump", isan: "${movieIsan}" }
                                }
                            }
                            ${typeSeries.name}: {
                                where: { node: { isan: "${seriesIsan}" } }
                                onCreate: {
                                    edge: { screentime: 126 }
                                    node: {
                                        title: "Band of Brothers"
                                        isan: "${seriesIsan}"
                                    }
                                }
                            }
                        }
                }
                where: { name: "${actorName}"}){
                    ${typeActor.plural} {
                        name
                    }
                }
            }
        `;

        const gqlResult = await graphql({
            schema: neoSchema.schema,
            source: getQuerySource(query),
            contextValue: { driver, driverConfig: { bookmarks: [session.lastBookmark()] } },
        });
        expect(gqlResult.errors).toBeUndefined();
        expect((gqlResult as any).data[`update${pluralize(typeActor.name)}`][`${typeActor.plural}`]).toEqual([
            {
                name: actorName,
            },
        ]);

        const actorsWithMovieCount = await session.run(`
              MATCH (a:${typeActor.name} {name:"${actorName}"})-[]->(:${typeMovie.name} {isan:"${movieIsan}"})
              RETURN COUNT(a) as count
            `);

        expect(actorsWithMovieCount.records[0].toObject().count.toInt()).toEqual(1);

        const actorsWithSeriesCount = await session.run(`
              MATCH (a:${typeActor.name} {name:"${actorName}"})-[]->(:${typeSeries.name} {isan:"${seriesIsan}"})
              RETURN COUNT(a) as count
            `);

        expect(actorsWithSeriesCount.records[0].toObject().count.toInt()).toEqual(1);

        const movieActedInRelation = await session.run(`
            MATCH (:${typeMovie.name} {isan: "${movieIsan}"})<-[r:ACTED_IN]-(:${typeActor.name} {name: "${actorName}"})
            RETURN r.screentime as screentime
            `);

        expect(movieActedInRelation.records).toHaveLength(1);
        expect((movieActedInRelation.records[0].toObject().screentime as Integer).toNumber()).toEqual(105);

        const seriesActedInRelation = await session.run(`
            MATCH (:${typeSeries.name} {isan: "${seriesIsan}"})<-[r:ACTED_IN]-(:${typeActor.name} {name: "${actorName}"})
            RETURN r.screentime as screentime
            `);

        expect(seriesActedInRelation.records).toHaveLength(1);
        expect((seriesActedInRelation.records[0].toObject().screentime as Integer).toNumber()).toEqual(126);
    });
});
