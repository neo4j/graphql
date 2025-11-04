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

import type { UniqueType } from "../../utils/graphql-types";
import { TestHelper } from "../../utils/tests-helper";

describe("https://github.com/neo4j/graphql/issues/1735", () => {
    let actorType: UniqueType;
    let movieType: UniqueType;

    const testHelper = new TestHelper();

    beforeAll(async () => {
        actorType = testHelper.createUniqueType("Actor");
        movieType = testHelper.createUniqueType("Movie");

        const typeDefs = `
          type MovieActorEdgeProperties @relationshipProperties {
            isLead: Boolean
          }

          type ${movieType.name} {
              dbId: ID! @id @unique @relayId @alias(property: "id")
              title: String!
              actors: [${actorType.name}!]! @relationship(type: "ACTED_IN", direction: IN, properties: "MovieActorEdgeProperties")
              leadActorsCount: Int! @cypher(statement:"""
                MATCH (this)<-[rel:ACTED_IN]-(a:${actorType.name})
                WHERE rel.isLead = true
                RETURN count(a) as result
              """, columnName: "result")
          }

          type ${actorType.name} {
              dbId: ID! @id @unique @relayId @alias(property: "id")
              name: String!
              movies: [${movieType.name}!]! @relationship(type: "ACTED_IN", direction: OUT, properties: "MovieActorEdgeProperties")
          }
  `;
        await testHelper.initNeo4jGraphQL({ typeDefs });

        const source = `
        mutation($input: [${movieType.name}CreateInput!]!) {
          ${movieType.operations.create}(input: $input) {
            ${movieType.plural} {
              id
              leadActorsCount
            }
          }
        }
      `;
        const input = [
            {
                title: "A River Runs Through It",
                actors: {
                    create: {
                        edge: { isLead: false },
                        node: { name: "River Phoenix" },
                    },
                },
            },
        ];
        await testHelper.executeGraphQL(source, {
            variableValues: { input },
        });
    });

    afterAll(async () => {
        await testHelper.close();
    });
    test("root connection queries on nodes with Cypher fields should execute without a sort argument", async () => {
        const query = `
        query {
          ${movieType.operations.connection} {
            totalCount
            edges {
              node {
                id
                leadActorsCount
              }
            }
          }
        }
      `;

        const result = await testHelper.executeGraphQL(query);

        expect(result.errors).toBeFalsy();
        expect(result?.data?.[movieType.operations.connection]).toEqual({
            totalCount: 1,
            edges: [
                {
                    node: {
                        id: expect.any(String),
                        leadActorsCount: 0,
                    },
                },
            ],
        });
    });
});
