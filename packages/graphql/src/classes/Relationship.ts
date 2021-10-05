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
    PrimitiveField,
    PointField,
    CustomEnumField,
    CypherField,
    CustomScalarField,
    BaseField,
    TemporalField,
} from "../types";

export interface RelationshipConstructor {
    name: string;
    type: string;
    description?: string;
    properties?: string;
    cypherFields?: CypherField[];
    primitiveFields?: PrimitiveField[];
    scalarFields?: CustomScalarField[];
    enumFields?: CustomEnumField[];
    temporalFields?: TemporalField[];
    pointFields?: PointField[];
    ignoredFields?: BaseField[];
}

class Relationship {
    public name: string;
    public type: string;
    public description?: string;
    public properties?: string;
    public primitiveFields: PrimitiveField[];
    public scalarFields: CustomScalarField[];
    public enumFields: CustomEnumField[];
    public temporalFields: TemporalField[];
    public pointFields: PointField[];
    public ignoredFields: BaseField[];

    constructor(input: RelationshipConstructor) {
        this.name = input.name;
        this.type = input.type;
        this.description = input.description;
        this.properties = input.properties;
        this.primitiveFields = input.primitiveFields || [];
        this.scalarFields = input.scalarFields || [];
        this.enumFields = input.enumFields || [];
        this.temporalFields = input.temporalFields || [];
        this.pointFields = input.pointFields || [];
        this.ignoredFields = input.ignoredFields || [];
    }
}

export default Relationship;
