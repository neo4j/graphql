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

import type { PrimitiveField, DateTimeField, PointField, CustomEnumField } from "../types";

// TODO does CustomScalarField need to be in the mix?
export type RelationshipField = PrimitiveField | DateTimeField | PointField | CustomEnumField;

export interface RelationshipConstructor {
    name: string;
    type: string;
    description?: string;
    properties?: string;
    fields: RelationshipField[];
}

class Relationship {
    public name: string;

    public type: string;

    public description?: string;

    public properties?: string;

    public fields: RelationshipField[];

    constructor(input: RelationshipConstructor) {
        this.name = input.name;
        this.type = input.type;
        this.description = input.description;
        this.properties = input.properties;
        this.fields = input.fields;
    }
}

export default Relationship;
