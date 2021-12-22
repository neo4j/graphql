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
    BaseField,
    InterfaceField,
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
    ignoredFields: BaseField[];
}

export abstract class GraphElement {
    public name: string;
    public description?: string;
    public primitiveFields: PrimitiveField[];
    public scalarFields: CustomScalarField[];
    public enumFields: CustomEnumField[];
    public temporalFields: TemporalField[];
    public pointFields: PointField[];
    public ignoredFields: BaseField[];

    constructor(input: GraphElementConstructor) {
        this.name = input.name;
        this.description = input.description;
        this.primitiveFields = input.primitiveFields;
        this.scalarFields = input.scalarFields;
        this.enumFields = input.enumFields;
        this.temporalFields = input.temporalFields;
        this.pointFields = input.pointFields;
        this.ignoredFields = input.ignoredFields;
    }
}
