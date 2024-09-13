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

import type { DocumentNode } from "graphql";
import { gql } from "graphql-tag";
import type { Integer } from "neo4j-driver";
import type { Neo4jGraphQLSubscriptionsEngine } from "../../../../src/types";
import { TestSubscriptionsEngine } from "../../../utils/TestSubscriptionsEngine";
import { TestHelper } from "../../../utils/tests-helper";

describe("Create -> ConnectOrCreate", () => {
    const testHelper = new TestHelper();
    let typeDefs: DocumentNode;
    let plugin: Neo4jGraphQLSubscriptionsEngine;

    const typeMovie = testHelper.createUniqueType("Movie");
    const typeActor = testHelper.createUniqueType("Actor");

    beforeAll(() => {
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

        type ActedIn @relationshipProperties {
            screentime: Int
        }
        `;
    });

    beforeEach(async () => {
        plugin = new TestSubscriptionsEngine();
        await testHelper.initNeo4jGraphQL({ typeDefs, features: { subscriptions: plugin } });
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

        const movieTitleAndId = await testHelper.executeCypher(`
          MATCH (m:${typeMovie.name} {id: 5})
          RETURN m.title as title, m.id as id
        `);

        expect(movieTitleAndId.records).toHaveLength(1);
        expect(movieTitleAndId.records[0]?.toObject().title).toBe("The Terminal");
        expect((movieTitleAndId.records[0]?.toObject().id as Integer).toNumber()).toBe(5);

        const actedInRelation = await testHelper.executeCypher(`
            MATCH (:${typeMovie.name} {id: 5})<-[r:ACTED_IN]-(:${typeActor.name} {name: "Tom Hanks"})
            RETURN r.screentime as screentime
            `);

        expect(actedInRelation.records).toHaveLength(1);
    });
});
