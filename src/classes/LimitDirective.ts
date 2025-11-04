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

import * as neo4j from "neo4j-driver";
import type { Integer } from "neo4j-driver";

type LimitDirectiveConstructor = {
    default?: Integer;
    max?: Integer;
};

export class LimitDirective {
    private default?: Integer;
    private max?: Integer;

    constructor(limit: LimitDirectiveConstructor) {
        this.default = limit.default;
        this.max = limit.max;
    }

    public getLimit(optionsLimit?: Integer | number): Integer | undefined {
        if (optionsLimit) {
            const integerLimit = neo4j.int(optionsLimit);
            if (this.max && integerLimit.greaterThan(this.max)) {
                return this.max;
            }
            return integerLimit;
        }

        return this.default || this.max;
    }
}
