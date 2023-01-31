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

import { graphql, GraphQLSchema } from "graphql";
import type { Driver } from "neo4j-driver";
import { Neo4jGraphQL } from "../../../src";
import { UniqueType } from "../../utils/graphql-types";
import Neo4j from "../neo4j";

describe("https://github.com/neo4j/graphql/issues/1735", () => {
    const actorType = new UniqueType("Actor");
    const movieType = new UniqueType("Movie");

    let schema: GraphQLSchema;
    let driver: Driver;
    let neo4j: Neo4j;

    beforeAll(async () => {
        neo4j = new Neo4j();
        driver = await neo4j.getDriver();
        const typeDefs = `
          interface MovieActorEdgeProperties @relationshipProperties {
            isLead: Boolean
          }

          type ${movieType.name} {
              dbId: ID! @id(global: true) @alias(property: "id")
              title: String!
              actors: [${actorType.name}!]! @relationship(type: "ACTED_IN", direction: IN, properties: "MovieActorEdgeProperties")
              leadActorsCount: Int! @cypher(statement:"""
                MATCH (this)<-[rel:ACTED_IN]-(a:${actorType.name})
                WHERE rel.isLead = true
                RETURN count(a)
              """)
          }

          type ${actorType.name} {
              dbId: ID! @id(global: true) @alias(property: "id")
              name: String!
              movies: [${movieType.name}!]! @relationship(type: "ACTED_IN", direction: OUT, properties: "MovieActorEdgeProperties")
          }
  `;
        const neoGraphql = new Neo4jGraphQL({ typeDefs, driver });
        schema = await neoGraphql.getSchema();
    });

    beforeEach(async () => {
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
        await graphql({
            source,
            schema,
            contextValue: neo4j.getContextValues(),
            variableValues: { input },
        });
    });

    afterEach(async () => {
        const session = await neo4j.getSession();

        await session.run(`MATCH (a: ${actorType.name}) DETACH DELETE a`);
        await session.run(`MATCH (m: ${movieType.name}) DETACH DELETE m`);

        await session.close();
    });

    afterAll(async () => {
        await driver.close();
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

        const result = await graphql({
            schema,
            source: query,
            variableValues: {},
            contextValue: neo4j.getContextValues(),
        });

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
