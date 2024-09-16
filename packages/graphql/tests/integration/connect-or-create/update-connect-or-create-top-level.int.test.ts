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

import type { Integer } from "neo4j-driver";
import { TestHelper } from "../../utils/tests-helper";

describe("Update -> ConnectOrCreate Top Level", () => {
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

    test("Update with ConnectOrCreate creates new node", async () => {
        await testHelper.executeCypher(`CREATE (:${typeActor.name} { name: "Tom Hanks"})`);

        const query = /* GraphQL */ `
            mutation {
              ${typeActor.operations.update}(
                update: {
                    name: "Tom Hanks 2"
                },
                connectOrCreate: {
                    ${typeMovie.plural}: {
                    where: { node: { id: 5 } }
                    onCreate: { edge: { screentime: 105 }, node: { title: "The Terminal", id: 5 } }
                  }
                }
                where: { name: "Tom Hanks"}
              ) {
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
                name: "Tom Hanks 2",
            },
        ]);

        const movieTitleAndId: any = await testHelper.executeCypher(`
          MATCH (m:${typeMovie.name} {id: 5})
          RETURN m.title as title, m.id as id
        `);

        expect(movieTitleAndId.records).toHaveLength(1);
        expect(movieTitleAndId.records[0].toObject().title).toBe("The Terminal");
        expect((movieTitleAndId.records[0].toObject().id as Integer).toNumber()).toBe(5);

        const actedInRelation: any = await testHelper.executeCypher(`
            MATCH (:${typeMovie.name} {id: 5})<-[r:ACTED_IN]-(:${typeActor.name} {name: "Tom Hanks 2"})
            RETURN r.screentime as screentime
            `);

        expect(actedInRelation.records).toHaveLength(1);
        expect((actedInRelation.records[0].toObject().screentime as Integer).toNumber()).toBe(105);
    });

    test("Update with ConnectOrCreate on existing node", async () => {
        const testActorName = "aRandomActor";
        const updatedActorName = "updatedActor";
        await testHelper.executeCypher(`CREATE (m:${typeMovie.name} { title: "Terminator2", id: 2222})`);
        await testHelper.executeCypher(`CREATE (:${typeActor.name} { name: "${testActorName}"})`);

        const query = /* GraphQL */ `
            mutation {
              ${typeActor.operations.update}(
                update: {
                    name: "${updatedActorName}"
                },
                connectOrCreate: {
                ${typeMovie.plural}: {
                    where: { node: { id: 2222 } }
                    onCreate: { edge: { screentime: 105 }, node: { title: "The Terminal", id: 22224 } }
                  }
              }
                where: { name: "${testActorName}"}
              ) {
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
                name: updatedActorName,
            },
        ]);

        const actorsWithMovieCount: any = await testHelper.executeCypher(`
          MATCH (a:${typeActor.name} {name: "${updatedActorName}"})-[]->(m:${typeMovie.name} {id: 2222})
          RETURN COUNT(a) as count
        `);

        expect(actorsWithMovieCount.records[0].toObject().count.toInt()).toBe(1);

        const moviesWithIdCount: any = await testHelper.executeCypher(`
          MATCH (m:${typeMovie.name} {id: 2222})
          RETURN COUNT(m) as count
        `);

        expect(moviesWithIdCount.records[0].toObject().count.toInt()).toBe(1);

        const theTerminalMovieCount: any = await testHelper.executeCypher(`
          MATCH (m:${typeMovie.name} {id: 2222, name: "The Terminal"})
          RETURN COUNT(m) as count
        `);

        expect(theTerminalMovieCount.records[0].toObject().count.toInt()).toBe(0);

        const actedInRelation: any = await testHelper.executeCypher(`
            MATCH (:${typeMovie.name} {id: 2222})<-[r:ACTED_IN]-(:${typeActor.name} {name: "${updatedActorName}"})
            RETURN r.screentime as screentime
            `);

        expect(actedInRelation.records).toHaveLength(1);
        expect((actedInRelation.records[0].toObject().screentime as Integer).toNumber()).toBe(105);

        const newIdMovieCount: any = await testHelper.executeCypher(`
            MATCH (m:${typeMovie.name} {id: 22224})
            RETURN COUNT(m) as count
            `);
        expect(newIdMovieCount.records[0].toObject().count.toInt()).toBe(0);
    });
});
