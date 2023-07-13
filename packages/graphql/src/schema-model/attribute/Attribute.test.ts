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

import {
    EnumType,
    GraphQLBuiltInScalarType,
    ListType,
    Neo4jGraphQLNumberType,
    Neo4jGraphQLSpatialType,
    Neo4jGraphQLTemporalType,
    ObjectType,
    ScalarType,
    UserScalarType,
} from "./AbstractAttribute";
import { Attribute } from "./Attribute";

describe("Attribute", () => {
    test("should clone attribute", () => {
        const attribute = new Attribute({
            name: "test",
            annotations: [],
            type: new ScalarType(GraphQLBuiltInScalarType.String, true),
        });
        const clone = attribute.clone();
        expect(attribute).toStrictEqual(clone);
    });

    describe("type assertions", () => {
        test("isID", () => {
            const attribute = new Attribute({
                name: "test",
                annotations: [],
                type: new ScalarType(GraphQLBuiltInScalarType.ID, true),
            });

            expect(attribute.isID()).toBe(true);
        });

        test("isBoolean", () => {
            const attribute = new Attribute({
                name: "test",
                annotations: [],
                type: new ScalarType(GraphQLBuiltInScalarType.Boolean, true),
            });

            expect(attribute.isBoolean()).toBe(true);
        });

        test("isInt", () => {
            const attribute = new Attribute({
                name: "test",
                annotations: [],
                type: new ScalarType(GraphQLBuiltInScalarType.Int, true),
            });

            expect(attribute.isInt()).toBe(true);
        });

        test("isFloat", () => {
            const attribute = new Attribute({
                name: "test",
                annotations: [],
                type: new ScalarType(GraphQLBuiltInScalarType.Float, true),
            });
            expect(attribute.isFloat()).toBe(true);
        });

        test("isString", () => {
            const attribute = new Attribute({
                name: "test",
                annotations: [],
                type: new ScalarType(GraphQLBuiltInScalarType.String, true),
            });
            expect(attribute.isString()).toBe(true);
        });

        test("isCartesianPoint", () => {
            const attribute = new Attribute({
                name: "test",
                annotations: [],
                type: new ScalarType(Neo4jGraphQLSpatialType.CartesianPoint, true),
            });

            expect(attribute.isCartesianPoint()).toBe(true);
        });

        test("isPoint", () => {
            const attribute = new Attribute({
                name: "test",
                annotations: [],
                type: new ScalarType(Neo4jGraphQLSpatialType.Point, true),
            });

            expect(attribute.isPoint()).toBe(true);
        });

        test("isBigInt", () => {
            const attribute = new Attribute({
                name: "test",
                annotations: [],
                type: new ScalarType(Neo4jGraphQLNumberType.BigInt, true),
            });

            expect(attribute.isBigInt()).toBe(true);
        });

        test("isDate", () => {
            const attribute = new Attribute({
                name: "test",
                annotations: [],
                type: new ScalarType(Neo4jGraphQLTemporalType.Date, true),
            });

            expect(attribute.isDate()).toBe(true);
        });

        test("isDateTime", () => {
            const attribute = new Attribute({
                name: "test",
                annotations: [],
                type: new ScalarType(Neo4jGraphQLTemporalType.DateTime, true),
            });

            expect(attribute.isDateTime()).toBe(true);
        });

        test("isLocalDateTime", () => {
            const attribute = new Attribute({
                name: "test",
                annotations: [],
                type: new ScalarType(Neo4jGraphQLTemporalType.LocalDateTime, true),
            });

            expect(attribute.isLocalDateTime()).toBe(true);
        });

        test("isTime", () => {
            const attribute = new Attribute({
                name: "test",
                annotations: [],
                type: new ScalarType(Neo4jGraphQLTemporalType.Time, true),
            });

            expect(attribute.isTime()).toBe(true);
        });

        test("isLocalTime", () => {
            const attribute = new Attribute({
                name: "test",
                annotations: [],
                type: new ScalarType(Neo4jGraphQLTemporalType.LocalTime, true),
            });

            expect(attribute.isLocalTime()).toBe(true);
        });

        test("isDuration", () => {
            const attribute = new Attribute({
                name: "test",
                annotations: [],
                type: new ScalarType(Neo4jGraphQLTemporalType.Duration, true),
            });

            expect(attribute.isDuration()).toBe(true);
        });

        test("isObject", () => {
            const attribute = new Attribute({
                name: "test",
                annotations: [],
                type: new ObjectType("testType", true),
            });

            expect(attribute.isObject()).toBe(true);
        });

        test("isEnum", () => {
            const attribute = new Attribute({
                name: "test",
                annotations: [],
                type: new EnumType("testType", true),
            });

            expect(attribute.isEnum()).toBe(true);
        });

        test("isUserScalar", () => {
            const attribute = new Attribute({
                name: "test",
                annotations: [],
                type: new UserScalarType("testType", true),
            });

            expect(attribute.isUserScalar()).toBe(true);
        });

        describe("List", () => {
            test("isList", () => {
                const stringType = new ScalarType(GraphQLBuiltInScalarType.String, true);

                const attribute = new Attribute({
                    name: "test",
                    annotations: [],
                    type: new ListType(stringType, true),
                });

                expect(attribute.isList()).toBe(true);
            });

            test("isListOf, should return false if attribute it's not a list", () => {
                const stringType = new ScalarType(GraphQLBuiltInScalarType.String, true);

                const attribute = new Attribute({
                    name: "test",
                    annotations: [],
                    type: stringType,
                });

                expect(attribute.isListOf(stringType)).toBe(false);
            });

            test("isListOf(Attribute), should return false if it's a list of a different type", () => {
                const stringType = new ScalarType(GraphQLBuiltInScalarType.String, true);

                const attribute = new Attribute({
                    name: "test",
                    annotations: [],
                    type: new ListType(stringType, true),
                });
                const intType = new ScalarType(GraphQLBuiltInScalarType.Int, true);
                expect(attribute.isListOf(intType)).toBe(false);
            });

            test("isListOf(Attribute), should return true if it's a list of a the same type.", () => {
                const stringType = new ScalarType(GraphQLBuiltInScalarType.String, true);

                const attribute = new Attribute({
                    name: "test",
                    annotations: [],
                    type: new ListType(stringType, true),
                });
                const stringType2 = new ScalarType(GraphQLBuiltInScalarType.String, true);
                expect(attribute.isListOf(stringType2)).toBe(true);
            });

            test("isListOf(string), should return false if it's a list of a different type", () => {
                const stringType = new ScalarType(GraphQLBuiltInScalarType.String, true);

                const attribute = new Attribute({
                    name: "test",
                    annotations: [],
                    type: new ListType(stringType, true),
                });
                expect(attribute.isListOf(GraphQLBuiltInScalarType.Int)).toBe(false);
            });

            test("isListOf(string), should return true if it's a list of a the same type.", () => {
                const stringType = new ScalarType(GraphQLBuiltInScalarType.String, true);

                const attribute = new Attribute({
                    name: "test",
                    annotations: [],
                    type: new ListType(stringType, true),
                });
                expect(attribute.isListOf(GraphQLBuiltInScalarType.String)).toBe(true);
            });
        });
    });

    describe("category assertions", () => {
        test("isGraphQLBuiltInScalar", () => {
            const attribute = new Attribute({
                name: "test",
                annotations: [],
                type: new ScalarType(GraphQLBuiltInScalarType.String, true),
            });

            expect(attribute.isGraphQLBuiltInScalar()).toBe(true);
        });

        test("isSpatial", () => {
            const attribute = new Attribute({
                name: "test",
                annotations: [],
                type: new ScalarType(Neo4jGraphQLSpatialType.CartesianPoint, true),
            });

            expect(attribute.isSpatial()).toBe(true);
        });

        test("isTemporal", () => {
            const attribute = new Attribute({
                name: "test",
                annotations: [],
                type: new ScalarType(Neo4jGraphQLTemporalType.Date, true),
            });

            expect(attribute.isTemporal()).toBe(true);
        });
    });

    test("isRequired", () => {
        const attributeRequired = new Attribute({
            name: "test",
            annotations: [],
            type: new ScalarType(GraphQLBuiltInScalarType.String, true),
        });

        const attributeNotRequired = new Attribute({
            name: "test",
            annotations: [],
            type: new ScalarType(GraphQLBuiltInScalarType.String, false),
        });

        expect(attributeRequired.isRequired()).toBe(true);
        expect(attributeNotRequired.isRequired()).toBe(false);
    });

    test("isRequired - List", () => {
        const attributeRequired = new Attribute({
            name: "test",
            annotations: [],
            type: new ListType(new ScalarType(GraphQLBuiltInScalarType.String, true), true),
        });

        const attributeNotRequired = new Attribute({
            name: "test",
            annotations: [],
            type: new ListType(new ScalarType(GraphQLBuiltInScalarType.String, true), false),
        });

        expect(attributeRequired.isRequired()).toBe(true);
        expect(attributeNotRequired.isRequired()).toBe(false);
    });
    
    test("isListElementRequired", () => {
        const listElementRequired = new Attribute({
            name: "test",
            annotations: [],
            type: new ListType(new ScalarType(GraphQLBuiltInScalarType.String, true), false),
        });

        const listElementNotRequired = new Attribute({
            name: "test",
            annotations: [],
            type: new ListType(new ScalarType(GraphQLBuiltInScalarType.String, false), true),
        });
       
        expect(listElementRequired.isListElementRequired()).toBe(true);
        expect(listElementNotRequired.isListElementRequired()).toBe(false);
    });

    // TODO: test isInterface and isUnion
    test("isInterface", () => {
        expect(true).toBe(true);
    });

    test("isUnion", () => {
        expect(true).toBe(true);
    });
});
