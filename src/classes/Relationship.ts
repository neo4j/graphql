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
    TemporalField,
    CustomResolverField,
} from "../types";
import { GraphElement } from "./GraphElement";

interface RelationshipConstructor {
    name: string;
    type?: string;
    source: string; // temporary addition to infer the source using the schema model
    target: string; // temporary addition to infer the target using the schema model
    description?: string;
    properties?: string;
    cypherFields?: CypherField[];
    primitiveFields?: PrimitiveField[];
    scalarFields?: CustomScalarField[];
    enumFields?: CustomEnumField[];
    temporalFields?: TemporalField[];
    pointFields?: PointField[];
    customResolverFields?: CustomResolverField[];
}

class Relationship extends GraphElement {
    public properties?: string;
    public source: string;
    public target: string;

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
            customResolverFields: input.customResolverFields || [],
        });

        this.properties = input.properties;
        this.source = input.source;
        this.target = input.target;
    }
}

export default Relationship;
