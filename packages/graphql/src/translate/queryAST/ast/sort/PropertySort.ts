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

import type Cypher from "@neo4j/cypher-builder";
import type { SortField } from "./Sort";
import { Sort } from "./Sort";
import type { AttributeAdapter } from "../../../../schema-model/attribute/model-adapters/AttributeAdapter";

export class PropertySort extends Sort {
    private attribute: AttributeAdapter;
    private direction: Cypher.Order;

    constructor({ attribute, direction }: { attribute: AttributeAdapter; direction: Cypher.Order }) {
        super();
        this.attribute = attribute;
        this.direction = direction;
    }

    public getSortFields(variable: Cypher.Variable | Cypher.Property): SortField[] {
        const nodeProperty = variable.property(this.attribute.databaseName); // getDBName?
        return [[nodeProperty, this.direction]];
    }

    public getProjectionField(): string | Record<string, Cypher.Expr> {
        return this.attribute.databaseName;
    }
}
