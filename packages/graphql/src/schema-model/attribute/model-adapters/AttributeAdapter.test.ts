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

import { CypherAnnotation } from "../../annotation/CypherAnnotation";
import { UniqueAnnotation } from "../../annotation/UniqueAnnotation";
import { Attribute } from "../Attribute";
import {
    EnumType,
    GraphQLBuiltInScalarType,
    InterfaceType,
    ListType,
    Neo4jCartesianPointType,
    Neo4jGraphQLNumberType,
    Neo4jGraphQLTemporalType,
    Neo4jPointType,
    ObjectType,
    ScalarType,
    UnionType,
    UserScalarType,
} from "../AttributeType";
import { AttributeAdapter } from "./AttributeAdapter";

describe("Attribute", () => {
    describe("type assertions", () => {
        test("getTypePrettyName String", () => {
            const attribute = new AttributeAdapter(
                new Attribute({
                    name: "test",
                    annotations: [],
                    type: new ScalarType(GraphQLBuiltInScalarType.String, false),
                    args: [],
                })
            );

            expect(attribute.getTypePrettyName()).toBe("String");
        });
        test("getTypePrettyName required String", () => {
            const attribute = new AttributeAdapter(
                new Attribute({
                    name: "test",
                    annotations: [],
                    type: new ScalarType(GraphQLBuiltInScalarType.String, true),
                    args: [],
                })
            );

            expect(attribute.getTypePrettyName()).toBe("String!");
        });
        test("getTypePrettyName required String, required List", () => {
            const attribute = new AttributeAdapter(
                new Attribute({
                    name: "test",
                    annotations: [],
                    type: new ListType(new ScalarType(GraphQLBuiltInScalarType.String, true), true),
                    args: [],
                })
            );

            expect(attribute.getTypePrettyName()).toBe("[String!]!");
        });
        test("getTypePrettyName non-required String, required List", () => {
            const attribute = new AttributeAdapter(
                new Attribute({
                    name: "test",
                    annotations: [],
                    type: new ListType(new ScalarType(GraphQLBuiltInScalarType.String, false), true),
                    args: [],
                })
            );

            expect(attribute.getTypePrettyName()).toBe("[String]!");
        });
        test("isID", () => {
            const attribute = new AttributeAdapter(
                new Attribute({
                    name: "test",
                    annotations: [],
                    type: new ScalarType(GraphQLBuiltInScalarType.ID, true),
                    args: [],
                })
            );

            expect(attribute.isID()).toBe(true);
        });

        test("isBoolean", () => {
            const attribute = new AttributeAdapter(
                new Attribute({
                    name: "test",
                    annotations: [],
                    type: new ScalarType(GraphQLBuiltInScalarType.Boolean, true),
                    args: [],
                })
            );

            expect(attribute.isBoolean()).toBe(true);
        });

        test("isInt", () => {
            const attribute = new AttributeAdapter(
                new Attribute({
                    name: "test",
                    annotations: [],
                    type: new ScalarType(GraphQLBuiltInScalarType.Int, true),
                    args: [],
                })
            );

            expect(attribute.isInt()).toBe(true);
        });

        test("isFloat", () => {
            const attribute = new AttributeAdapter(
                new Attribute({
                    name: "test",
                    annotations: [],
                    type: new ScalarType(GraphQLBuiltInScalarType.Float, true),
                    args: [],
                })
            );
            expect(attribute.isFloat()).toBe(true);
        });

        test("isString", () => {
            const attribute = new AttributeAdapter(
                new Attribute({
                    name: "test",
                    annotations: [],
                    type: new ScalarType(GraphQLBuiltInScalarType.String, true),
                    args: [],
                })
            );
            expect(attribute.isString()).toBe(true);
        });

        test("isCartesianPoint", () => {
            const attribute = new AttributeAdapter(
                new Attribute({
                    name: "test",
                    annotations: [],
                    type: new Neo4jCartesianPointType(true),
                    args: [],
                })
            );

            expect(attribute.isCartesianPoint()).toBe(true);
        });

        test("isPoint", () => {
            const attribute = new AttributeAdapter(
                new Attribute({
                    name: "test",
                    annotations: [],
                    type: new Neo4jPointType(true),
                    args: [],
                })
            );

            expect(attribute.isPoint()).toBe(true);
        });

        test("isBigInt", () => {
            const attribute = new AttributeAdapter(
                new Attribute({
                    name: "test",
                    annotations: [],
                    type: new ScalarType(Neo4jGraphQLNumberType.BigInt, true),
                    args: [],
                })
            );

            expect(attribute.isBigInt()).toBe(true);
        });

        test("isDate", () => {
            const attribute = new AttributeAdapter(
                new Attribute({
                    name: "test",
                    annotations: [],
                    type: new ScalarType(Neo4jGraphQLTemporalType.Date, true),
                    args: [],
                })
            );

            expect(attribute.isDate()).toBe(true);
        });

        test("isDateTime", () => {
            const attribute = new AttributeAdapter(
                new Attribute({
                    name: "test",
                    annotations: [],
                    type: new ScalarType(Neo4jGraphQLTemporalType.DateTime, true),
                    args: [],
                })
            );

            expect(attribute.isDateTime()).toBe(true);
        });

        test("isLocalDateTime", () => {
            const attribute = new AttributeAdapter(
                new Attribute({
                    name: "test",
                    annotations: [],
                    type: new ScalarType(Neo4jGraphQLTemporalType.LocalDateTime, true),
                    args: [],
                })
            );

            expect(attribute.isLocalDateTime()).toBe(true);
        });

        test("isTime", () => {
            const attribute = new AttributeAdapter(
                new Attribute({
                    name: "test",
                    annotations: [],
                    type: new ScalarType(Neo4jGraphQLTemporalType.Time, true),
                    args: [],
                })
            );

            expect(attribute.isTime()).toBe(true);
        });

        test("isLocalTime", () => {
            const attribute = new AttributeAdapter(
                new Attribute({
                    name: "test",
                    annotations: [],
                    type: new ScalarType(Neo4jGraphQLTemporalType.LocalTime, true),
                    args: [],
                })
            );

            expect(attribute.isLocalTime()).toBe(true);
        });

        test("isDuration", () => {
            const attribute = new AttributeAdapter(
                new Attribute({
                    name: "test",
                    annotations: [],
                    type: new ScalarType(Neo4jGraphQLTemporalType.Duration, true),
                    args: [],
                })
            );

            expect(attribute.isDuration()).toBe(true);
        });

        test("isObject", () => {
            const attribute = new AttributeAdapter(
                new Attribute({
                    name: "test",
                    annotations: [],
                    type: new ObjectType("testType", true),
                    args: [],
                })
            );

            expect(attribute.isObject()).toBe(true);
        });

        test("isEnum", () => {
            const attribute = new AttributeAdapter(
                new Attribute({
                    name: "test",
                    annotations: [],
                    type: new EnumType("testType", true),
                    args: [],
                })
            );

            expect(attribute.isEnum()).toBe(true);
        });

        test("isUserScalar", () => {
            const attribute = new AttributeAdapter(
                new Attribute({
                    name: "test",
                    annotations: [],
                    type: new UserScalarType("testType", true),
                    args: [],
                })
            );

            expect(attribute.isUserScalar()).toBe(true);
        });

        test("isInterface", () => {
            const attribute = new AttributeAdapter(
                new Attribute({
                    name: "test",
                    annotations: [],
                    type: new InterfaceType("Tool", true),
                    args: [],
                })
            );
            expect(attribute.isInterface()).toBe(true);
        });

        test("isUnion", () => {
            const attribute = new AttributeAdapter(
                new Attribute({
                    name: "test",
                    annotations: [],
                    type: new UnionType("Tool", true),
                    args: [],
                })
            );
            expect(attribute.isUnion()).toBe(true);
        });

        describe("List", () => {
            test("isList should return true if attribute is a list", () => {
                const stringType = new ScalarType(GraphQLBuiltInScalarType.String, true);

                const attribute = new AttributeAdapter(
                    new Attribute({
                        name: "test",
                        annotations: [],
                        type: new ListType(stringType, true),
                        args: [],
                    })
                );

                expect(attribute.isList()).toBe(true);
            });

            test("isList should return false if attribute is not a list", () => {
                const stringType = new ScalarType(GraphQLBuiltInScalarType.String, true);

                const attribute = new AttributeAdapter(
                    new Attribute({
                        name: "test",
                        annotations: [],
                        type: stringType,
                        args: [],
                    })
                );

                expect(attribute.isList()).toBe(false);
            });

            test("type assertion, should return true if it's a list of a the same type.", () => {
                const stringType = new ScalarType(GraphQLBuiltInScalarType.String, true);

                const attribute = new AttributeAdapter(
                    new Attribute({
                        name: "test",
                        annotations: [],
                        type: new ListType(stringType, true),
                        args: [],
                    })
                );
                expect(attribute.isString({ includeLists: true })).toBe(true);
                expect(attribute.isString({ includeLists: false })).toBe(false);
            });

            test("type assertion, should return false if it's a list of a different type", () => {
                const stringType = new ScalarType(GraphQLBuiltInScalarType.String, true);

                const attribute = new AttributeAdapter(
                    new Attribute({
                        name: "test",
                        annotations: [],
                        type: new ListType(stringType, true),
                        args: [],
                    })
                );
                expect(attribute.isInt({ includeLists: true })).toBe(false);
                expect(attribute.isInt({ includeLists: false })).toBe(false);
            });
        });
    });

    describe("category assertions", () => {
        test("isGraphQLBuiltInScalar", () => {
            const attribute = new AttributeAdapter(
                new Attribute({
                    name: "test",
                    annotations: [],
                    type: new ScalarType(GraphQLBuiltInScalarType.String, true),
                    args: [],
                })
            );

            const nonBuiltInScalar = new AttributeAdapter(
                new Attribute({
                    name: "test",
                    annotations: [],
                    type: new ScalarType(Neo4jGraphQLNumberType.BigInt, true),
                    args: [],
                })
            );

            expect(attribute.isGraphQLBuiltInScalar()).toBe(true);
            expect(nonBuiltInScalar.isGraphQLBuiltInScalar()).toBe(false);
        });

        test("isSpatial", () => {
            const attribute = new AttributeAdapter(
                new Attribute({
                    name: "test",
                    annotations: [],
                    type: new Neo4jCartesianPointType(true),
                    args: [],
                })
            );
            const nonSpatial = new AttributeAdapter(
                new Attribute({
                    name: "test",
                    annotations: [],
                    type: new ScalarType(GraphQLBuiltInScalarType.String, true),
                    args: [],
                })
            );

            expect(attribute.isSpatial()).toBe(true);
            expect(nonSpatial.isSpatial()).toBe(false);
        });

        test("isTemporal", () => {
            const attribute = new AttributeAdapter(
                new Attribute({
                    name: "test",
                    annotations: [],
                    type: new ScalarType(Neo4jGraphQLTemporalType.Date, true),
                    args: [],
                })
            );

            const nonTemporal = new AttributeAdapter(
                new Attribute({
                    name: "test",
                    annotations: [],
                    type: new ScalarType(GraphQLBuiltInScalarType.String, true),
                    args: [],
                })
            );

            expect(attribute.isTemporal()).toBe(true);
            expect(nonTemporal.isTemporal()).toBe(false);
        });

        test("isAbstract", () => {
            const attribute = new AttributeAdapter(
                new Attribute({
                    name: "test",
                    annotations: [],
                    type: new UnionType("Tool", true),
                    args: [],
                })
            );

            const nonAbstract = new AttributeAdapter(
                new Attribute({
                    name: "test",
                    annotations: [],
                    type: new ScalarType(GraphQLBuiltInScalarType.String, true),
                    args: [],
                })
            );

            expect(attribute.isAbstract()).toBe(true);
            expect(nonAbstract.isAbstract()).toBe(false);
        });
    });

    test("isRequired", () => {
        const attributeRequired = new AttributeAdapter(
            new Attribute({
                name: "test",
                annotations: [],
                type: new ScalarType(GraphQLBuiltInScalarType.String, true),
                args: [],
            })
        );

        const attributeNotRequired = new AttributeAdapter(
            new Attribute({
                name: "test",
                annotations: [],
                type: new ScalarType(GraphQLBuiltInScalarType.String, false),
                args: [],
            })
        );

        expect(attributeRequired.isRequired()).toBe(true);
        expect(attributeNotRequired.isRequired()).toBe(false);
    });

    test("isRequired - List", () => {
        const attributeRequired = new AttributeAdapter(
            new Attribute({
                name: "test",
                annotations: [],
                type: new ListType(new ScalarType(GraphQLBuiltInScalarType.String, true), true),
                args: [],
            })
        );

        const attributeNotRequired = new AttributeAdapter(
            new Attribute({
                name: "test",
                annotations: [],
                type: new ListType(new ScalarType(GraphQLBuiltInScalarType.String, true), false),
                args: [],
            })
        );

        expect(attributeRequired.isRequired()).toBe(true);
        expect(attributeNotRequired.isRequired()).toBe(false);
    });

    test("isListElementRequired", () => {
        const listElementRequired = new AttributeAdapter(
            new Attribute({
                name: "test",
                annotations: [],
                type: new ListType(new ScalarType(GraphQLBuiltInScalarType.String, true), false),
                args: [],
            })
        );

        const listElementNotRequired = new AttributeAdapter(
            new Attribute({
                name: "test",
                annotations: [],
                type: new ListType(new ScalarType(GraphQLBuiltInScalarType.String, false), true),
                args: [],
            })
        );

        expect(listElementRequired.isListElementRequired()).toBe(true);
        expect(listElementNotRequired.isListElementRequired()).toBe(false);
    });

    describe("annotation assertions", () => {
        test("isUnique", () => {
            const attribute = new AttributeAdapter(
                new Attribute({
                    name: "test",
                    annotations: [new UniqueAnnotation({ constraintName: "test" })],
                    type: new ScalarType(GraphQLBuiltInScalarType.ID, true),
                    args: [],
                })
            );
            expect(attribute.isUnique()).toBe(true);
        });

        test("isCypher", () => {
            const attribute = new AttributeAdapter(
                new Attribute({
                    name: "test",
                    annotations: [
                        new CypherAnnotation({
                            statement: "MATCH (this)-[:FRIENDS_WITH]->(closestUser:User) RETURN closestUser",
                            columnName: "closestUser",
                        }),
                    ],
                    type: new ScalarType(GraphQLBuiltInScalarType.ID, true),
                    args: [],
                })
            );
            expect(attribute.isCypher()).toBe(true);
        });
    });

    describe("specialized models", () => {
        test("List Model", () => {
            const listElementAttribute = new AttributeAdapter(
                new Attribute({
                    name: "test",
                    annotations: [],
                    type: new ListType(new ScalarType(GraphQLBuiltInScalarType.String, true), false),
                    args: [],
                })
            );

            expect(listElementAttribute).toBeInstanceOf(AttributeAdapter);
            expect(listElementAttribute.listModel).toBeDefined();
            expect(listElementAttribute.listModel.getIncludes()).toMatchInlineSnapshot(`"test_INCLUDES"`);
            expect(listElementAttribute.listModel.getNotIncludes()).toMatchInlineSnapshot(`"test_NOT_INCLUDES"`);
            expect(listElementAttribute.listModel.getPop()).toMatchInlineSnapshot(`"test_POP"`);
            expect(listElementAttribute.listModel.getPush()).toMatchInlineSnapshot(`"test_PUSH"`);
        });

        test("Aggregation Model", () => {
            const attribute = new AttributeAdapter(
                new Attribute({
                    name: "test",
                    annotations: [],
                    type: new ScalarType(GraphQLBuiltInScalarType.Int, true),
                    args: [],
                })
            );
            // TODO: test it with String as well.

            expect(attribute).toBeInstanceOf(AttributeAdapter);
            expect(attribute.aggregationModel).toBeDefined();
            expect(attribute.aggregationModel.getAggregationComparators()).toEqual(
                expect.arrayContaining([
                    "test_AVERAGE_EQUAL",
                    "test_MIN_EQUAL",
                    "test_MAX_EQUAL",
                    "test_SUM_EQUAL",
                    "test_AVERAGE_GT",
                    "test_MIN_GT",
                    "test_MAX_GT",
                    "test_SUM_GT",
                    "test_AVERAGE_GTE",
                    "test_MIN_GTE",
                    "test_MAX_GTE",
                    "test_SUM_GTE",
                    "test_AVERAGE_LT",
                    "test_MIN_LT",
                    "test_MAX_LT",
                    "test_SUM_LT",
                    "test_AVERAGE_LTE",
                    "test_MIN_LTE",
                    "test_MAX_LTE",
                    "test_SUM_LTE",
                ])
            );
            // Average
            expect(attribute.aggregationModel.getAverageComparator("EQUAL")).toMatchInlineSnapshot(
                `"test_AVERAGE_EQUAL"`
            );
            expect(attribute.aggregationModel.getAverageComparator("GT")).toMatchInlineSnapshot(`"test_AVERAGE_GT"`);
            expect(attribute.aggregationModel.getAverageComparator("GTE")).toMatchInlineSnapshot(`"test_AVERAGE_GTE"`);
            expect(attribute.aggregationModel.getAverageComparator("LT")).toMatchInlineSnapshot(`"test_AVERAGE_LT"`);
            expect(attribute.aggregationModel.getAverageComparator("LTE")).toMatchInlineSnapshot(`"test_AVERAGE_LTE"`);
            // Max
            expect(attribute.aggregationModel.getMaxComparator("EQUAL")).toMatchInlineSnapshot(`"test_MAX_EQUAL"`);
            expect(attribute.aggregationModel.getMaxComparator("GT")).toMatchInlineSnapshot(`"test_MAX_GT"`);
            expect(attribute.aggregationModel.getMaxComparator("GTE")).toMatchInlineSnapshot(`"test_MAX_GTE"`);
            expect(attribute.aggregationModel.getMaxComparator("LT")).toMatchInlineSnapshot(`"test_MAX_LT"`);
            expect(attribute.aggregationModel.getMaxComparator("LTE")).toMatchInlineSnapshot(`"test_MAX_LTE"`);
            // Min
            expect(attribute.aggregationModel.getMinComparator("EQUAL")).toMatchInlineSnapshot(`"test_MIN_EQUAL"`);
            expect(attribute.aggregationModel.getMinComparator("GT")).toMatchInlineSnapshot(`"test_MIN_GT"`);
            expect(attribute.aggregationModel.getMinComparator("GTE")).toMatchInlineSnapshot(`"test_MIN_GTE"`);
            expect(attribute.aggregationModel.getMinComparator("LT")).toMatchInlineSnapshot(`"test_MIN_LT"`);
            expect(attribute.aggregationModel.getMinComparator("LTE")).toMatchInlineSnapshot(`"test_MIN_LTE"`);
            // Sum
            expect(attribute.aggregationModel.getSumComparator("EQUAL")).toMatchInlineSnapshot(`"test_SUM_EQUAL"`);
            expect(attribute.aggregationModel.getSumComparator("GT")).toMatchInlineSnapshot(`"test_SUM_GT"`);
            expect(attribute.aggregationModel.getSumComparator("GTE")).toMatchInlineSnapshot(`"test_SUM_GTE"`);
            expect(attribute.aggregationModel.getSumComparator("LT")).toMatchInlineSnapshot(`"test_SUM_LT"`);
            expect(attribute.aggregationModel.getSumComparator("LTE")).toMatchInlineSnapshot(`"test_SUM_LTE"`);
        });

        test("Math Model", () => {
            const attribute = new AttributeAdapter(
                new Attribute({
                    name: "test",
                    annotations: [],
                    type: new ScalarType(GraphQLBuiltInScalarType.Int, true),
                    args: [],
                })
            );
            // TODO: test it with float as well.
            expect(attribute).toBeInstanceOf(AttributeAdapter);
            expect(attribute.mathModel).toBeDefined();
            expect(attribute.mathModel.getMathOperations()).toEqual(
                expect.arrayContaining(["test_INCREMENT", "test_DECREMENT", "test_MULTIPLY", "test_DIVIDE"])
            );

            expect(attribute.mathModel.getAdd()).toMatchInlineSnapshot(`"test_INCREMENT"`);
            expect(attribute.mathModel.getSubtract()).toMatchInlineSnapshot(`"test_DECREMENT"`);
            expect(attribute.mathModel.getMultiply()).toMatchInlineSnapshot(`"test_MULTIPLY"`);
            expect(attribute.mathModel.getDivide()).toMatchInlineSnapshot(`"test_DIVIDE"`);
        });
    });
});
