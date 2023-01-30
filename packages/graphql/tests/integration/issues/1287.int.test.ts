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
import { UniqueType } from "../../utils/graphql-types";

describe("https://github.com/neo4j/graphql/issues/1287", () => {
    let schema: GraphQLSchema;
    let driver: Driver;
    let session: Session;
    let neo4j: Neo4j;

    const screeningsType = new UniqueType("Screening");
    const norwegianScreenable = new UniqueType("NorwegianScreenableMeta");

    const typeDefs = `
        type ${screeningsType} {
            id: ID! @id
            title: String
            beginsAt: DateTime!
            movie: ${norwegianScreenable}! @relationship(type: "SCREENS_MOVIE", direction: OUT)
        }

        interface ScreenableMeta {
            id: ID! @id
            spokenLanguage: String!
            subtitlesLanguage: String!
            premiere: DateTime!
            locale: LocalTime!
        }

        type ${norwegianScreenable} implements ScreenableMeta {
            id: ID! @id
            spokenLanguage: String!
            subtitlesLanguage: String!
            premiere: DateTime!
            locale: LocalTime!
            ediNumber: String!
        }
    `;

    beforeAll(async () => {
        neo4j = new Neo4j();
        driver = await neo4j.getDriver();
    });

    beforeEach(async () => {
        session = await neo4j.getSession();
    });

    afterEach(async () => {
        await session.close();
    });

    afterAll(async () => {
        await driver.close();
    });

    test(`should not throw "Cannot read property 'name' of undefined"`, async () => {
        const neoGraphql = new Neo4jGraphQL({
            typeDefs,
            driver,
        });
        schema = await neoGraphql.getSchema();

        const query = `
            query queryScreenings {
                ${screeningsType.plural}(where: { movieConnection: { node: { id: "my-id" } } }) {
                    beginsAt
                    movie {
                        id
                    }
                }
            }
        `;

        const res = await graphql({
            schema,
            source: query,
            contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
        });

        expect(res.errors).toBeUndefined();
        expect(res.data).toEqual({
            [screeningsType.plural]: [],
        });
    });
});
