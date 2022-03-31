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

import { gql } from "apollo-server";
import { DocumentNode, graphql } from "graphql";
import { Driver, Integer, Session } from "neo4j-driver";
import neo4j from "../../neo4j";
import { Neo4jGraphQL } from "../../../../src";
import { getQuerySource } from "../../../utils/get-query-source";
import { generateUniqueType } from "../../../utils/graphql-types";
import { Neo4jGraphQLSubscriptionsPlugin } from "../../../../src/types";
import { TestSubscriptionsPlugin } from "../../../utils/TestSubscriptionPlugin";

describe("Create -> ConnectOrCreate", () => {
    let driver: Driver;
    let session: Session;
    let typeDefs: DocumentNode;
    let plugin: Neo4jGraphQLSubscriptionsPlugin;

    const typeMovie = generateUniqueType("Movie");
    const typeActor = generateUniqueType("Actor");

    let neoSchema: Neo4jGraphQL;

    beforeAll(async () => {
        driver = await neo4j();

        typeDefs = gql`
        type ${typeMovie.name} {
            title: String!
            id: Int! @unique
            ${typeActor.plural}: [${typeActor.name}!]! @relationship(type: "ACTED_IN", direction: IN, properties:"ActedIn")
        }

        type ${typeActor.name} {
            name: String
            ${typeMovie.plural}: [${typeMovie.name}!]! @relationship(type: "ACTED_IN", direction: OUT, properties:"ActedIn")
        }

        interface ActedIn {
            screentime: Int
        }
        `;
    });

    beforeEach(() => {
        session = driver.session();
        plugin = new TestSubscriptionsPlugin();
        neoSchema = new Neo4jGraphQL({ typeDefs, plugins: { subscriptions: plugin } });
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
            contextValue: { driver, driverConfig: { bookmarks: [session.lastBookmark()] } },
        });
        expect(gqlResult.errors).toBeUndefined();
        expect((gqlResult as any).data[typeActor.operations.create][`${typeActor.plural}`]).toEqual([
            {
                name: "Tom Hanks",
            },
        ]);

        const movieTitleAndId = await session.run(`
          MATCH (m:${typeMovie.name} {id: 5})
          RETURN m.title as title, m.id as id
        `);

        expect(movieTitleAndId.records).toHaveLength(1);
        expect(movieTitleAndId.records[0].toObject().title).toBe("The Terminal");
        expect((movieTitleAndId.records[0].toObject().id as Integer).toNumber()).toBe(5);

        const actedInRelation = await session.run(`
            MATCH (:${typeMovie.name} {id: 5})<-[r:ACTED_IN]-(:${typeActor.name} {name: "Tom Hanks"})
            RETURN r.screentime as screentime
            `);

        expect(actedInRelation.records).toHaveLength(1);
    });
});
