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
import { Driver } from "neo4j-driver";
import { validateDocument } from "../../../src/schema/validation";
import neo4j from "../neo4j";


describe("https://github.com/neo4j/graphql/issues/556", () => {
    let driver: Driver;

    beforeAll(async () => {
        driver = await neo4j();
    });

    afterAll(async () => {
        await driver.close();
    });

    test("should validate document with no errors", () => {
        const doc = gql`
            type Journalist {
                articles: [Article]! @relationship(type: "HAS_ARTICLE", direction: OUT, properties: "HasArticle" )
            }

            interface HasArticle @relationshipProperties {
                createdAt: DateTime! @timestamp
            }

            type Article {
                id: ID! @id
                blocks: [Block]! @relationship(type: "HAS_BLOCK", direction: OUT, properties: "HasBlock" )
            }

            interface HasBlock @relationshipProperties {
                order: Int!
            }

            interface Block {
                id: ID @id
            }

            type TextBlock implements Block {
                id: ID @id
                text: String
            }

            type DividerBlock implements Block {
                id: ID @id
            }
        `;

        expect(() => validateDocument(doc)).not.toThrow();
    });
});
