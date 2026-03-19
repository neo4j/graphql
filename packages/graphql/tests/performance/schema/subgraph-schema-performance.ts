/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import Neo4jGraphQL from "../../../src/classes/Neo4jGraphQL";

const basicTypeDefs = /* GraphQL */ `
    extend schema @link(url: "https://specs.apollo.dev/federation/v2.0", import: ["@key"])

    type Journalist @node {
        articles: [Article!]! @relationship(type: "HAS_ARTICLE", direction: OUT, properties: "HasArticle")
    }

    type HasArticle @relationshipProperties {
        createdAt: DateTime! @timestamp
    }

    type Article @authorization(filter: [{ where: { node: { id: { eq: "$jwt.sub" } } } }]) @node {
        id: ID! @id @authorization(filter: [{ where: { node: { id: { eq: "$jwt.sub" } } } }])
        blocks: [Block!]! @relationship(type: "HAS_BLOCK", direction: OUT, properties: "HasBlock")
        images: [Image!]! @relationship(type: "HAS_IMAGE", direction: OUT)
    }

    type HasBlock @relationshipProperties {
        order: Int!
    }

    interface Block {
        id: ID
    }

    type TextBlock implements Block @node {
        id: ID @id
        text: String
    }

    type DividerBlock implements Block @node {
        id: ID @id
    }

    type ImageBlock implements Block @node {
        id: ID @id
        images: [Image!]! @relationship(type: "HAS_IMAGE", direction: OUT)
    }

    interface Image {
        featuredIn: [Article!]
    }

    type PDFImage implements Image @node {
        featuredIn: [Article!]! @relationship(type: "HAS_IMAGE", direction: IN)
        url: String!
    }
`;

export async function subgraphSchemaPerformance() {
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
    console.time("Subgraph Schema Generation");
    await neoSchema.getSubgraphSchema();
    console.timeEnd("Subgraph Schema Generation");
}
