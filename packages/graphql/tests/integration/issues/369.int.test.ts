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

import type { Driver } from "neo4j-driver";
import { graphql } from "graphql";
import { gql } from "graphql-tag";
import { generate } from "randomstring";
import Neo4j from "../neo4j";
import { Neo4jGraphQL } from "../../../src/classes";

describe("369", () => {
    let driver: Driver;
    let neo4j: Neo4j;

    beforeAll(async () => {
        neo4j = new Neo4j();
        driver = await neo4j.getDriver();
    });

    afterAll(async () => {
        await driver.close();
    });

    test("should recreate issue and return correct data", async () => {
        const session = await neo4j.getSession();

        const typeDefs = gql`
            type Dato {
                uuid: ID
                dependeTo: [Dato!]! @relationship(type: "DEPENDE", direction: OUT, properties: "Depende")
                dependeFrom: [Dato!]! @relationship(type: "DEPENDE", direction: IN, properties: "Depende")
            }

            interface Depende @relationshipProperties {
                uuid: ID
            }

            type Query {
                getDato(uuid: String): Dato
                    @cypher(
                        statement: """
                        MATCH (d:Dato {uuid: $uuid}) RETURN d
                        """
                        columnName: "d"
                    )
            }
        `;

        const datoUUID = generate({
            charset: "alphabetic",
        });

        const datoToUUID = generate({
            charset: "alphabetic",
        });

        const relUUID = generate({
            charset: "alphabetic",
        });

        const neoSchema = new Neo4jGraphQL({ typeDefs });

        const query = `
            {
                getDato(uuid: "${datoUUID}" ){
                  uuid
                  dependeToConnection {
                    edges {
                      uuid
                      node {
                          uuid
                      }
                    }
                  }
                }
            }
        `;
        try {
            await session.run(
                `
                    CREATE (:Dato {uuid: $datoUUID})-[:DEPENDE {uuid: $relUUID}]->(:Dato {uuid: $datoToUUID})
                `,
                {
                    datoUUID,
                    datoToUUID,
                    relUUID,
                }
            );

            const result = await graphql({
                schema: await neoSchema.getSchema(),
                source: query,
                contextValue: neo4j.getContextValues(),
            });

            expect(result.errors).toBeFalsy();

            expect(result.data as any).toEqual({
                getDato: {
                    uuid: datoUUID,
                    dependeToConnection: { edges: [{ uuid: relUUID, node: { uuid: datoToUUID } }] },
                },
            });
        } finally {
            await session.close();
        }
    });

    test("should recreate issue and return correct data using a where argument on the connection", async () => {
        const session = await neo4j.getSession();

        const typeDefs = gql`
            type Dato {
                uuid: ID
                dependeTo: [Dato!]! @relationship(type: "DEPENDE", direction: OUT, properties: "Depende")
                dependeFrom: [Dato!]! @relationship(type: "DEPENDE", direction: IN, properties: "Depende")
            }

            interface Depende @relationshipProperties {
                uuid: ID
            }

            type Query {
                getDato(uuid: String): Dato
                    @cypher(
                        statement: """
                        MATCH (d:Dato {uuid: $uuid}) RETURN d
                        """
                        columnName: "d"
                    )
            }
        `;

        const datoUUID = generate({
            charset: "alphabetic",
        });

        const datoToUUID = generate({
            charset: "alphabetic",
        });

        const relUUID = generate({
            charset: "alphabetic",
        });

        const neoSchema = new Neo4jGraphQL({ typeDefs });

        const query = `
            {
                getDato(uuid: "${datoUUID}" ){
                  uuid
                  dependeToConnection(where: { node: { uuid: "${datoToUUID}" } }) {
                    edges {
                      uuid
                      node {
                          uuid
                      }
                    }
                  }
                }
            }
        `;
        try {
            await session.run(
                `
                    CREATE (d:Dato {uuid: $datoUUID})-[:DEPENDE {uuid: $relUUID}]->(:Dato {uuid: $datoToUUID})
                    CREATE (d)-[:DEPENDE {uuid: randomUUID()}]->(:Dato {uuid: randomUUID()})
                    CREATE (d)-[:DEPENDE {uuid: randomUUID()}]->(:Dato {uuid: randomUUID()})
                `,
                {
                    datoUUID,
                    datoToUUID,
                    relUUID,
                }
            );

            const result = await graphql({
                schema: await neoSchema.getSchema(),
                source: query,
                contextValue: neo4j.getContextValues(),
            });

            expect(result.errors).toBeFalsy();

            expect(result.data as any).toEqual({
                getDato: {
                    uuid: datoUUID,
                    dependeToConnection: { edges: [{ uuid: relUUID, node: { uuid: datoToUUID } }] },
                },
            });
        } finally {
            await session.close();
        }
    });
});
