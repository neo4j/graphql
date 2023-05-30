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

import type {
    CypherField,
    PrimitiveField,
    CustomEnumField,
    CustomScalarField,
    TemporalField,
    PointField,
    CustomResolverField,
    BaseField,
} from "../types";

export interface GraphElementConstructor {
    name: string;
    description?: string;
    cypherFields: CypherField[];
    primitiveFields: PrimitiveField[];
    scalarFields: CustomScalarField[];
    enumFields: CustomEnumField[];
    temporalFields: TemporalField[];
    pointFields: PointField[];
    customResolverFields: CustomResolverField[];
}

export abstract class GraphElement {
    public name: string;
    public description?: string;
    public primitiveFields: PrimitiveField[];
    public scalarFields: CustomScalarField[];
    public enumFields: CustomEnumField[];
    public temporalFields: TemporalField[];
    public pointFields: PointField[];
    public customResolverFields: CustomResolverField[];

    constructor(input: GraphElementConstructor) {
        this.name = input.name;
        this.description = input.description;
        this.primitiveFields = input.primitiveFields;
        this.scalarFields = input.scalarFields;
        this.enumFields = input.enumFields;
        this.temporalFields = input.temporalFields;
        this.pointFields = input.pointFields;
        this.customResolverFields = input.customResolverFields;
    }

    public getField(name: string): BaseField | undefined {
        for (const fieldList of this.getAllFields()) {
            const field = this.searchFieldInList(name, fieldList);
            if (field) return field;
        }
    }

    private getAllFields(): Array<BaseField[]> {
        return [
            this.primitiveFields,
            this.scalarFields,
            this.enumFields,
            this.temporalFields,
            this.pointFields,
            this.customResolverFields,
        ];
    }

    private searchFieldInList(fieldName: string, fields: BaseField[]): BaseField | undefined {
        return fields.find((field) => {
            return field.fieldName === fieldName;
        });
    }
}
