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

import { DocumentNode, graphql, GraphQLSchema } from "graphql";
import { Driver, Integer, Session } from "neo4j-driver";
import { gql } from "apollo-server";
import neo4j from "../neo4j";
import { getQuerySource } from "../../utils/get-query-source";
import { Neo4jGraphQL } from "../../../src";
import { generateUniqueType } from "../../utils/graphql-types";

describe("https://github.com/neo4j/graphql/issues/976", () => {
    const testBibliographicReference = generateUniqueType("BibliographicReference");
    const testConcept = generateUniqueType("Concept");
    let schema: GraphQLSchema;
    let driver: Driver;
    let session: Session;

    async function graphqlQuery(query: DocumentNode) {
        return graphql({
            schema,
            source: getQuerySource(query),
            contextValue: {
                driver,
            },
        });
    }

    beforeAll(async () => {
        driver = await neo4j();

        const typeDefs = `
            type ${testBibliographicReference.name} @node(additionalLabels: ["Resource"]){
                iri: ID! @unique @alias(property: "uri")
                prefLabel: [String!]
                isInPublication: [${testConcept.name}!]! @relationship(type: "isInPublication", direction: OUT)
            }

            type ${testConcept.name} @node(additionalLabels: ["Resource"]){
                iri: ID! @unique @alias(property: "uri")
                prefLabel: [String!]!
            }
        `;
        const neoGraphql = new Neo4jGraphQL({ typeDefs, driver });
        schema = await neoGraphql.getSchema();
    });

    beforeEach(() => {
        session = driver.session();
    });

    afterEach(async () => {
        await session.run(`MATCH (bibRef:${testBibliographicReference.name}) DETACH DELETE bibRef`);
        await session.run(`MATCH (concept:${testConcept.name}) DETACH DELETE concept`);

        await session.close();
    });

    afterAll(async () => {
        await driver.close();
    });

    test("should query nested connection", async () => {
        const createBibRefQuery = gql`
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
        const updateBibRefQuery = gql`
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
        const createBibRefResult = await graphqlQuery(createBibRefQuery);
        expect(createBibRefResult.errors).toBeUndefined();

        const bibRefRes = await session.run(`
            MATCH (bibRef:${testBibliographicReference.name})-[r:isInPublication]->(concept:${testConcept.name}) RETURN bibRef.uri as bibRefUri, concept.uri as conceptUri
        `);

        expect(bibRefRes.records).toHaveLength(1);
        expect(bibRefRes.records[0].toObject().bibRefUri as string).toBe("urn:myiri2");
        expect(bibRefRes.records[0].toObject().conceptUri as string).toBe("new-e");

        const updateBibRefResult = await graphqlQuery(updateBibRefQuery);
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

        const conceptCount = await session.run(`
            MATCH (bibRef:${testBibliographicReference.name})-[r:isInPublication]->(concept:${testConcept.name}) RETURN bibRef.uri as bibRefUri, COUNT(concept) as conceptCount
        `);

        expect(conceptCount.records).toHaveLength(1);
        expect(conceptCount.records[0].toObject().bibRefUri as string).toBe("urn:myiri2");
        expect((conceptCount.records[0].toObject().conceptCount as Integer).toNumber()).toBe(2);
    });
});
