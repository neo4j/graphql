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
import { Driver } from "neo4j-driver";
import neo4j from "../neo4j";
import { Neo4jGraphQL } from "../../../src";
import { generateUniqueType } from "../../utils/graphql-types";

describe("https://github.com/neo4j/graphql/issues/847", () => {
    const personType = generateUniqueType("Person");
    const placeType = generateUniqueType("Place");
    const interactionType = generateUniqueType("Interaction");

    let schema: GraphQLSchema;
    let driver: Driver;

    beforeAll(async () => {
        driver = await neo4j();

        const typeDefs = `
            interface Entity {
                id: String!
            }
            
            type ${personType.name} implements Entity {
                id   : String! @unique
                name : String!
            }

            type ${placeType.name} implements Entity {
                id: String! @unique
                location: Point!
            }
            
            type ${interactionType.name}  {
                id       : ID! @id
                kind     : String!
                subjects : [Entity!]! @relationship(type: "ACTED_IN", direction: IN )
                objects  : [Entity!]! @relationship(type: "ACTED_IN", direction: OUT)
            }
        `;
        const neoGraphql = new Neo4jGraphQL({ typeDefs, driver });
        schema = await neoGraphql.getSchema();
    });

    afterAll(async () => {
        const session = driver.session();
        await session.run(`MATCH (person:${personType.name}) DETACH DELETE person`);
        await session.run(`MATCH (place:${placeType.name}) DETACH DELETE place`);
        await session.run(`MATCH (interaction:${interactionType.name}) DETACH DELETE interaction`);

        await driver.close();
    });

    test("should be able to query multiple interface relations", async () => {
        const mutation = `
            mutation {
                ${personType.operations.create}(input: [
                    { id: "adam", name: "Adam" },
                    { id: "eve",  name: "Eve" },
                    { id: "cain", name: "Cain"},
                ]) {
                    ${personType.plural} {
                        id
                    }
                }
                ${interactionType.operations.create}(input: [{
                    subjects : { connect: { where: { node: { id_IN: ["adam", "eve"] }}}},
                    kind     : "PARENT_OF",
                    objects  : { connect: { where: { node: { id_IN: ["cain"] }}}}
                }]) {
                    info {
                        nodesCreated
                    }
                    ${interactionType.plural} {
                        id
                    }
                }
            }
        `;

        const mutationRes = await graphql({
            schema,
            source: mutation,
            contextValue: {
                driver,
            },
        });

        expect(mutationRes.errors).toBeUndefined();

        expect((mutationRes.data as any)[personType.operations.create]).toEqual({
            [personType.plural]: [
                {
                    id: "adam",
                },
                {
                    id: "eve",
                },
                {
                    id: "cain",
                },
            ],
        });
        expect((mutationRes.data as any)[interactionType.operations.create].info).toEqual({
            nodesCreated: 1,
        });
        const interactionId = (mutationRes.data as any)?.[interactionType.operations.create][interactionType.plural][0]
            .id;
        expect(interactionId).toBeDefined();

        const query = `
            query {
                ${interactionType.plural} {
                    id
                    subjects { id }
                    objects { id }
                }
            }
        `;

        const queryRes = await graphql({
            schema,
            source: query,
            contextValue: {
                driver,
            },
        });

        expect(queryRes.errors).toBeUndefined();

        expect(queryRes.data).toEqual({
            [interactionType.plural]: [
                {
                    id: interactionId,
                    subjects: expect.arrayContaining([
                        {
                            id: "eve",
                        },
                        {
                            id: "adam",
                        },
                    ]),
                    objects: expect.arrayContaining([
                        {
                            id: "cain",
                        },
                    ]),
                },
            ],
        });
    });
});
