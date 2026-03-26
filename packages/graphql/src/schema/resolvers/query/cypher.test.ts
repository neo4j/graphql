/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { Attribute } from "../../../schema-model/attribute/Attribute";
import { GraphQLBuiltInScalarType, ScalarType } from "../../../schema-model/attribute/AttributeType";
import { AttributeAdapter } from "../../../schema-model/attribute/model-adapters/AttributeAdapter";
import { cypherResolver } from "./cypher";

describe("Cypher resolver", () => {
    test("should return the correct; type, args and resolve", () => {
        const attribute = new Attribute({
            name: "test",
            annotations: {},
            type: new ScalarType(GraphQLBuiltInScalarType.String, true),
            args: [],
        });
        const attributeAdapter = new AttributeAdapter(attribute);
        const result = cypherResolver({ attributeAdapter, type: "Query" });
        expect(result.type).toBe("String!");
        expect(result.resolve).toBeInstanceOf(Function);
        expect(result.args).toMatchObject({});
    });
});
