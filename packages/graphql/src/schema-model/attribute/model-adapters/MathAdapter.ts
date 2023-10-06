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
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import type { AttributeAdapter } from "./AttributeAdapter";

export class MathAdapter {
    readonly AttributeAdapter: AttributeAdapter;

    constructor(AttributeAdapter: AttributeAdapter) {
        if (!AttributeAdapter.typeHelper.isNumeric()) {
            throw new Error("Math model available only for numeric attributes");
        }
        this.AttributeAdapter = AttributeAdapter;
    }

    getMathOperations(): string[] {
        const operations = [this.getAdd(), this.getSubtract()];
        this.AttributeAdapter.typeHelper.isFloat() && operations.push(this.getMultiply());
        this.AttributeAdapter.typeHelper.isFloat() && operations.push(this.getDivide());
        return operations;
    }

    getAdd(): string {
        return this.AttributeAdapter.typeHelper.isInt() || this.AttributeAdapter.typeHelper.isBigInt()
            ? `${this.AttributeAdapter.name}_INCREMENT`
            : `${this.AttributeAdapter.name}_ADD`;
    }

    getSubtract(): string {
        return this.AttributeAdapter.typeHelper.isInt() || this.AttributeAdapter.typeHelper.isBigInt()
            ? `${this.AttributeAdapter.name}_DECREMENT`
            : `${this.AttributeAdapter.name}_SUBTRACT`;
    }

    getMultiply(): string {
        return `${this.AttributeAdapter.name}_MULTIPLY`;
    }

    getDivide(): string {
        return `${this.AttributeAdapter.name}_DIVIDE`;
    }
}
