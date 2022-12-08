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

import { PropertyRef } from "./PropertyRef";
import { ListIndex } from "../expressions/list/ListIndex";
import type { CypherCompilable } from "../types";
import type { CypherEnvironment } from "../Environment";

/** Represents a reference that will be kept in the environment */
export abstract class Reference implements CypherCompilable {
    public prefix: string;

    constructor(prefix = "") {
        this.prefix = prefix;
    }

    /**
     * @hidden
     */
    public getCypher(env: CypherEnvironment): string {
        const id = env.getReferenceId(this);
        return `${id}`;
    }

    /* Access individual property via the PropertyRef class, using the dot notation */
    public property(path: string): PropertyRef {
        return new PropertyRef(this, path);
    }

    /* Access individual elements via the ListIndex class, using the square bracket notation */
    public index(index: number): ListIndex {
        return new ListIndex(this, index);
    }
}

export interface NamedReference extends Reference {
    readonly id: string;
}
