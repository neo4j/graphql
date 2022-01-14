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
import { generateUniqueType } from "../../../utils/graphql-types";

describe("Nested Field Level Aggregations", () => {
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
            ${typeActor.plural}: [${typeActor.name}] @relationship(type: "ACTED_IN", direction: IN, properties:"ActedIn")
        }

        type ${typeActor.name} {
            name: String
            age: Int
            born: DateTime
            ${typeMovie.plural}: [${typeMovie.name}] @relationship(type: "ACTED_IN", direction: OUT, properties:"ActedIn")
        }

        interface ActedIn {
            screentime: Int
            character: String
        }
        `;

        neoSchema = new Neo4jGraphQL({ typeDefs });
        session = driver.session();
        await session.run(`
        CREATE (m:${typeMovie.name} { title: "Terminator"})<-[:ACTED_IN { screentime: 60, character: "Terminator" }]-(arnold:${typeActor.name} { name: "Arnold", age: 54, born: datetime('1980-07-02')})
        CREATE (m)<-[:ACTED_IN { screentime: 120, character: "Sarah" }]-(:${typeActor.name} {name: "Linda", age:37, born: datetime('2000-02-02')})
        CREATE (:${typeMovie.name} {title: "Total Recall"})<-[:ACTED_IN { screentime: 180, character: "Quaid" }]-(arnold)
        `);
    });

    afterAll(async () => {
        await session.close();
        await driver.close();
    });

    test("count actors in movies in actors", async () => {
        const query = `
        query Query {
          actors: ${typeActor.plural}(where: {name: "Arnold"}) {
            name
            movies: ${typeMovie.plural} {
              title
              actorAggregate: ${typeActor.plural}Aggregate {
                count
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
        const movies = (gqlResult.data as any)?.actors[0].movies;
        expect(movies).toHaveLength(2);
        expect(movies).toContainEqual({
            title: "Terminator",
            actorAggregate: { count: 2 },
        });
        expect(movies).toContainEqual({
            title: "Total Recall",
            actorAggregate: { count: 1 },
        });
    });
});
