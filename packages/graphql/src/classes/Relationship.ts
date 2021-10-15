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
import { GraphElement } from "./GraphElement";

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

class Relationship extends GraphElement {
    public properties?: string;

    constructor(input: RelationshipConstructor) {
        super({
            name: input.name,
            description: input.description,
            cypherFields: input.cypherFields || [],
            primitiveFields: input.primitiveFields || [],
            scalarFields: input.scalarFields || [],
            enumFields: input.enumFields || [],
            temporalFields: input.temporalFields || [],
            pointFields: input.pointFields || [],
            ignoredFields: input.ignoredFields || [],
        });

        this.properties = input.properties;
    }
}

export default Relationship;
