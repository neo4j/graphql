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

import { SchemaComposer } from "graphql-compose";
import { AggregationTypesMapper } from "./aggregation-types-mapper";

describe("AggregationTypesMapper", () => {
    let composer: SchemaComposer;
    let typesMapper: AggregationTypesMapper;

    beforeEach(() => {
        composer = new SchemaComposer();
        typesMapper = new AggregationTypesMapper(composer);
    });

    test("returns the correct non nullable type", () => {
        const aggregationType = typesMapper.getAggregationType({
            fieldName: "String",
            nullable: false,
        });

        expect(aggregationType?.getTypeName()).toBe("StringAggregateSelectionNonNullable");
        expect(composer.get(aggregationType?.getTypeName())).toBeTruthy();
    });

    test("do not duplicate types", () => {
        const beforeType = composer.get("StringAggregateSelectionNonNullable");
        const typesMapper2 = new AggregationTypesMapper(composer);
        const aggregationType = typesMapper2.getAggregationType({
            fieldName: "String",
            nullable: false,
        });

        expect(aggregationType?.getTypeName()).toBe("StringAggregateSelectionNonNullable");
        expect(composer.get(aggregationType?.getTypeName())).toBeTruthy();
        expect(beforeType).toEqual(aggregationType);
    });

    test("returns the correct nullable type", () => {
        const aggregationType = typesMapper.getAggregationType({
            fieldName: "String",
            nullable: true,
        });

        expect(aggregationType?.getTypeName()).toBe("StringAggregateSelectionNullable");
        expect(composer.get(aggregationType?.getTypeName())).toBeTruthy();
    });

    test("returns undefined for invalid type", () => {
        const aggregationType = typesMapper.getAggregationType({
            fieldName: "this is a lovely typeeee",
            nullable: true,
        });

        expect(aggregationType).toBeUndefined();
    });
});
