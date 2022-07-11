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

import { graphql } from "graphql";
import { Driver } from "neo4j-driver";
import neo4j from "../neo4j";
import { Neo4jGraphQL } from "../../../src";
import { generateUniqueType } from "../../utils/graphql-types";

describe("https://github.com/neo4j/graphql/issues/1735", () => {
    let driver: Driver;
    let neoSchema: Neo4jGraphQL;

    const testMovie = generateUniqueType("Movie");
    const testActor = generateUniqueType("Actor");

    const typeDefs = `
    interface MovieActorEdgeProperties @relationshipProperties {
      isLead: Boolean
    }

    type ${testMovie.name} {
        dbId: ID! @id(global: true) @alias(property: "id")
        title: String!
        actors: [${testActor.name}!]! @relationship(type: "ACTED_IN", direction: IN, properties: "MovieActorEdgeProperties")
        leadActorsCount: Int! @cypher(statement:"""
          MATCH (this)<-[rel:ACTED_IN]-(a:${testActor.name})
          WHERE rel.isLead = true
          RETURN count(a)
        """)
    }

    type ${testActor.name} {
        dbId: ID! @id(global: true) @alias(property: "id")
        name: String!
        movies: [${testMovie.name}!]! @relationship(type: "ACTED_IN", direction: OUT, properties: "MovieActorEdgeProperties")
    }
  `;
    beforeAll(async () => {
        driver = await neo4j();
        neoSchema = new Neo4jGraphQL({ typeDefs, driver });
        await neoSchema.checkNeo4jCompat();
    });
    afterAll(async () => {
        await driver.close();
    });
    test("root connection queries on nodes with Cypher fields should execute without a sort argument", async () => {
        const session = driver.session();

        const mutation = `
        mutation($input: [${testMovie.name}CreateInput!]!) {
          ${testMovie.operations.create}(input: $input) {
            ${testMovie.plural} {
              id
              leadActorsCount
            }
          }
        }
      `;
        const mutationVars = {
            input: [
                {
                    title: "A River Runs Through It",
                    actors: {
                        create: {
                            edge: { isLead: false },
                            node: { name: "River Phoenix" },
                        },
                    },
                },
            ],
        };

        const query = `
        query {
          ${testMovie.operations.connection} {
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

        try {
            const schema = await neoSchema.getSchema();
            await graphql({
                schema,
                source: mutation,
                variableValues: mutationVars,
                contextValue: { driver },
            });

            const result = await graphql({
                schema,
                source: query,
                variableValues: {},
                contextValue: { driver },
            });

            expect(result.errors).toBeFalsy();
            expect(result?.data?.[testMovie.operations.connection]).toEqual({
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
        } finally {
            await session.close();
        }
    });
});
