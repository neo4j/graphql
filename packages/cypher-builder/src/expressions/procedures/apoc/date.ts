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

import type { CypherEnvironment } from "../../../Environment";
import { CypherASTNode } from "../../../CypherASTNode";
import type { PropertyRef, Variable } from "../../../Cypher";

export class ConvertFormat extends CypherASTNode {
    private temporalParam: Variable | PropertyRef;
    private currentFormat: string;
    private convertTo: string;

    constructor(temporalParam, currentFormat, convertTo) {
        super();
        this.temporalParam = temporalParam;
        this.currentFormat = currentFormat;
        this.convertTo = convertTo;
    }

    public getCypher(env: CypherEnvironment): string {
        const valueStr = this.temporalParam.getCypher(env);
        return `apoc.date.convertFormat(toString(${valueStr}), "${this.currentFormat}", "${this.convertTo}")`;
    }
}

export function convertFormat(
    temporalParam: Variable | PropertyRef,
    currentFormat: string,
    convertTo: string
): ConvertFormat {
    return new ConvertFormat(temporalParam, currentFormat, convertTo);
}
