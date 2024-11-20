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

import type { InputTypeComposer, SchemaComposer } from "graphql-compose";
import type { AttributeAdapter } from "../../schema-model/attribute/model-adapters/AttributeAdapter";

export class ScalarFilters {
    private composer: SchemaComposer;
    constructor(composer: SchemaComposer) {
        this.composer = composer;
    }

    public getInputTypeFromAttributeType(attribute: AttributeAdapter): InputTypeComposer {
        if (attribute.typeHelper.isBoolean()) {
            return this.booleanScalarFilters;
        }
        if (attribute.typeHelper.isID()) {
            return this.idScalarFilters;
        }
        if (attribute.typeHelper.isString()) {
            return this.stringScalarFilters;
        }
        if (attribute.typeHelper.isInt()) {
            return this.intScalarFilters;
        }
        if (attribute.typeHelper.isFloat()) {
            return this.floatScalarFilters;
        }
        if (attribute.typeHelper.isBigInt()) {
            return this.bigIntScalarFilters;
        }
        throw new Error(`No scalar filter found for attribute ${attribute.type.name}`);
    }

    public get booleanScalarFilters(): InputTypeComposer {
        return this.composer.getOrCreateITC("BooleanScalarFilters", (tc) => {
            tc.addFields({
                equals: "String",
            });
        });
    }

    public get idScalarFilters(): InputTypeComposer {
        return this.composer.getOrCreateITC("IDScalarFilters", (tc) => {
            tc.addFields({
                equals: "String",
                greaterThan: "String", // GT/LT/GTE etc should not be added all the time
                greaterThanEquals: "String",
                in: "[String!]",
                lessThan: "String",
                lessThanEquals: "String",
            });
        });
    }

    public get stringScalarFilters(): InputTypeComposer {
        return this.composer.getOrCreateITC("StringScalarFilters", (tc) => {
            tc.addFields({
                equals: "String",
                greaterThan: "String", // GT/LT/GTE etc should not be added all the time
                greaterThanEquals: "String",
                in: "[String!]",
                lessThan: "String",
                lessThanEquals: "String",
            });
        });
    }

    public get intScalarFilters(): InputTypeComposer {
        return this.composer.getOrCreateITC("IntScalarFilters", (tc) => {
            tc.addFields({
                equals: "Int",
                greaterThan: "Int",
                greaterThanEquals: "Int",
                in: "[Int!]",
                lessThan: "Int",
                lessThanEquals: "Int",
            });
        });
    }

    public get floatScalarFilters(): InputTypeComposer {
        return this.composer.getOrCreateITC("FloatScalarFilters", (tc) => {
            tc.addFields({
                equals: "Float",
                greaterThan: "Float",
                greaterThanEquals: "Float",
                in: "[Float!]",
                lessThan: "Float",
                lessThanEquals: "Float",
            });
        });
    }

    public get bigIntScalarFilters(): InputTypeComposer {
        return this.composer.getOrCreateITC("BigIntScalarFilters", (tc) => {
            tc.addFields({
                equals: "BigInt",
                greaterThan: "BigInt",
                greaterThanEquals: "BigInt",
                in: "[BigInt!]",
                lessThan: "BigInt",
                lessThanEquals: "BigInt",
            });
        });
    }

    // TODO add the remaining PointFilters/DateFilters
}
