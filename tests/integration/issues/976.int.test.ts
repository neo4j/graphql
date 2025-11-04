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

import { type Integer } from "neo4j-driver";
import type { UniqueType } from "../../utils/graphql-types";
import { TestHelper } from "../../utils/tests-helper";

describe("https://github.com/neo4j/graphql/issues/976", () => {
    let testBibliographicReference: UniqueType;
    let testConcept: UniqueType;
    const testHelper = new TestHelper();

    beforeAll(async () => {
        testBibliographicReference = testHelper.createUniqueType("BibliographicReference");
        testConcept = testHelper.createUniqueType("Concept");

        const typeDefs = `
            type ${testBibliographicReference.name} @node(labels: ["${testBibliographicReference.name}", "Resource"]){
                iri: ID! @unique @alias(property: "uri")
                prefLabel: [String!]
                isInPublication: [${testConcept.name}!]! @relationship(type: "isInPublication", direction: OUT)
            }

            type ${testConcept.name} @node(labels: ["${testConcept.name}", "Resource"]){
                iri: ID! @unique @alias(property: "uri")
                prefLabel: [String!]!
            }
        `;
        await testHelper.initNeo4jGraphQL({ typeDefs });
    });

    afterAll(async () => {
        await testHelper.close();
    });

    test("should query nested connection", async () => {
        const createBibRefQuery = /* GraphQL */ `
            mutation {
                ${testBibliographicReference.operations.create}(
                    input: {
                        iri: "urn:myiri2"
                        prefLabel: "Initial label"
                        isInPublication: {
                            create: { node: { iri: "new-e", prefLabel: "stuff" } }
                        }
                    }
                ) {
                    ${testBibliographicReference.plural} {
                        iri
                        prefLabel
                        isInPublication {
                            iri
                            prefLabel
                        }
                    }
                }
            }
        `;
        const updateBibRefQuery = /* GraphQL */ `
            mutation {
                ${testConcept.operations.delete}(where: { iri: "new-e" }) {
                    nodesDeleted
                }

                ${testBibliographicReference.operations.update}(
                    where: { iri: "urn:myiri2" }
                    update: {
                    prefLabel: "Updated Label"
                    isInPublication: [
                        {
                            connectOrCreate: {
                                where: { node: { iri: "new-g" } }
                                onCreate: { node: { iri: "new-g", prefLabel: "pub" } }
                            }
                        }
                        {
                            connectOrCreate: {
                                where: { node: { iri: "new-f" } }
                                onCreate: { node: { iri: "new-f", prefLabel: "pub" } }
                            }
                        }
                    ]
                    }
                ) {
                    ${testBibliographicReference.plural} {
                        iri
                        prefLabel
                        isInPublication(where: { iri_IN: ["new-f", "new-e"] }) {
                            iri
                            prefLabel
                        }
                    }
                }
            }
        `;
        const createBibRefResult = await testHelper.executeGraphQL(createBibRefQuery);
        expect(createBibRefResult.errors).toBeUndefined();

        const bibRefRes = await testHelper.executeCypher(`
            MATCH (bibRef:${testBibliographicReference.name})-[r:isInPublication]->(concept:${testConcept.name}) RETURN bibRef.uri as bibRefUri, concept.uri as conceptUri
        `);

        expect(bibRefRes.records).toHaveLength(1);
        expect(bibRefRes.records[0]?.toObject().bibRefUri as string).toBe("urn:myiri2");
        expect(bibRefRes.records[0]?.toObject().conceptUri as string).toBe("new-e");

        const updateBibRefResult = await testHelper.executeGraphQL(updateBibRefQuery);
        expect(updateBibRefResult.errors).toBeUndefined();
        expect(updateBibRefResult?.data).toEqual({
            [testConcept.operations.delete]: {
                nodesDeleted: 1,
            },
            [testBibliographicReference.operations.update]: {
                [testBibliographicReference.plural]: [
                    {
                        iri: "urn:myiri2",
                        prefLabel: ["Updated Label"],
                        isInPublication: [
                            {
                                iri: "new-f",
                                prefLabel: ["pub"],
                            },
                        ],
                    },
                ],
            },
        });

        const conceptCount = await testHelper.executeCypher(`
            MATCH (bibRef:${testBibliographicReference.name})-[r:isInPublication]->(concept:${testConcept.name}) RETURN bibRef.uri as bibRefUri, COUNT(concept) as conceptCount
        `);

        expect(conceptCount.records).toHaveLength(1);
        expect(conceptCount.records[0]?.toObject().bibRefUri as string).toBe("urn:myiri2");
        expect((conceptCount.records[0]?.toObject().conceptCount as Integer).toNumber()).toBe(2);
    });
});
