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

import type { GraphQLSchema } from "graphql";
import { graphql } from "graphql";
import type { Driver, Session } from "neo4j-driver";
import Neo4j from "../neo4j";
import { Neo4jGraphQL } from "../../../src";
import { generateUniqueType } from "../../utils/graphql-types";

describe("Projecting interface relationships following create of multiple nodes", () => {
    let schema: GraphQLSchema;
    let neo4j: Neo4j;
    let driver: Driver;
    let session: Session;

    const Person = generateUniqueType("Person");
    const Place = generateUniqueType("Place");
    const Interaction = generateUniqueType("Interaction");

    async function graphqlQuery(query: string) {
        return graphql({
            schema,
            source: query,
            contextValue: neo4j.getContextValues(),
        });
    }

    beforeAll(async () => {
        neo4j = new Neo4j();
        driver = await neo4j.getDriver();

        const typeDefs = `
            interface Entity {
                id: String!
            }

            type ${Person} implements Entity {
                id: String! @unique
                name: String!
            }

            type ${Place} implements Entity {
                id: String! @unique
                name: String!
            }

            type ${Interaction} {
                id: ID! @id
                kind: String!
                subjects: [Entity!]! @relationship(type: "ACTED_IN", direction: IN)
                objects: [Entity!]! @relationship(type: "ACTED_IN", direction: OUT)
            }
        `;

        session = await neo4j.getSession();

        const neoGraphql = new Neo4jGraphQL({ typeDefs, driver });
        schema = await neoGraphql.getSchema();
    });

    beforeEach(async () => {
        await session.run(`
            CREATE (:${Person.name} { id: "adam", name: "Adam" })
            CREATE (:${Person.name} { id: "eve", name: "Eve" })
            CREATE (:${Person.name} { id: "cain", name: "Cain" })
            CREATE (:${Person.name} { id: "abel", name: "Abel" })
        `);
    });

    afterEach(async () => {
        await session.run(`
            MATCH (p:${Person.name})
            DETACH DELETE p
        `);
        await session.run(`
            MATCH (i:${Interaction.name})
            DETACH DELETE i
        `);
    });

    afterAll(async () => {
        await session.close();
        await driver.close();
    });

    test("should not throw error", async () => {
        const mutation = `
            mutation {
                ${Interaction.operations.create}(
                    input: [
                        {
                            subjects: { connect: { where: { node: { id_IN: ["adam", "eve"] } } } }
                            kind: "PARENT_OF"
                            objects: { connect: { where: { node: { id_IN: ["cain"] } } } }
                        }
                        {
                            subjects: { connect: { where: { node: { id_IN: ["adam", "eve"] } } } }
                            kind: "PARENT_OF"
                            objects: { connect: { where: { node: { id_IN: ["abel"] } } } }
                        }
                    ]
                ) {
                    info {
                        nodesCreated
                    }
                    ${Interaction.plural} {
                        id
                        subjects {
                            id
                        }
                        objects {
                            id
                        }
                    }
                }
            }
        `;

        const mutationResult = await graphqlQuery(mutation);
        expect(mutationResult.errors).toBeUndefined();
    });
});
