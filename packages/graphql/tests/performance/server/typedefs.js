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

export function getLargeSchema(size = 500) {
    let typeDefs = "";
    const toReplace =
        /(Journalist|Article|HasArticle|Block|Image|HasBlock|TextBlock|DividerBlock|ImageBlock|PDFImage|HAS_ARTICLE|HAS_BLOCK|HAS_IMAGE)/g;

    for (let i = 0; i < size; i++) {
        const partialTypes = basicTypeDefs.replaceAll(toReplace, `$1${i}`);
        typeDefs = typeDefs + partialTypes;
    }

    return typeDefs;
}
