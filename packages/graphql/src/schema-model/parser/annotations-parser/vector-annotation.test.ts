/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { Kind, type DirectiveNode, type ObjectFieldNode } from "graphql";
import { parseVectorAnnotation } from "./vector-annotation";

function buildVectorDirective(extraIndexFields: ObjectFieldNode[] = []): DirectiveNode {
    return {
        kind: Kind.DIRECTIVE,
        name: { kind: Kind.NAME, value: "vector" },
        arguments: [
            {
                kind: Kind.ARGUMENT,
                name: { kind: Kind.NAME, value: "indexes" },
                value: {
                    kind: Kind.LIST,
                    values: [
                        {
                            kind: Kind.OBJECT,
                            fields: [
                                {
                                    kind: Kind.OBJECT_FIELD,
                                    name: { kind: Kind.NAME, value: "indexName" },
                                    value: { kind: Kind.STRING, value: "ProductName" },
                                },
                                {
                                    kind: Kind.OBJECT_FIELD,
                                    name: { kind: Kind.NAME, value: "embeddingProperty" },
                                    value: { kind: Kind.STRING, value: "name" },
                                },
                                {
                                    kind: Kind.OBJECT_FIELD,
                                    name: { kind: Kind.NAME, value: "queryName" },
                                    value: { kind: Kind.STRING, value: "myQueryName" },
                                },
                                {
                                    kind: Kind.OBJECT_FIELD,
                                    name: { kind: Kind.NAME, value: "provider" },
                                    value: { kind: Kind.ENUM, value: "OPEN_AI" },
                                },
                                ...extraIndexFields,
                            ],
                        },
                    ],
                },
            },
        ],
    };
}

describe("parseVectorAnnotation", () => {
    it("should parse correctly", () => {
        const vectorAnnotation = parseVectorAnnotation(buildVectorDirective());
        expect(vectorAnnotation).toEqual({
            name: "vector",
            indexes: [
                {
                    indexName: "ProductName",
                    embeddingProperty: "name",
                    queryName: "myQueryName",
                    provider: "OpenAI",
                },
            ],
        });
        expect(vectorAnnotation.indexes[0]?.maxPhraseLength).toBeUndefined();
    });

    it("should parse maxPhraseLength into the index when set", () => {
        const vectorAnnotation = parseVectorAnnotation(
            buildVectorDirective([
                {
                    kind: Kind.OBJECT_FIELD,
                    name: { kind: Kind.NAME, value: "maxPhraseLength" },
                    value: { kind: Kind.INT, value: "100" },
                },
            ])
        );
        expect(vectorAnnotation.indexes).toEqual([
            {
                indexName: "ProductName",
                embeddingProperty: "name",
                queryName: "myQueryName",
                provider: "OpenAI",
                maxPhraseLength: 100,
            },
        ]);
    });
});
