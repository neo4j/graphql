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

import type { Relationship } from "../../schema-model/relationship/Relationship";
import { upperFirst } from "../../utils/upper-first";
import { EntityTypeNames } from "./EntityTypeNames";

export class NestedEntityTypeNames extends EntityTypeNames {
    private relationship: Relationship;

    constructor(relationship: Relationship) {
        super(`${relationship.source.name}${upperFirst(relationship.name)}`);
        this.relationship = relationship;
    }

    public get propertiesType(): string | undefined {
        return this.relationship.propertiesTypeName;
    }

    public get propertiesSortType(): string | undefined {
        if (!this.relationship.propertiesTypeName) {
            return;
        }
        return `${this.relationship.propertiesTypeName}Sort`;
    }

    public get nodeSortType(): string {
        return `${this.relationship.target.name}Sort`;
    }
}
