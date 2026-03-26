/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { Attribute } from "./Attribute";
import { GraphQLBuiltInScalarType, ScalarType } from "./AttributeType";

describe("Attribute", () => {
    test("should clone attribute", () => {
        const attribute = new Attribute({
            name: "test",
            annotations: {},
            type: new ScalarType(GraphQLBuiltInScalarType.String, true),
            args: [],
        });
        const clone = attribute.clone();
        expect(attribute).toStrictEqual(clone);
    });
});
