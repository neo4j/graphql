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

import Cypher from "@neo4j/cypher-builder";
import type { AttributeAdapter } from "../../../../schema-model/attribute/model-adapters/AttributeAdapter";
import type { QueryASTContext } from "../QueryASTContext";
import type { QueryASTNode } from "../QueryASTNode";
import { InputField } from "./InputField";

export class UpsertSetField extends InputField {
    private attribute: AttributeAdapter;
    private param: Cypher.Param;

    constructor({ attribute, value }: { attribute: AttributeAdapter; value: any }) {
        super();
        this.attribute = attribute;
        this.param = new Cypher.Param(value);
    }

    public getSetParams(context: QueryASTContext<Cypher.Node>): Cypher.SetParam[] {
        const attributeName = this.attribute.databaseName;
        const property = context.target.property(attributeName);

        return [[property, this.param]];
    }

    public getUpsertProperties(_context: QueryASTContext): Record<string, Cypher.Param> {
        const attributeName = this.attribute.databaseName;
        return {
            [attributeName]: this.param,
        };
    }

    public getChildren(): QueryASTNode[] {
        return [];
    }

    public print(): string {
        return `${super.print()} <${this.attribute.name}>`;
    }
}
