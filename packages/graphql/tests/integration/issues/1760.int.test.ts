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
import type { GraphQLSchema } from "graphql";
import { graphql } from "graphql";
import type { Driver } from "neo4j-driver";
import { getQuerySource } from "../../utils/get-query-source";
import { Neo4jGraphQL } from "../../../src";
import Neo4j from "../neo4j";

describe("https://github.com/neo4j/graphql/issues/1760", () => {
    let schema: GraphQLSchema;
    let driver: Driver;
    let neo4j: Neo4j;

    beforeAll(async () => {
        neo4j = new Neo4j();
        driver = await neo4j.getDriver();
        const typeDefs = gql`
            interface BusinessObject {
                id: ID! @id(autogenerate: false)
                nameDetails: NameDetails
            }

            type ApplicationVariant implements BusinessObject
                @auth(rules: [{ isAuthenticated: true, roles: ["ALL"] }])
                @exclude(operations: [CREATE, UPDATE, DELETE]) {
                markets: [Market!]! @relationship(type: "HAS_MARKETS", direction: OUT)
                id: ID! @id(autogenerate: false)
                relatedId: ID @cypher(statement: "MATCH (this)<-[:HAS_BASE]-(n:BaseObject) RETURN n.id")
                baseObject: BaseObject! @relationship(type: "HAS_BASE", direction: IN)
                current: Boolean!
                nameDetails: NameDetails @relationship(type: "HAS_NAME", direction: OUT)
            }

            type NameDetails
                @auth(rules: [{ isAuthenticated: true, roles: ["ALL"] }])
                @exclude(operations: [CREATE, READ, UPDATE, DELETE]) {
                fullName: String!
            }

            type Market implements BusinessObject
                @auth(rules: [{ isAuthenticated: true, roles: ["ALL"] }])
                @exclude(operations: [CREATE, UPDATE, DELETE]) {
                id: ID! @id(autogenerate: false)
                nameDetails: NameDetails @relationship(type: "HAS_NAME", direction: OUT)
            }

            type BaseObject
                @auth(rules: [{ isAuthenticated: true, roles: ["ALL"] }])
                @exclude(operations: [CREATE, UPDATE, DELETE]) {
                id: ID! @id
            }
        `;
        const neoGraphql = new Neo4jGraphQL({ typeDefs, driver });
        schema = await neoGraphql.getSchema();
    });

    afterAll(async () => {
        await driver.close();
    });

    test("provided query does not result in an error", async () => {
        const query = gql`
            query getApplicationVariants($where: ApplicationVariantWhere, $options: ApplicationVariantOptions) {
                applicationVariants(where: $where, options: $options) {
                    relatedId
                    nameDetailsConnection {
                        edges {
                            node {
                                fullName
                            }
                        }
                    }
                    marketsConnection {
                        edges {
                            node {
                                nameDetailsConnection {
                                    edges {
                                        node {
                                            fullName
                                        }
                                    }
                                }
                            }
                        }
                    }
                    baseObjectConnection {
                        edges {
                            node {
                                id
                            }
                        }
                    }
                }
            }
        `;

        const result = await graphql({
            schema,
            source: getQuerySource(query),
            variableValues: {
                where: {
                    current: true,
                },
                options: {
                    sort: {
                        relatedId: "ASC",
                    },
                    offset: 0,
                    limit: 50,
                },
            },
            contextValue: neo4j.getContextValues(),
        });

        expect(result.errors).toBeFalsy();
    });
});
