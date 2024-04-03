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

import { gql } from "graphql-tag";
import { generate } from "randomstring";
import type { UniqueType } from "../../utils/graphql-types";
import { TestHelper } from "../../utils/tests-helper";

describe("https://github.com/neo4j/graphql/issues/369", () => {
    const testHelper = new TestHelper();
    let Dato: UniqueType;

    beforeEach(() => {
        Dato = testHelper.createUniqueType("Dato");
    });

    afterEach(async () => {
        await testHelper.close();
    });

    test("should recreate issue and return correct data", async () => {
        const typeDefs = gql`
            type ${Dato} {
                uuid: ID
                dependeTo: [${Dato}!]! @relationship(type: "DEPENDE", direction: OUT, properties: "Depende")
                dependeFrom: [${Dato}!]! @relationship(type: "DEPENDE", direction: IN, properties: "Depende")
            }

            type Depende @relationshipProperties {
                uuid: ID
            }

            type Query {
                getDato(uuid: String): ${Dato}
                    @cypher(
                    statement: """
                    MATCH (d:${Dato} {uuid: $uuid}) RETURN d
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

        await testHelper.initNeo4jGraphQL({ typeDefs });

        const query = /* GraphQL */ `
            {
                getDato(uuid: "${datoUUID}" ){
                  uuid
                  dependeToConnection {
                    edges {
                     properties { uuid }
                      node {
                          uuid
                      }
                    }
                  }
                }
            }
        `;
        await testHelper.executeCypher(
            `
                    CREATE (:${Dato} {uuid: $datoUUID})-[:DEPENDE {uuid: $relUUID}]->(:${Dato} {uuid: $datoToUUID})
                `,
            {
                datoUUID,
                datoToUUID,
                relUUID,
            }
        );

        const result = await testHelper.executeGraphQL(query);

        expect(result.errors).toBeFalsy();

        expect(result.data as any).toEqual({
            getDato: {
                uuid: datoUUID,
                dependeToConnection: { edges: [{ properties: { uuid: relUUID }, node: { uuid: datoToUUID } }] },
            },
        });
    });

    test("should recreate issue and return correct data using a where argument on the connection", async () => {
        const typeDefs = gql`
            type ${Dato} {
                uuid: ID
                dependeTo: [${Dato}!]! @relationship(type: "DEPENDE", direction: OUT, properties: "Depende")
                dependeFrom: [${Dato}!]! @relationship(type: "DEPENDE", direction: IN, properties: "Depende")
            }

            type Depende @relationshipProperties {
                uuid: ID
            }

            type Query {
                getDato(uuid: String): ${Dato}
                    @cypher(
                        statement: """
                        MATCH (d:${Dato} {uuid: $uuid}) RETURN d
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

        await testHelper.initNeo4jGraphQL({ typeDefs });

        const query = /* GraphQL */ `
            {
                getDato(uuid: "${datoUUID}" ){
                  uuid
                  dependeToConnection(where: { node: { uuid: "${datoToUUID}" } }) {
                    edges {
                     properties{ uuid}
                      node {
                          uuid
                      }
                    }
                  }
                }
            }
        `;
        await testHelper.executeCypher(
            `
                    CREATE (d:${Dato} {uuid: $datoUUID})-[:DEPENDE {uuid: $relUUID}]->(:${Dato} {uuid: $datoToUUID})
                    CREATE (d)-[:DEPENDE {uuid: randomUUID()}]->(:Dato {uuid: randomUUID()})
                    CREATE (d)-[:DEPENDE {uuid: randomUUID()}]->(:Dato {uuid: randomUUID()})
                `,
            {
                datoUUID,
                datoToUUID,
                relUUID,
            }
        );

        const result = await testHelper.executeGraphQL(query);

        expect(result.errors).toBeFalsy();

        expect(result.data as any).toEqual({
            getDato: {
                uuid: datoUUID,
                dependeToConnection: { edges: [{ properties: { uuid: relUUID }, node: { uuid: datoToUUID } }] },
            },
        });
    });
});
