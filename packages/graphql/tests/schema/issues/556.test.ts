/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { validateSchema } from "graphql";
import { gql } from "graphql-tag";
import { Neo4jGraphQL } from "../../../src/classes";

describe("https://github.com/neo4j/graphql/issues/556", () => {
    test("should compile type defs with no errors", async () => {
        const typeDefs = gql`
            type Journalist @node {
                articles: [Article!]! @relationship(type: "HAS_ARTICLE", direction: OUT, properties: "HasArticle")
            }

            type HasArticle @relationshipProperties {
                createdAt: DateTime! @timestamp
            }

            type Article @node {
                id: ID! @id
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

        const neoSchema = new Neo4jGraphQL({ typeDefs });

        const schema = await neoSchema.getSchema();

        expect(schema).toBeDefined();

        const errors = validateSchema(schema);
        expect(errors).toEqual([]);
    });
    test("should compile empty type def with error", async () => {
        const typeDefs = `
            type Journalist {
            }

        `;

        const neoSchema = new Neo4jGraphQL({ typeDefs });

        await expect(neoSchema.getSchema()).rejects.toThrow();
    });
    test("should compile empty input with error", async () => {
        const typeDefs = `
            input JournalistInput {
            }
            type Journalist @node {
                query(input: JournalistInput): Int
            }

        `;

        const neoSchema = new Neo4jGraphQL({ typeDefs });

        await expect(neoSchema.getSchema()).rejects.toThrow();
    });
    test("should compile empty interface with error", async () => {
        const typeDefs = `
            interface Person {
            }

            type Journalist implements Person @node {
                test: Int
            }

        `;

        const neoSchema = new Neo4jGraphQL({ typeDefs });

        await expect(neoSchema.getSchema()).rejects.toThrow();
    });
});
