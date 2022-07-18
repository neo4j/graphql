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

import type { PointField, PrimitiveField } from "../../types";
import createWhereClause from "./create-where-clause";
import type { NumericalWhereOperator, SpatialWhereOperator, WhereOperator } from "./types";

describe("createWhereClause", () => {
    const property = "field";
    const param = "this";

    describe("Primitive Fields", () => {
        test("Equality", () => {
            const clause = createWhereClause({ param, property, isNot: false });
            const expected = `${property} = $${param}`;
            expect(clause).toBe(expected);
        });

        test("Inequality", () => {
            const clause = createWhereClause({ param, property, isNot: true });
            const expected = `(NOT ${property} = $${param})`;
            expect(clause).toBe(expected);
        });

        test.each<[WhereOperator, string]>([
            ["LT", "<"],
            ["GT", ">"],
            ["GTE", ">="],
            ["LTE", "<="],
            ["CONTAINS", "CONTAINS"],
            ["STARTS_WITH", "STARTS WITH"],
            ["ENDS_WITH", "ENDS WITH"],
            ["MATCHES", "=~"],
            ["IN", "IN"],
        ])("%s", (operator, comparison) => {
            const clause = createWhereClause({ param, property, operator, isNot: false });
            const expected = `${property} ${comparison} $${param}`;
            expect(clause).toBe(expected);
        });

        test("INCLUDES", () => {
            const clause = createWhereClause({ param, property, operator: "INCLUDES", isNot: false });
            const expected = `$${param} IN ${property}`;
            expect(clause).toBe(expected);
        });
    });

    describe("Duration Field", () => {
        // @ts-ignore
        const durationField: PrimitiveField = {
            fieldName: "durationField",
        };
        test("Equality", () => {
            const clause = createWhereClause({ param, property, isNot: false, durationField });
            const expected = `${property} = $${param}`;
            expect(clause).toBe(expected);
        });

        test("Inequality", () => {
            const clause = createWhereClause({ param, property, isNot: true, durationField });
            const expected = `(NOT ${property} = $${param})`;
            expect(clause).toBe(expected);
        });

        test.each<[NumericalWhereOperator, string]>([
            ["LT", "<"],
            ["GT", ">"],
            ["GTE", ">="],
            ["LTE", "<="],
        ])("%s", (operator, comparison) => {
            const clause = createWhereClause({ param, property, operator, isNot: false, durationField });
            const expected = `datetime() + ${property} ${comparison} datetime() + $${param}`;
            expect(clause).toBe(expected);
        });
    });
    describe("Point Field", () => {
        describe("Nonarray", () => {
            const pointField: PointField = {
                // @ts-ignore
                typeMeta: {
                    array: false,
                },
            };
            test("Equality", () => {
                const clause = createWhereClause({ param, property, isNot: false, pointField });
                const expected = `${property} = point($${param})`;
                expect(clause).toBe(expected);
            });

            test("Inequality", () => {
                const clause = createWhereClause({ param, property, isNot: true, pointField });
                const expected = `(NOT ${property} = point($${param}))`;
                expect(clause).toBe(expected);
            });

            test.each<[NumericalWhereOperator | SpatialWhereOperator, string]>([
                ["LT", "<"],
                ["GT", ">"],
                ["GTE", ">="],
                ["LTE", "<="],
                ["DISTANCE", "="],
            ])("%s", (operator, comparison) => {
                const clause = createWhereClause({ param, property, operator, isNot: false, pointField });
                const expected = `distance(${property}, point($${param}.point)) ${comparison} $${param}.distance`;
                expect(clause).toBe(expected);
            });
        });

        describe("Array", () => {
            const pointField: PointField = {
                // @ts-ignore
                typeMeta: {
                    array: true,
                },
            };
            test("Equality", () => {
                const clause = createWhereClause({ param, property, isNot: false, pointField });
                const expected = `${property} = [p in $${param} | point(p)]`;
                expect(clause).toBe(expected);
            });

            test("Inequality", () => {
                const clause = createWhereClause({ param, property, isNot: true, pointField });
                const expected = `(NOT ${property} = [p in $${param} | point(p)])`;
                expect(clause).toBe(expected);
            });

            test("IN", () => {
                const clause = createWhereClause({ param, property, operator: "IN", isNot: false, pointField });
                const expected = `${property} IN [p in $${param} | point(p)]`;
                expect(clause).toBe(expected);
            });
        });
    });
});
