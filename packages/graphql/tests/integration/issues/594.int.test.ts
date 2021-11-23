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

import { gql } from "apollo-server";
import { graphql } from "graphql";
import { Driver, Session } from "neo4j-driver";
import neo4j from "../neo4j";
import { generateUniqueType } from "../../../src/utils/test/graphql-types";
import { Neo4jGraphQL } from "../../../src";

describe("https://github.com/neo4j/graphql/issues/594", () => {
    let driver: Driver;
    let session: Session;
    let neoSchema: Neo4jGraphQL;

    const typeMovie = generateUniqueType("Movie");
    const typePerson = generateUniqueType("Person");

    beforeAll(async () => {
        driver = await neo4j();
        const typeDefs = gql`
            type ${typeMovie.name} {
                title: String!
                actors: [${typePerson.name}] @relationship(type: "ACTED_IN", direction: IN)
            }

            type ${typePerson.name} {
                name: String!
                nickname: String
                surname: String
            }
        `;

        neoSchema = new Neo4jGraphQL({ typeDefs });
        try {
            session = driver.session();
            await session.run(`CREATE (:${typeMovie.name} {title: "Cool Movie"})<-[:ACTED_IN]-(:${typePerson.name} {name: "Some Name", nickname: "SName"})
                CREATE (:${typeMovie.name} {title: "Super Cool Movie"})<-[:ACTED_IN]-(:${typePerson.name} {name: "Super Cool Some Name"})`);
        } finally {
            await session.close();
        }
    });

    beforeEach(() => {
        session = driver.session();
    });

    afterEach(async () => {
        await session.close();
    });

    afterAll(async () => {
        await driver.close();
    });

    test("should support nullable fields in field aggregations", async () => {
        const query = `
            query {
                ${typeMovie.plural} {
                    actorsAggregate {
                        node {
                            nickname {
                                shortest
                            }
                        }
                    }
                }
            }
        `;

        const gqlResult: any = await graphql({
            schema: neoSchema.schema,
            source: query,
            contextValue: { driver, driverConfig: { bookmarks: [session.lastBookmark()] } },
        });

        expect(gqlResult.errors).toBeUndefined();
        expect(gqlResult.data[typeMovie.plural]).toHaveLength(2);
        expect(gqlResult.data[typeMovie.plural]).toEqual([
            { actorsAggregate: { node: { nickname: { shortest: "SName" } } } },
            { actorsAggregate: { node: { nickname: { shortest: null } } } },
        ]);
    });

    test("should support nullable fields in aggregations", async () => {
        const query = `
            query {
                ${typePerson.plural}Aggregate {
                    surname {
                        shortest
                    }
                }
            }
        `;

        const gqlResult: any = await graphql({
            schema: neoSchema.schema,
            source: query,
            contextValue: { driver, driverConfig: { bookmarks: [session.lastBookmark()] } },
        });

        expect(gqlResult.errors).toBeUndefined();
        expect(gqlResult.data[`${typePerson.plural}Aggregate`]).toEqual({ surname: { shortest: null } });
    });
});
