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

import { type Integer } from "neo4j-driver";
import { TestHelper } from "../../utils/tests-helper";

describe("Update -> ConnectOrCreate union top level", () => {
    const testHelper = new TestHelper();
    let typeDefs: string;

    const typeMovie = testHelper.createUniqueType("Movie");
    const typeSeries = testHelper.createUniqueType("Series");
    const typeActor = testHelper.createUniqueType("Actor");

    beforeEach(async () => {
        typeDefs = /* GraphQL */ `
        type ${typeMovie.name} {
        	title: String!
        	isan: String! @unique
        }

        type ${typeSeries.name} {
            title: String!
        	isan: String! @unique
        }

        union Production = ${typeMovie.name} | ${typeSeries.name}

        type ActedIn @relationshipProperties {
        	screentime: Int!
        }

        type ${typeActor.name} {
          name: String!
          actedIn: [Production!]! @relationship(type: "ACTED_IN", direction: OUT, properties: "ActedIn")
        }
        `;

        await testHelper.initNeo4jGraphQL({ typeDefs });
    });

    afterEach(async () => {
        await testHelper.close();
    });

    test("ConnectOrCreate creates new nodes", async () => {
        await testHelper.executeCypher(`CREATE (:${typeActor.name} { name: "Tom Hanks"})`);
        const movieIsan = "0000-0000-03B6-0000-O-0000-0006-P";
        const seriesIsan = "0000-0001-ECC5-0000-8-0000-0001-B";

        const query = /* GraphQL */ `
            mutation {
                ${typeActor.operations.update}(
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

        const gqlResult = await testHelper.executeGraphQL(query);
        expect(gqlResult.errors).toBeUndefined();
        expect((gqlResult as any).data[typeActor.operations.update][typeActor.plural]).toEqual([
            {
                name: "Tom Hanks",
            },
        ]);

        const movieTitle = await testHelper.executeCypher(`
          MATCH (m:${typeMovie.name} {isan: "${movieIsan}"})
          RETURN m.title as title
        `);

        expect(movieTitle.records).toHaveLength(1);
        expect(movieTitle.records[0]?.toObject().title).toBe("Forrest Gump");

        const movieActedInRelation = await testHelper.executeCypher(`
            MATCH (:${typeMovie.name} {isan: "${movieIsan}"})<-[r:ACTED_IN]-(:${typeActor.name} {name: "Tom Hanks"})
            RETURN r.screentime as screentime
            `);

        expect(movieActedInRelation.records).toHaveLength(1);
        expect((movieActedInRelation.records[0]?.toObject().screentime as Integer).toNumber()).toBe(105);

        const seriesTitle = await testHelper.executeCypher(`
          MATCH (m:${typeSeries.name} {isan: "${seriesIsan}"})
          RETURN m.title as title
        `);

        expect(seriesTitle.records).toHaveLength(1);
        expect(seriesTitle.records[0]?.toObject().title).toBe("Band of Brothers");

        const seriesActedInRelation = await testHelper.executeCypher(`
            MATCH (:${typeSeries.name} {isan: "${seriesIsan}"})<-[r:ACTED_IN]-(:${typeActor.name} {name: "Tom Hanks"})
            RETURN r.screentime as screentime
            `);

        expect(seriesActedInRelation.records).toHaveLength(1);
        expect((seriesActedInRelation.records[0]?.toObject().screentime as Integer).toNumber()).toBe(126);
    });

    test("ConnectOrCreate on existing node", async () => {
        const movieIsan = "xx0000-0000-03B6-0000-O-0000-0006-P";
        const seriesIsan = "xx0000-0001-ECC5-0000-8-0000-0001-B";
        const actorName = "Tom Hanks evil twin";

        await testHelper.executeCypher(`CREATE (:${typeActor.name} { name: "${actorName}"})`);
        await testHelper.executeCypher(`CREATE (m:${typeMovie.name} { title: "Forrest Gump", isan:"${movieIsan}"})`);
        await testHelper.executeCypher(
            `CREATE (m:${typeSeries.name} { title: "Band of Brothers", isan:"${seriesIsan}"})`
        );

        const query = /* GraphQL */ `
            mutation {
                ${typeActor.operations.update}(
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

        const gqlResult = await testHelper.executeGraphQL(query);
        expect(gqlResult.errors).toBeUndefined();
        expect((gqlResult as any).data[typeActor.operations.update][typeActor.plural]).toEqual([
            {
                name: actorName,
            },
        ]);

        const actorsWithMovieCount = await testHelper.executeCypher(`
              MATCH (a:${typeActor.name} {name:"${actorName}"})-[]->(:${typeMovie.name} {isan:"${movieIsan}"})
              RETURN COUNT(a) as count
            `);

        expect(actorsWithMovieCount.records[0]?.toObject().count.toInt()).toBe(1);

        const actorsWithSeriesCount = await testHelper.executeCypher(`
              MATCH (a:${typeActor.name} {name:"${actorName}"})-[]->(:${typeSeries.name} {isan:"${seriesIsan}"})
              RETURN COUNT(a) as count
            `);

        expect(actorsWithSeriesCount.records[0]?.toObject().count.toInt()).toBe(1);

        const movieActedInRelation = await testHelper.executeCypher(`
            MATCH (:${typeMovie.name} {isan: "${movieIsan}"})<-[r:ACTED_IN]-(:${typeActor.name} {name: "${actorName}"})
            RETURN r.screentime as screentime
            `);

        expect(movieActedInRelation.records).toHaveLength(1);
        expect((movieActedInRelation.records[0]?.toObject().screentime as Integer).toNumber()).toBe(105);

        const seriesActedInRelation = await testHelper.executeCypher(`
            MATCH (:${typeSeries.name} {isan: "${seriesIsan}"})<-[r:ACTED_IN]-(:${typeActor.name} {name: "${actorName}"})
            RETURN r.screentime as screentime
            `);

        expect(seriesActedInRelation.records).toHaveLength(1);
        expect((seriesActedInRelation.records[0]?.toObject().screentime as Integer).toNumber()).toBe(126);
    });
});
