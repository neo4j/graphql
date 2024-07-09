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

import type { Annotation } from "./Annotation";

export type VectorField = {
    indexName: string;
    embeddingProperty: string;
    queryName: string;
    provider?: string;
    callback?: string;
};

export class VectorAnnotation implements Annotation {
    readonly name = "vector";
    public readonly indexes: VectorField[];

    constructor({ indexes }: { indexes: VectorField[] }) {
        this.indexes = indexes;
    }
}
