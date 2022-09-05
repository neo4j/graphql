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

describe("https://github.com/neo4j/graphql/issues/832", () => {
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
                location: Point!
            }

            type ${Interaction} {
                id: ID! @id
                kind: String!
                subjects: [Entity!]! @relationship(type: "ACTED_IN", direction: IN)
                objects: [Entity!]! @relationship(type: "ACTED_IN", direction: OUT)
            }
        `;

        session = await neo4j.getSession();

        const neoGraphql = new Neo4jGraphQL({ typeDefs, driver, config: { enableDebug: true } });
        schema = await neoGraphql.getSchema();
    });

    afterAll(async () => {
        await session.close();
        await driver.close();
    });

    test("should not throw error when querying nested relations under a root connection field", async () => {
        const createPeople = `
            mutation {
                ${Person.operations.create}(
                    input: [
                        { id: "adam", name: "Adam" }
                        { id: "eve", name: "Eve" }
                        { id: "cain", name: "Cain" }
                        { id: "abel", name: "Abel" }
                    ]
                ) {
                    ${Person.plural} {
                        id
                    }
                }
            }
        `;

        const createPeopleResult = await graphqlQuery(createPeople);
        expect((createPeopleResult.data?.[Person.operations.create] as any)[Person.plural]).toIncludeSameMembers([
            { id: "adam" },
            { id: "eve" },
            { id: "cain" },
            { id: "abel" },
        ]);

        const createInteractions = `
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

        const createInteractionsResult = await graphqlQuery(createInteractions);
        expect((createInteractionsResult.data?.[Interaction.operations.create] as any).info.nodesCreated).toBe(2);
    });
});
