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

import Neo4jGraphQL from "../../src/classes/Neo4jGraphQL";

const basicTypeDefs = `
    type Journalist {
        articles: [Article!]! @relationship(type: "HAS_ARTICLE", direction: OUT, properties: "HasArticle")
    }

    interface HasArticle @relationshipProperties {
        createdAt: DateTime! @timestamp
    }

    type Article @authorization(filter: [{ where: { node: { id: "$jwt.sub" } } }]) {
        id: ID! @id @authorization(filter: [{ where: { node: { id: "$jwt.sub" } } }])
        blocks: [Block!]! @relationship(type: "HAS_BLOCK", direction: OUT, properties: "HasBlock")
        images: [Image!]! @relationship(type: "HAS_IMAGE", direction: OUT)
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

    type ImageBlock implements Block {
        id: ID @id
        images: [Image!]! @relationship(type: "HAS_IMAGE", direction: OUT)
    }

    interface Image {
        featuredIn: [Article!]
    }

    type PDFImage implements Image {
        featuredIn: [Article!]! @relationship(type: "HAS_IMAGE", direction: IN)
        url: String!
    }
`;

export async function schemaPerformance() {
    let typeDefs = "";
    const toReplace =
        /(Journalist|Article|HasArticle|Block|Image|HasBlock|TextBlock|DividerBlock|ImageBlock|PDFImage|HAS_ARTICLE|HAS_BLOCK|HAS_IMAGE)/g;

    for (let i = 0; i < 500; i++) {
        const partialTypes = basicTypeDefs.replaceAll(toReplace, `$1${i}`);
        typeDefs = typeDefs + partialTypes;
    }
    const neoSchema = new Neo4jGraphQL({
        typeDefs,
    });
    console.time("Schema Generation");
    await neoSchema.getSchema();
    console.timeEnd("Schema Generation");
}
