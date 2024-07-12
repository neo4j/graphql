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

import type { GraphQLTreeElement } from "./tree-element";

export type GraphQLTreeLeafField = GraphQLTreeScalarField | GraphQLTreePoint | GraphQLTreeCartesianPoint;

export interface GraphQLTreeScalarField extends GraphQLTreeElement {
    name: string;
}

export interface GraphQLTreePoint extends GraphQLTreeElement {
    fields: {
        longitude: GraphQLTreeScalarField | undefined;
        latitude: GraphQLTreeScalarField | undefined;
        height: GraphQLTreeScalarField | undefined;
        crs: GraphQLTreeScalarField | undefined;
        srid: GraphQLTreeScalarField | undefined;
    };
    name: string;
}

export interface GraphQLTreeCartesianPoint extends GraphQLTreeElement {
    fields: {
        x: GraphQLTreeScalarField | undefined;
        y: GraphQLTreeScalarField | undefined;
        z: GraphQLTreeScalarField | undefined;
        crs: GraphQLTreeScalarField | undefined;
        srid: GraphQLTreeScalarField | undefined;
    };
    name: string;
}
