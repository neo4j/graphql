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

describe("https://github.com/neo4j/graphql/issues/847", () => {
    let personType: UniqueType;
    let placeType: UniqueType;
    let interactionType: UniqueType;

    const testHelper = new TestHelper();

    beforeAll(async () => {
        personType = testHelper.createUniqueType("Person");
        placeType = testHelper.createUniqueType("Place");
        interactionType = testHelper.createUniqueType("Interaction");

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
                id       : ID! @id @unique
                kind     : String!
                subjects : [Entity!]! @relationship(type: "ACTED_IN", direction: IN )
                objects  : [Entity!]! @relationship(type: "ACTED_IN", direction: OUT)
            }
        `;
        await testHelper.initNeo4jGraphQL({ typeDefs });
    });

    afterAll(async () => {
        await testHelper.close();
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

        const mutationRes = await testHelper.executeGraphQL(mutation);

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

        const queryRes = await testHelper.executeGraphQL(query);

        expect(queryRes.errors).toBeUndefined();

        expect(queryRes.data).toEqual({
            [interactionType.plural]: [
                {
                    id: interactionId,
                    subjects: expect.toIncludeSameMembers([
                        {
                            id: "eve",
                        },
                        {
                            id: "adam",
                        },
                    ]),
                    objects: expect.toIncludeSameMembers([
                        {
                            id: "cain",
                        },
                    ]),
                },
            ],
        });
    });
});
